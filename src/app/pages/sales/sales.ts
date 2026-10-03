import {
  Component,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  ApiService
} from '../../core/services/api';

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

  // =========================================================
  // SERVICES
  // =========================================================

  private readonly api =
    inject(ApiService);


  // =========================================================
  // CONFIGURACIÓN
  // =========================================================

  /**
   * Usuario que registra la venta.
   *
   * Este ID debe existir en public.profiles.
   */
  readonly sellerId =
    '7c29ed96-5076-402b-a748-0d288ed95298';


  // =========================================================
  // PRODUCTOS
  // =========================================================

  readonly products =
    signal<Product[]>([]);

  readonly loading =
    signal(true);

  readonly error =
    signal('');


  // =========================================================
  // BÚSQUEDA
  // =========================================================

  readonly search =
    signal('');


  // =========================================================
  // CARRITO / TICKET
  // =========================================================

  readonly cart =
    signal<CartItem[]>([]);


  // =========================================================
  // VENTA REGISTRADA
  // =========================================================

  readonly sale =
    signal<SaleResponse | null>(null);


  // =========================================================
  // COMPUTED
  // =========================================================

  /**
   * Productos filtrados por:
   *
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


    return this.products().filter(
      product => {

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

      }
    );

  });


  /**
   * Cantidad total de productos
   * actualmente dentro del ticket.
   */
  readonly cartQuantity = computed(() => {

    return this.cart().reduce(
      (
        total,
        item
      ) =>
        total + item.quantity,
      0
    );

  });


  /**
   * Total de la venta.
   */
  readonly cartTotal = computed(() => {

    return this.cart().reduce(
      (
        total,
        item
      ) =>
        total +
        (
          Number(item.product.price) *
          item.quantity
        ),
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


  /**
   * Socio propietario de la venta.
   *
   * El sistema lo determina automáticamente
   * utilizando owner_id de los productos.
   *
   * Si el carrito está vacío, devuelve null.
   */
  readonly partnerId = computed(() => {

    const items =
      this.cart();


    if (!items.length) {
      return null;
    }


    return items[0].product.owner_id;

  });


  /**
   * Comprueba si todos los productos
   * pertenecen al mismo socio.
   *
   * Esto es necesario porque una venta
   * solamente tiene un partner_id.
   */
  readonly samePartner = computed(() => {

    const items =
      this.cart();


    if (items.length <= 1) {
      return true;
    }


    const firstOwnerId =
      items[0].product.owner_id;


    return items.every(
      item =>
        item.product.owner_id ===
        firstOwnerId
    );

  });


  // =========================================================
  // CICLO DE VIDA
  // =========================================================

  ngOnInit(): void {

    this.loadProducts();

  }


  // =========================================================
  // CARGAR PRODUCTOS
  // =========================================================

  loadProducts(): void {

    this.loading.set(true);

    this.error.set('');


    this.api
      .getProducts()
      .subscribe({

        next: (response) => {

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


          this.error.set(
            'No se pudieron cargar los productos.'
          );


          this.loading.set(false);

        }

      });

  }


  // =========================================================
  // BÚSQUEDA
  // =========================================================

  onSearchChange(
    value: string
  ): void {

    this.search.set(value);

  }


  // =========================================================
  // AGREGAR PRODUCTO
  // =========================================================

  addToCart(
    product: Product
  ): void {

    this.error.set('');


    // -------------------------------------------------------
    // VALIDAR STOCK
    // -------------------------------------------------------

    if (product.stock <= 0) {

      this.error.set(
        `El producto "${product.name}" no tiene stock disponible.`
      );

      return;

    }


    // -------------------------------------------------------
    // VALIDAR SOCIO
    // -------------------------------------------------------

    const currentCart =
      this.cart();


    if (currentCart.length > 0) {

      const currentPartnerId =
        currentCart[0].product.owner_id;


      /**
       * No permitimos mezclar productos
       * de diferentes socios en una misma venta.
       *
       * La tabla sales solamente tiene
       * un partner_id.
       */
      if (
        product.owner_id !==
        currentPartnerId
      ) {

        this.error.set(
          'No puedes mezclar productos de diferentes socios en el mismo ticket.'
        );

        return;

      }

    }


    // -------------------------------------------------------
    // BUSCAR SI YA EXISTE
    // -------------------------------------------------------

    const existingItem =
      currentCart.find(
        item =>
          item.product.id ===
          product.id
      );


    // -------------------------------------------------------
    // PRODUCTO YA EXISTE
    // -------------------------------------------------------

    if (existingItem) {

      /**
       * No permitir superar el stock.
       */
      if (
        existingItem.quantity >=
        product.stock
      ) {

        this.error.set(
          `No hay más stock disponible de "${product.name}".`
        );

        return;

      }


      this.cart.set(
        currentCart.map(
          item => {

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

          }
        )
      );


      return;

    }


    // -------------------------------------------------------
    // PRODUCTO NUEVO
    // -------------------------------------------------------

    this.cart.set([

      ...currentCart,

      {
        product,
        quantity: 1
      }

    ]);

  }


  // =========================================================
  // AUMENTAR CANTIDAD
  // =========================================================

  increaseQuantity(
    productId: string
  ): void {

    this.cart.update(
      items => {

        return items.map(
          item => {

            if (
              item.product.id !==
              productId
            ) {

              return item;

            }


            // -------------------------------------------------
            // VALIDAR STOCK
            // -------------------------------------------------

            if (
              item.quantity >=
              item.product.stock
            ) {

              this.error.set(
                `No hay más stock disponible de "${item.product.name}".`
              );

              return item;

            }


            this.error.set('');


            return {

              ...item,

              quantity:
                item.quantity + 1

            };

          }
        );

      }
    );

  }


  // =========================================================
  // DISMINUIR CANTIDAD
  // =========================================================

  decreaseQuantity(
    productId: string
  ): void {

    this.error.set('');


    this.cart.update(
      items => {

        return items
          .map(
            item => {

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

            }
          )
          .filter(
            item =>
              item.quantity > 0
          );

      }
    );

  }


  // =========================================================
  // ELIMINAR DEL TICKET
  // =========================================================

  removeFromCart(
    productId: string
  ): void {

    this.cart.update(
      items => {

        return items.filter(
          item =>
            item.product.id !==
            productId
        );

      }
    );

    this.error.set('');

  }


  // =========================================================
  // VACIAR TICKET
  // =========================================================

  clearCart(): void {

    this.cart.set([]);

    this.sale.set(null);

    this.error.set('');

  }


  // =========================================================
  // REGISTRAR VENTA
  // =========================================================

  registerSale(): void {

    this.error.set('');


    // -------------------------------------------------------
    // VALIDAR CARRITO
    // -------------------------------------------------------

    if (!this.hasItems()) {

      this.error.set(
        'Agrega al menos un producto al ticket.'
      );

      return;

    }


    // -------------------------------------------------------
    // VALIDAR SOCIO
    // -------------------------------------------------------

    const partnerId =
      this.partnerId();


    if (!partnerId) {

      this.error.set(
        'No se pudo determinar el socio propietario de los productos.'
      );

      return;

    }


    // -------------------------------------------------------
    // VALIDAR QUE TODOS PERTENEZCAN AL MISMO SOCIO
    // -------------------------------------------------------

    if (!this.samePartner()) {

      this.error.set(
        'Los productos del ticket pertenecen a diferentes socios. Realiza una venta separada para cada socio.'
      );

      return;

    }


    // -------------------------------------------------------
    // PREPARAR ITEMS
    // -------------------------------------------------------

    const items =
      this.cart().map(
        item => ({

          product_id:
            item.product.id,

          /**
           * El propietario se obtiene
           * automáticamente del producto.
           */
          owner_id:
            item.product.owner_id,

          quantity:
            item.quantity,

          /**
           * Se utiliza el precio actual
           * del producto.
           */
          unit_price:
            Number(item.product.price)

        })
      );


    // -------------------------------------------------------
    // PREPARAR VENTA
    // -------------------------------------------------------

    const sale: SaleCreate = {

      /**
       * Usuario que registra la venta.
       */
      seller_id:
        this.sellerId,

      /**
       * Socio propietario de los productos.
       *
       * Se determina automáticamente.
       */
      partner_id:
        partnerId,

      /**
       * Productos vendidos.
       */
      items

    };


    // -------------------------------------------------------
    // DEBUG
    // -------------------------------------------------------

    console.log(
      'Venta enviada al backend:',
      sale
    );


    // -------------------------------------------------------
    // ENVIAR AL BACKEND
    // -------------------------------------------------------

    this.api
      .createSale(sale)
      .subscribe({

        // ===================================================
        // SUCCESS
        // ===================================================

        next: (
          response
        ) => {

          console.log(
            'Venta registrada correctamente:',
            response
          );


          // -----------------------------------------------
          // GUARDAR TICKET
          // -----------------------------------------------

          this.sale.set(
            response
          );


          // -----------------------------------------------
          // LIMPIAR CARRITO
          // -----------------------------------------------

          this.cart.set([]);


          // -----------------------------------------------
          // ACTUALIZAR PRODUCTOS / STOCK
          // -----------------------------------------------

          this.loadProducts();

        },


        // ===================================================
        // ERROR
        // ===================================================

        error: (
          error
        ) => {

          console.error(
            'Error al registrar venta:',
            error
          );


          console.error(
            'Status:',
            error?.status
          );


          console.error(
            'Respuesta del backend:',
            error?.error
          );


          const detail =
            error?.error?.detail;


          // -----------------------------------------------
          // MOSTRAR ERROR DE FASTAPI
          // -----------------------------------------------

          if (
            typeof detail ===
            'string'
          ) {

            this.error.set(
              detail
            );

            return;

          }


          // -----------------------------------------------
          // MOSTRAR ERROR DE VALIDACIÓN 422
          // -----------------------------------------------

          if (
            Array.isArray(detail)
          ) {

            const messages =
              detail
                .map(
                  item => {

                    const location =
                      Array.isArray(
                        item?.loc
                      )
                        ? item.loc.join('.')
                        : 'campo';


                    return `${location}: ${item?.msg ?? 'valor inválido'}`;

                  }
                )
                .join(' | ');


            this.error.set(
              messages ||
              'Los datos enviados no son válidos.'
            );

            return;

          }


          // -----------------------------------------------
          // ERROR GENÉRICO
          // -----------------------------------------------

          this.error.set(
            'No se pudo registrar la venta.'
          );

        }

      });

  }


  // =========================================================
  // NUEVA VENTA
  // =========================================================

  newSale(): void {

    this.sale.set(null);

    this.cart.set([]);

    this.error.set('');

    this.search.set('');

    this.loadProducts();

  }


  // =========================================================
  // OBTENER CANTIDAD
  // =========================================================

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


  // =========================================================
  // COMPROBAR SI ESTÁ EN EL TICKET
  // =========================================================

  isInCart(
    productId: string
  ): boolean {

    return this.cart().some(
      item =>
        item.product.id ===
        productId
    );

  }


  // =========================================================
  // FORMATEAR MONEDA
  // =========================================================

  formatCurrency(
    value: number
  ): string {

    return new Intl.NumberFormat(
      'es-MX',
      {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
      }
    ).format(value);

  }

}