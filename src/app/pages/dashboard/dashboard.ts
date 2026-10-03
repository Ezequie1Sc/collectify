import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  Header
} from '../../components/header/header';

import {
  ProductCard
} from '../../components/product-card/product-card';

import {
  ProductForm
} from '../../components/product-form/product-form';

import {
  EmptyState
} from '../../components/empty-state/empty-state';

import {
  ApiService
} from '../../core/services/api';

import {
  Product
} from '../../core/models/product';


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

  private readonly api =
    inject(ApiService);


  // =========================================================
  // STATE
  // =========================================================

  readonly products =
    signal<Product[]>([]);

  readonly loading =
    signal(true);

  readonly error =
    signal('');

  readonly success =
    signal('');

  readonly editingProduct =
    signal<Product | null>(null);

  readonly deletingProductId =
    signal<string | null>(null);


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.loadProducts();

  }


  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  loadProducts(): void {

    this.loading.set(true);

    this.error.set('');

    this.api.getProducts().subscribe({

      next: (response) => {

        console.log(
          'Productos recibidos:',
          response
        );

        this.products.set(
          response.data ?? []
        );

        this.loading.set(false);

      },


      error: (error) => {

        console.error(
          'Error al cargar productos:',
          error
        );

        this.products.set([]);

        this.error.set(
          error?.error?.detail ||
          'No se pudieron cargar los productos.'
        );

        this.loading.set(false);

      }

    });

  }


  // =========================================================
  // EDIT PRODUCT
  // =========================================================

  editProduct(
    product: Product
  ): void {

    console.log(
      'Producto seleccionado para editar:',
      product
    );

    this.editingProduct.set(
      product
    );


    setTimeout(() => {

      document
        .getElementById(
          'product-form'
        )
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

    });

  }


  // =========================================================
  // CANCEL EDIT
  // =========================================================

  cancelEdit(): void {

    this.editingProduct.set(null);

  }


  // =========================================================
  // PRODUCT SAVED
  // =========================================================

  onProductSaved(): void {

    console.log(
      'Producto guardado correctamente.'
    );

    this.editingProduct.set(
      null
    );

    this.success.set(
      'Producto guardado correctamente.'
    );

    this.loadProducts();


    // Quitamos el mensaje después
    // de unos segundos.

    setTimeout(() => {

      this.success.set('');

    }, 3000);

  }


  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  deleteProduct(
    product: Product
  ): void {

    if (!product.id) {

      console.error(
        'No se puede eliminar el producto porque no tiene ID.'
      );

      return;

    }


    const confirmed =
      window.confirm(
        `¿Estás seguro de que deseas eliminar "${product.name}"?`
      );


    if (!confirmed) {

      return;

    }


    this.deletingProductId.set(
      product.id
    );

    this.error.set('');


    this.api
      .deleteProduct(product.id)
      .subscribe({

        next: (response) => {

          console.log(
            'Respuesta al eliminar producto:',
            response
          );


          this.products.update(
            products =>
              products.filter(
                currentProduct =>
                  currentProduct.id !==
                  product.id
              )
          );


          this.deletingProductId.set(
            null
          );


          if (
            this.editingProduct()?.id ===
            product.id
          ) {

            this.editingProduct.set(
              null
            );

          }


          this.success.set(
            response.deleted
              ? 'Producto eliminado correctamente.'
              : 'Producto desactivado correctamente.'
          );


          setTimeout(() => {

            this.success.set('');

          }, 3000);

        },


        error: (error) => {

          console.error(
            'Error al eliminar producto:',
            error
          );


          this.deletingProductId.set(
            null
          );


          this.error.set(
            error?.error?.detail ||
            error?.error?.message ||
            'No se pudo eliminar el producto.'
          );

        }

      });

  }


  // =========================================================
  // STOCK TOTAL
  // =========================================================

  getTotalStock(): number {

    return this.products()
      .reduce(
        (
          total,
          product
        ) =>
          total + product.stock,
        0
      );

  }

}