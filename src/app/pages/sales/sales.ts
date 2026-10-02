import {
  Component,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api';

import {
  Product
} from '../../core/models/product';

import {
  SaleCreate,
  SaleResponse
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
    FormsModule
  ],

  templateUrl: './sales.html',
  styleUrl: './sales.scss'
})
export class Sales implements OnInit {

  // ============================================
  // SERVICES
  // ============================================

  private readonly api = inject(ApiService);


  // ============================================
  // CONFIGURACIÓN
  // ============================================

  readonly ownerId =
    '7c29ed96-5076-402b-a748-0d288ed95298';

  readonly sellerId =
    '7c29ed96-5076-402b-a748-0d288ed95298';


  // ============================================
  // PRODUCTOS
  // ============================================

  readonly products =
    signal<Product[]>([]);

  readonly loading =
    signal(true);

  readonly error =
    signal('');


  // ============================================
  // BÚSQUEDA
  // ============================================

  readonly search =
    signal('');


  // ============================================
  // CARRITO / TICKET
  // ============================================

  readonly cart =
    signal<CartItem[]>([]);


  // ============================================
  // VENTA REGISTRADA
  // ============================================

  readonly sale =
    signal<SaleResponse | null>(null);


  // ============================================
  // COMPUTED
  // ============================================

  /**
   * Productos filtrados por:
   * - nombre
   * - categoría
   * - SKU
   */
  readonly filteredProducts = computed(() => {

    const search =
      this.search()
        .trim()
        .toLowerCase();

    if (!search) {
      return this.products();
    }

    return this.products().filter(product => {

      const name =
        product.name?.toLowerCase() ?? '';

      const category =
        product.category?.toLowerCase() ?? '';

      const sku =
        product.sku?.toLowerCase() ?? '';

      return (
        name.includes(search) ||
        category.includes(search) ||
        sku.includes(search)
      );
    });
  });


  /**
   * Cantidad total de productos
   * actualmente dentro del ticket.
   */
  readonly cartQuantity = computed(() => {

    return this.cart().reduce(
      (total, item) =>
        total + item.quantity,
      0
    );
  });


  /**
   * Total de la venta.
   */
  readonly cartTotal = computed(() => {

    return this.cart().reduce(
      (total, item) =>
        total +
        (item.product.price * item.quantity),
      0
    );
  });


  /**
   * Indica si existe algún producto
   * dentro del ticket.
   */
  readonly hasItems = computed(() => {

    return this.cart().length > 0;
  });


  // ============================================
  // CICLO DE VIDA
  // ============================================

  ngOnInit(): void {

    this.loadProducts();
  }


  // ============================================
  // CARGAR PRODUCTOS
  // ============================================

  loadProducts(): void {

    this.loading.set(true);
    this.error.set('');

    this.api
      .getProducts(this.ownerId)
      .subscribe({

        next: (response) => {

          this.products.set(
            response.data
          );

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


  // ============================================
  // BÚSQUEDA
  // ============================================

  onSearchChange(value: string): void {

    this.search.set(value);
  }


  // ============================================
  // AGREGAR PRODUCTO
  // ============================================

  addToCart(product: Product): void {

    // No permitir productos sin stock.
    if (product.stock <= 0) {

      return;
    }


    const currentCart =
      this.cart();

    const existingItem =
      currentCart.find(
        item =>
          item.product.id === product.id
      );


    // ==========================================
    // PRODUCTO YA EXISTE EN EL TICKET
    // ==========================================

    if (existingItem) {

      // No permitir superar el stock.
      if (
        existingItem.quantity >=
        product.stock
      ) {

        return;
      }

      this.cart.set(
        currentCart.map(item => {

          if (
            item.product.id ===
            product.id
          ) {

            return {
              ...item,
              quantity:
                item.quantity + 1
            };
          }

          return item;
        })
      );

      return;
    }


    // ==========================================
    // PRODUCTO NUEVO
    // ==========================================

    this.cart.set([
      ...currentCart,

      {
        product,
        quantity: 1
      }
    ]);
  }


  // ============================================
  // AUMENTAR CANTIDAD
  // ============================================

  increaseQuantity(
    productId: string
  ): void {

    this.cart.update(items => {

      return items.map(item => {

        if (
          item.product.id !==
          productId
        ) {

          return item;
        }


        // No superar stock disponible.
        if (
          item.quantity >=
          item.product.stock
        ) {

          return item;
        }


        return {
          ...item,
          quantity:
            item.quantity + 1
        };
      });
    });
  }


  // ============================================
  // DISMINUIR CANTIDAD
  // ============================================

  decreaseQuantity(
    productId: string
  ): void {

    this.cart.update(items => {

      return items
        .map(item => {

          if (
            item.product.id !==
            productId
          ) {

            return item;
          }


          return {
            ...item,
            quantity:
              item.quantity - 1
          };
        })
        .filter(
          item =>
            item.quantity > 0
        );
    });
  }


  // ============================================
  // ELIMINAR DEL TICKET
  // ============================================

  removeFromCart(
    productId: string
  ): void {

    this.cart.update(items => {

      return items.filter(
        item =>
          item.product.id !==
          productId
      );
    });
  }


  // ============================================
  // VACIAR TICKET
  // ============================================

  clearCart(): void {

    this.cart.set([]);

    this.sale.set(null);

    this.error.set('');
  }


  // ============================================
  // REGISTRAR VENTA
  // ============================================

  registerSale(): void {

    // No registrar una venta vacía.
    if (!this.hasItems()) {

      this.error.set(
        'Agrega al menos un producto al ticket.'
      );

      return;
    }


    this.error.set('');


    // ==========================================
    // PREPARAR REQUEST
    // ==========================================

    const sale: SaleCreate = {

      seller_id:
        this.sellerId,

      items:
        this.cart().map(item => ({

          product_id:
            item.product.id,

          owner_id:
            item.product.owner_id,

          quantity:
            item.quantity,

          // IMPORTANTE:
          // El backend requiere unit_price.
          unit_price:
            item.product.price
        }))
    };


    console.log(
      'Venta enviada:',
      sale
    );


    // ==========================================
    // ENVIAR AL BACKEND
    // ==========================================

    this.api
      .createSale(sale)
      .subscribe({

        next: (response) => {

          console.log(
            'Venta registrada:',
            response
          );


          // Guardar venta registrada
          // para mostrar el ticket.
          this.sale.set(response);


          // Vaciar carrito.
          this.cart.set([]);


          // Actualizar productos porque
          // el stock cambió.
          this.loadProducts();
        },


        error: (error) => {

          console.error(
            'Error al registrar venta:',
            error
          );


          const detail =
            error?.error?.detail;


          if (typeof detail === 'string') {

            this.error.set(detail);

          } else {

            this.error.set(
              'No se pudo registrar la venta.'
            );
          }
        }

      });
  }


  // ============================================
  // NUEVA VENTA
  // ============================================

  newSale(): void {

    this.sale.set(null);

    this.cart.set([]);

    this.error.set('');

    this.search.set('');

    this.loadProducts();
  }


  // ============================================
  // OBTENER CANTIDAD DE UN PRODUCTO
  // ============================================

  getCartQuantity(
    productId: string
  ): number {

    const item =
      this.cart().find(
        item =>
          item.product.id ===
          productId
      );

    return item?.quantity ?? 0;
  }


  // ============================================
  // COMPROBAR SI ESTÁ EN EL TICKET
  // ============================================

  isInCart(
    productId: string
  ): boolean {

    return this.cart().some(
      item =>
        item.product.id ===
        productId
    );
  }
}