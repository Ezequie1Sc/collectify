import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, finalize } from 'rxjs';

import { Header } from '../../components/header/header';
import { ApiService } from '../../core/services/api';
import { Product } from '../../core/models/product';
import {
  SaleCreate,
  SaleResponse,
} from '../../core/models/sale';

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Header,
  ],
  templateUrl: './sales.html',
  styleUrl: './sales.scss',
})
export class Sales implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  private productsRequest?: Subscription;

  private readonly currencyFormatter = new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    },
  );

  // Conserva el vendedor que ya utilizabas.
  readonly sellerId = '7c29ed96-5076-402b-a748-0d288ed95298';

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly submitting = signal(false);

  readonly loadError = signal('');
  readonly error = signal('');

  readonly search = signal('');
  readonly cart = signal<CartItem[]>([]);
  readonly sale = signal<SaleResponse | null>(null);

  readonly filteredProducts = computed(() => {
    const query = this.normalize(this.search().trim());

    if (!query) {
      return this.products();
    }

    return this.products().filter(product =>
      [
        product.name,
        product.category,
        product.sku,
      ].some(value =>
        this.normalize(value ?? '').includes(query),
      ),
    );
  });

  readonly cartQuantity = computed(() =>
    this.cart().reduce(
      (total, item) => total + item.quantity,
      0,
    ),
  );

  readonly cartTotal = computed(() =>
    this.cart().reduce(
      (total, item) =>
        total + Number(item.product.price) * item.quantity,
      0,
    ),
  );

  readonly hasItems = computed(() => this.cart().length > 0);

  readonly partnerId = computed(() =>
    this.cart()[0]?.product.owner_id ?? null,
  );

  readonly samePartner = computed(() => {
    const items = this.cart();
    const ownerId = items[0]?.product.owner_id;

    return items.every(item =>
      item.product.owner_id === ownerId,
    );
  });

  // Comprueba el ticket contra el último inventario recibido.
  readonly cartIssue = computed(() => {
    for (const item of this.cart()) {
      const current = this.products().find(
        product => product.id === item.product.id,
      );

      if (!current) {
        return `"${item.product.name}" ya no está disponible. Retíralo del ticket.`;
      }

      if (
        item.quantity < 1 ||
        !Number.isInteger(item.quantity) ||
        item.quantity > this.stockOf(current)
      ) {
        return `Revisa la cantidad de "${item.product.name}". Stock actual: ${this.stockOf(current)}.`;
      }

      if (
        !Number.isFinite(Number(current.price)) ||
        Number(current.price) < 0
      ) {
        return `"${item.product.name}" tiene un precio inválido.`;
      }

      if (!current.owner_id) {
        return `"${item.product.name}" no tiene un socio asignado.`;
      }
    }

    if (!this.samePartner()) {
      return 'Los productos deben pertenecer al mismo socio.';
    }

    return '';
  });

  readonly canRegister = computed(() =>
    this.hasItems() &&
    !this.loading() &&
    !this.submitting() &&
    !this.loadError() &&
    !this.sale() &&
    !this.cartIssue(),
  );

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    if (this.submitting()) {
      return;
    }

    this.productsRequest?.unsubscribe();

    this.loading.set(true);
    this.loadError.set('');

    this.productsRequest = this.api.getProducts()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: response => {
          const products = response.data ?? [];

          this.products.set(products);

          // Mantiene las cantidades y actualiza precio/stock
          // de los productos que ya están en el ticket.
          this.cart.update(items =>
            items.map(item => ({
              ...item,
              product: products.find(
                product => product.id === item.product.id,
              ) ?? item.product,
            })),
          );
        },

        error: error => {
          this.loadError.set(
            this.readError(
              error,
              'No se pudieron actualizar los productos.',
            ),
          );
        },
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  addToCart(product: Product): void {
    if (
      this.submitting() ||
      this.loading() ||
      this.sale() ||
      this.loadError()
    ) {
      return;
    }

    this.error.set('');

    if (!product.owner_id) {
      this.error.set(
        'Este producto no tiene un socio asignado.',
      );
      return;
    }

    if (this.stockOf(product) <= 0) {
      this.error.set(
        `"${product.name}" no tiene stock disponible.`,
      );
      return;
    }

    if (
      this.hasItems() &&
      product.owner_id !== this.partnerId()
    ) {
      this.error.set(
        'No puedes mezclar productos de diferentes socios en el mismo ticket.',
      );
      return;
    }

    const quantity = this.getCartQuantity(product.id);

    if (quantity >= this.stockOf(product)) {
      this.error.set(
        `No hay más stock disponible de "${product.name}".`,
      );
      return;
    }

    this.cart.update(items => {
      const exists = items.some(
        item => item.product.id === product.id,
      );

      return exists
        ? items.map(item =>
            item.product.id === product.id
              ? {
                  product,
                  quantity: item.quantity + 1,
                }
              : item,
          )
        : [...items, { product, quantity: 1 }];
    });
  }

  increaseQuantity(productId: string): void {
    const product = this.products().find(
      current => current.id === productId,
    );

    if (product) {
      this.addToCart(product);
    }
  }

  decreaseQuantity(productId: string): void {
    if (this.submitting()) {
      return;
    }

    this.error.set('');

    this.cart.update(items =>
      items
        .map(item =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter(item => item.quantity > 0),
    );
  }

  removeFromCart(productId: string): void {
    if (this.submitting()) {
      return;
    }

    this.cart.update(items =>
      items.filter(item => item.product.id !== productId),
    );

    this.error.set('');
  }

  clearCart(): void {
    if (this.submitting()) {
      return;
    }

    this.cart.set([]);
    this.error.set('');
  }

  registerSale(): void {
    if (this.submitting() || this.sale()) {
      return;
    }

    this.error.set('');

    if (this.loading() || this.loadError()) {
      this.error.set(
        'Actualiza el inventario antes de registrar la venta.',
      );
      return;
    }

    if (!this.hasItems()) {
      this.error.set('Agrega al menos un producto.');
      return;
    }

    if (this.cartIssue()) {
      this.error.set(this.cartIssue());
      return;
    }

    const partnerId = this.partnerId();

    if (!partnerId) {
      this.error.set(
        'No se pudo determinar el socio propietario.',
      );
      return;
    }

    const payload: SaleCreate = {
      seller_id: this.sellerId,
      partner_id: partnerId,
      items: this.cart().map(item => ({
        product_id: item.product.id,
        owner_id: item.product.owner_id,
        quantity: item.quantity,
        unit_price: Number(item.product.price),
      })),
    };

    this.submitting.set(true);

    this.api.createSale(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: response => {
          this.sale.set(response);
          this.cart.set([]);
          this.submitting.set(false);
          this.loadProducts();
        },

        error: error => {
          this.error.set(
            this.readError(
              error,
              'No se pudo confirmar la venta. Comprueba si se registró antes de volver a enviarla.',
            ),
          );
        },
      });
  }

  newSale(): void {
    if (this.submitting()) {
      return;
    }

    this.sale.set(null);
    this.cart.set([]);
    this.search.set('');
    this.error.set('');

    this.loadProducts();
  }

  getCartQuantity(productId: string): number {
    return this.cart().find(
      item => item.product.id === productId,
    )?.quantity ?? 0;
  }

  isInCart(productId: string): boolean {
    return this.getCartQuantity(productId) > 0;
  }

  stockOf(product: Product): number {
    const stock = Number(product.stock);

    return Number.isFinite(stock)
      ? Math.max(0, Math.floor(stock))
      : 0;
  }

  formatCurrency(value: number): string {
    return this.currencyFormatter.format(Number(value));
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private readError(error: unknown, fallback: string): string {
    const response = error as {
      error?: { detail?: unknown; message?: unknown };
    } | null;

    const detail = response?.error?.detail;

    if (typeof detail === 'string') {
      return detail;
    }

    if (Array.isArray(detail)) {
      const messages = detail.map(
        (item: { loc?: unknown[]; msg?: string }) =>
          `${item.loc?.join('.') ?? 'Campo'}: ${item.msg ?? 'Valor inválido'}`,
      );

      return messages.join(' · ') || fallback;
    }

    const message = response?.error?.message;

    return typeof message === 'string'
      ? message
      : fallback;
  }
}