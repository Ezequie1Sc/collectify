import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  DatePipe,
  DecimalPipe,
} from '@angular/common';

import {
  NavigationEnd,
  Router,
  RouterLink,
} from '@angular/router';

import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

import {
  EMPTY,
  Subject,
  catchError,
  debounceTime,
  defer,
  filter,
  finalize,
  map,
  merge,
  startWith,
  switchMap,
  tap,
  timeout,
} from 'rxjs';

import { Header } from '../../components/header/header';
import { ProductCard } from '../../components/product-card/product-card';
import { ProductForm } from '../../components/product-form/product-form';
import { EmptyState } from '../../components/empty-state/empty-state';

import { ApiService } from '../../core/services/api';
import { Product } from '../../core/models/product';

type StockFilter = 'all' | 'available' | 'low' | 'empty';
type SortOption = 'name' | 'stock-desc' | 'stock-asc';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    Header,
    ProductCard,
    ProductForm,
    EmptyState,
    RouterLink,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly refreshProducts$ = new Subject<void>();
  private successTimer?: ReturnType<typeof setTimeout>;

  @ViewChild('formHeading')
  private formHeading?: ElementRef<HTMLHeadingElement>;

  @ViewChild('inventoryHeading')
  private inventoryHeading?: ElementRef<HTMLHeadingElement>;

  // Cambia este valor para ajustar el criterio de stock bajo.
  readonly lowStockThreshold = 5;

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly hasLoaded = signal(false);

  readonly error = signal('');
  readonly actionError = signal('');
  readonly success = signal('');

  readonly editingProduct = signal<Product | null>(null);
  readonly deletingProductId = signal<string | null>(null);

  readonly search = signal('');
  readonly stockFilter = signal<StockFilter>('all');
  readonly sortBy = signal<SortOption>('name');
  readonly lastUpdated = signal<Date | null>(null);

  readonly filterOptions: {
    value: StockFilter;
    label: string;
  }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'available', label: 'Stock suficiente' },
    { value: 'low', label: 'Stock bajo' },
    { value: 'empty', label: 'Sin stock' },
  ];

  readonly totalStock = computed(() =>
    this.products().reduce(
      (total, product) => total + this.stockOf(product),
      0,
    ),
  );

  readonly availableCount = computed(() =>
    this.products().filter(
      product => this.stockOf(product) > this.lowStockThreshold,
    ).length,
  );

  readonly lowStockCount = computed(() =>
    this.products().filter(product => {
      const stock = this.stockOf(product);
      return stock > 0 && stock <= this.lowStockThreshold;
    }).length,
  );

  readonly emptyCount = computed(() =>
    this.products().filter(
      product => this.stockOf(product) === 0,
    ).length,
  );

  readonly stockSegments = computed(() => {
    const total = this.products().length;

    const definitions = [
      {
        label: 'Stock suficiente',
        count: this.availableCount(),
        color: '#252525',
        filter: 'available' as StockFilter,
      },
      {
        label: 'Stock bajo',
        count: this.lowStockCount(),
        color: '#8d8d98',
        filter: 'low' as StockFilter,
      },
      {
        label: 'Sin stock',
        count: this.emptyCount(),
        color: '#dedee4',
        filter: 'empty' as StockFilter,
      },
    ];

    let offset = 0;

    return definitions.map(segment => {
      const percent = total ? (segment.count / total) * 100 : 0;

      const result = {
        ...segment,
        percent,
        offset,
      };

      offset += percent;
      return result;
    });
  });

  readonly topStockProducts = computed(() => {
    const sorted = [...this.products()]
      .filter(product => this.stockOf(product) > 0)
      .sort((a, b) => {
        const difference = this.stockOf(b) - this.stockOf(a);

        return difference ||
          a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      })
      .slice(0, 6);

    const maximum = sorted.length
      ? this.stockOf(sorted[0])
      : 0;

    return sorted.map(product => ({
      product,
      stock: this.stockOf(product),
      width: maximum
        ? (this.stockOf(product) / maximum) * 100
        : 0,
    }));
  });

  readonly attentionProducts = computed(() =>
    [...this.products()]
      .filter(product =>
        this.stockOf(product) <= this.lowStockThreshold,
      )
      .sort((a, b) => this.stockOf(a) - this.stockOf(b)),
  );

  readonly filteredProducts = computed(() => {
    const query = this.normalize(this.search().trim());
    const currentFilter = this.stockFilter();

    const result = this.products().filter(product => {
      const matchesSearch = !query ||
        this.normalize(product.name).includes(query);

      const stock = this.stockOf(product);

      const matchesStock =
        currentFilter === 'all' ||
        (currentFilter === 'available' &&
          stock > this.lowStockThreshold) ||
        (currentFilter === 'low' &&
          stock > 0 &&
          stock <= this.lowStockThreshold) ||
        (currentFilter === 'empty' && stock === 0);

      return matchesSearch && matchesStock;
    });

    return result.sort((a, b) => {
      if (this.sortBy() === 'stock-desc') {
        return this.stockOf(b) - this.stockOf(a);
      }

      if (this.sortBy() === 'stock-asc') {
        return this.stockOf(a) - this.stockOf(b);
      }

      return a.name.localeCompare(b.name, 'es', {
        sensitivity: 'base',
      });
    });
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.successTimer) {
        clearTimeout(this.successTimer);
      }
    });
  }

  ngOnInit(): void {
    const dashboardEntries$ = this.router.events.pipe(
      filter(
        (event): event is NavigationEnd =>
          event instanceof NavigationEnd,
      ),
      filter(event => {
        const path = event.urlAfterRedirects
          .split(/[?#]/)[0]
          .replace(/\/+$/, '');

        return path === '/dashboard';
      }),
      map(() => undefined),
    );

    merge(this.refreshProducts$, dashboardEntries$)
      .pipe(
        startWith(undefined),

        // Agrupa la carga inicial y el NavigationEnd de esa entrada.
        debounceTime(0),

        // Una actualización reemplaza cualquier consulta anterior.
        switchMap(() =>
          defer(() => {
            this.loading.set(true);
            this.error.set('');

            return this.api.getProducts().pipe(
              timeout({ first: 20000 }),

              tap(response => {
                this.products.set(response.data ?? []);
                this.hasLoaded.set(true);
                this.lastUpdated.set(new Date());
              }),

              // El error se maneja dentro de la consulta.
              // Así el flujo sigue funcionando para futuros reintentos.
              catchError(error => {
                this.error.set(
                  this.getErrorMessage(
                    error,
                    'No se pudieron cargar los productos. Intenta nuevamente.',
                  ),
                );

                return EMPTY;
              }),

              finalize(() => {
                this.loading.set(false);
              }),
            );
          }),
        ),

        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  loadProducts(): void {
    this.refreshProducts$.next();
  }

  stockOf(product: Product): number {
    const stock = Number(product.stock);
    return Number.isFinite(stock) ? Math.max(0, stock) : 0;
  }

  getTotalStock(): number {
    return this.totalStock();
  }

  setSort(value: string): void {
    if (
      value === 'name' ||
      value === 'stock-desc' ||
      value === 'stock-asc'
    ) {
      this.sortBy.set(value);
    }
  }

  resetFilters(): void {
    this.search.set('');
    this.stockFilter.set('all');
    this.sortBy.set('name');
  }

  showStockFilter(value: StockFilter): void {
    this.search.set('');
    this.stockFilter.set(value);
    this.focusSection(this.inventoryHeading);
  }

  showProduct(product: Product): void {
    this.stockFilter.set('all');
    this.search.set(product.name);
    this.focusSection(this.inventoryHeading);
  }

  startCreate(): void {
    this.editingProduct.set(null);
    this.focusSection(this.formHeading);
  }

  editProduct(product: Product): void {
    if (this.deletingProductId()) {
      return;
    }

    this.editingProduct.set(product);
    this.focusSection(this.formHeading);
  }

  cancelEdit(): void {
    this.editingProduct.set(null);
  }

  onProductSaved(): void {
    this.editingProduct.set(null);
    this.showSuccess('Producto guardado correctamente.');
    this.loadProducts();
  }

  deleteProduct(product: Product): void {
    if (
      !product.id ||
      this.deletingProductId() ||
      this.destroyRef.destroyed
    ) {
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar "${product.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.deletingProductId.set(product.id);
    this.actionError.set('');

    this.api.deleteProduct(product.id)
      .pipe(
        timeout({ first: 20000 }),
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.deletingProductId.set(null);
        }),
      )
      .subscribe({
        next: response => {
          this.products.update(products =>
            products.filter(current => current.id !== product.id),
          );

          if (this.editingProduct()?.id === product.id) {
            this.editingProduct.set(null);
          }

          this.showSuccess(
            response.deleted
              ? 'Producto eliminado correctamente.'
              : 'Producto desactivado correctamente.',
          );

          // Actualiza también los datos calculados desde el servidor.
          this.loadProducts();
        },

        error: error => {
          this.actionError.set(
            this.getErrorMessage(
              error,
              'No se pudo eliminar el producto. Actualiza el inventario para comprobar su estado.',
            ),
          );
        },
      });
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private focusSection(
    element?: ElementRef<HTMLHeadingElement>,
  ): void {
    const heading = element?.nativeElement;

    if (!heading) {
      return;
    }

    heading.focus({ preventScroll: true });

    heading.scrollIntoView({
      behavior: window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  private showSuccess(message: string): void {
    if (this.successTimer) {
      clearTimeout(this.successTimer);
    }

    this.success.set(message);

    this.successTimer = setTimeout(() => {
      this.success.set('');
    }, 4000);
  }

  private getErrorMessage(
    error: unknown,
    fallback: string,
  ): string {
    const response = error as {
      name?: string;
      error?: {
        detail?: unknown;
        message?: unknown;
      };
    } | null;

    if (response?.name === 'TimeoutError') {
      return 'La solicitud tardó demasiado. Actualiza para comprobar el estado de tus datos.';
    }

    const message = response?.error?.detail ??
      response?.error?.message;

    return typeof message === 'string' && message.trim()
      ? message
      : fallback;
  }
}