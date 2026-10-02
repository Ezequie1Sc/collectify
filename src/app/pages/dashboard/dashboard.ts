import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { Header } from '../../components/header/header';
import { ProductCard } from '../../components/product-card/product-card';
import { ProductForm } from '../../components/product-form/product-form';
import { EmptyState } from '../../components/empty-state/empty-state';

import { ApiService } from '../../core/services/api';
import { Product } from '../../core/models/product';

@Component({
  selector: 'app-dashboard',
  imports: [
    Header,
    ProductCard,
    ProductForm,
    EmptyState
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  private readonly api = inject(ApiService);

  readonly ownerId =
    '7c29ed96-5076-402b-a748-0d288ed95298';

  readonly products = signal<Product[]>([]);

  readonly loading = signal(true);

  readonly error = signal('');

  /**
   * Producto que actualmente se está editando.
   *
   * null = estamos creando un producto nuevo.
   */
  readonly editingProduct =
    signal<Product | null>(null);

  ngOnInit(): void {
    this.loadProducts();
  }

  /**
   * Cargar productos desde la API.
   */
  loadProducts(): void {

    this.loading.set(true);
    this.error.set('');

    this.api.getProducts(this.ownerId).subscribe({

      next: (response) => {

        this.products.set(response.data);

        this.loading.set(false);
      },

      error: (error) => {

        console.error(
          'Error al cargar productos:',
          error
        );

        this.error.set(
          'No se pudieron cargar los productos.'
        );

        this.loading.set(false);
      }

    });
  }

  /**
   * Seleccionar un producto para editar.
   */
  editProduct(product: Product): void {

    console.log(
      'Producto seleccionado para editar:',
      product
    );

    this.editingProduct.set(product);

    // Llevar al formulario.
    setTimeout(() => {

      document
        .getElementById('product-form')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

    });
  }

  /**
   * Cancelar la edición.
   */
  cancelEdit(): void {

    this.editingProduct.set(null);
  }

  /**
   * Se ejecuta cuando ProductForm crea o actualiza
   * correctamente un producto.
   */
  onProductSaved(): void {

    this.editingProduct.set(null);

    this.loadProducts();
  }

  /**
   * Stock total del inventario.
   */
  getTotalStock(): number {

    return this.products().reduce(
      (total, product) =>
        total + product.stock,
      0
    );
  }
}