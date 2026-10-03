import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api';

import {
  Product,
  ProductCreate,
  ProductUpdate
} from '../../core/models/product';

import {
  Partner
} from '../../core/models/partner';


@Component({
  selector: 'app-product-form',
  imports: [FormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss'
})
export class ProductForm implements OnInit, OnChanges {

  private readonly api = inject(ApiService);


  // =========================================================
  // INPUTS / OUTPUTS
  // =========================================================

  @Input()
  editingProduct: Product | null = null;

  @Output()
  productSaved = new EventEmitter<void>();

  @Output()
  cancelled = new EventEmitter<void>();


  // =========================================================
  // STATE
  // =========================================================

  protected readonly loading = signal(false);

  protected readonly loadingPartners = signal(false);

  protected readonly success = signal('');

  protected readonly error = signal('');

  protected readonly partners = signal<Partner[]>([]);


  // =========================================================
  // PRODUCT
  // =========================================================

  protected product: ProductCreate =
    this.createEmptyProduct();


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.loadPartners();

  }


  // =========================================================
  // CHANGES
  // =========================================================

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['editingProduct']) {

      const product =
        changes['editingProduct'].currentValue;

      if (product) {

        this.loadProductForEditing(product);

      } else {

        this.resetForm();

      }

    }

  }


  // =========================================================
  // GETTERS
  // =========================================================

  protected get isEditing(): boolean {

    return this.editingProduct !== null;

  }


  // =========================================================
  // CREATE EMPTY PRODUCT
  // =========================================================

  private createEmptyProduct(): ProductCreate {

    return {

      owner_id: '',

      name: '',

      description: '',

      category: '',

      sku: '',

      price: 0,

      cost: 0,

      stock: 0,

      image_url: ''

    };

  }


  // =========================================================
  // LOAD PARTNERS
  // =========================================================

  private loadPartners(): void {

    this.loadingPartners.set(true);

    this.api.getPartners().subscribe({

      next: (response) => {

        const activePartners =
          response.data.filter(
            partner => partner.is_active
          );

        this.partners.set(activePartners);

        this.loadingPartners.set(false);

      },

      error: (error) => {

        console.error(
          'Error al cargar socios:',
          error
        );

        this.loadingPartners.set(false);

        this.error.set(
          error?.error?.detail ||
          error?.error?.error ||
          'No se pudieron cargar los socios.'
        );

      }

    });

  }


  // =========================================================
  // LOAD PRODUCT FOR EDITING
  // =========================================================

  private loadProductForEditing(
    product: Product
  ): void {

    this.success.set('');

    this.error.set('');

    this.product = {

      owner_id: product.owner_id,

      name: product.name,

      description:
        product.description ?? '',

      category:
        product.category ?? '',

      sku:
        product.sku ?? '',

      price: product.price,

      cost:
        product.cost ?? 0,

      stock: product.stock,

      image_url:
        product.image_url ?? ''

    };

  }


  // =========================================================
  // SAVE PRODUCT
  // =========================================================

  protected saveProduct(): void {

    this.success.set('');

    this.error.set('');


    // -------------------------------------------------------
    // OWNER
    // -------------------------------------------------------

    if (!this.product.owner_id) {

      this.error.set(
        'Debes seleccionar el socio propietario del producto.'
      );

      return;

    }


    // -------------------------------------------------------
    // NAME
    // -------------------------------------------------------

    if (!this.product.name.trim()) {

      this.error.set(
        'El nombre del producto es obligatorio.'
      );

      return;

    }


    // -------------------------------------------------------
    // PRICE
    // -------------------------------------------------------

    if (this.product.price <= 0) {

      this.error.set(
        'El precio debe ser mayor a 0.'
      );

      return;

    }


    // -------------------------------------------------------
    // STOCK
    // -------------------------------------------------------

    if (this.product.stock < 0) {

      this.error.set(
        'El stock no puede ser negativo.'
      );

      return;

    }


    // -------------------------------------------------------
    // LOADING
    // -------------------------------------------------------

    this.loading.set(true);


    // -------------------------------------------------------
    // CREATE / UPDATE
    // -------------------------------------------------------

    if (this.editingProduct) {

      this.updateProduct();

    } else {

      this.createProduct();

    }

  }


  // =========================================================
  // CREATE PRODUCT
  // =========================================================

  private createProduct(): void {

    this.api.createProduct(
      this.product
    ).subscribe({

      next: () => {

        this.loading.set(false);

        this.success.set(
          'Producto creado correctamente.'
        );

        this.resetForm();

        this.productSaved.emit();

      },

      error: (error) => {

        console.error(
          'Error al crear producto:',
          error
        );

        this.loading.set(false);

        this.error.set(
          error?.error?.detail ||
          error?.error?.error ||
          'No se pudo crear el producto.'
        );

      }

    });

  }


  // =========================================================
  // UPDATE PRODUCT
  // =========================================================

  private updateProduct(): void {

    if (!this.editingProduct) {

      return;

    }


    const productId =
      this.editingProduct.id;


    const updateData: ProductUpdate = {

      name: this.product.name,

      description:
        this.product.description,

      category:
        this.product.category,

      sku:
        this.product.sku,

      price:
        this.product.price,

      cost:
        this.product.cost,

      stock:
        this.product.stock,

      image_url:
        this.product.image_url

    };


    this.api.updateProduct(
      productId,
      updateData
    ).subscribe({

      next: () => {

        this.loading.set(false);

        this.success.set(
          'Producto actualizado correctamente.'
        );

        this.productSaved.emit();

      },

      error: (error) => {

        console.error(
          'Error al actualizar producto:',
          error
        );

        this.loading.set(false);

        this.error.set(
          error?.error?.detail ||
          error?.error?.error ||
          'No se pudo actualizar el producto.'
        );

      }

    });

  }


  // =========================================================
  // CANCEL EDIT
  // =========================================================

  protected cancelEdit(): void {

    this.resetForm();

    this.cancelled.emit();

  }


  // =========================================================
  // RESET FORM
  // =========================================================

  private resetForm(): void {

    this.product =
      this.createEmptyProduct();

    this.success.set('');

    this.error.set('');

  }

}