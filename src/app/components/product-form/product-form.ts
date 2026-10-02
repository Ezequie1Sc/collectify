import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
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

@Component({
  selector: 'app-product-form',
  imports: [FormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss'
})
export class ProductForm implements OnChanges {

  private readonly api = inject(ApiService);

  @Input()
  editingProduct: Product | null = null;

  @Output()
  productSaved = new EventEmitter<void>();

  @Output()
  cancelled = new EventEmitter<void>();

  protected readonly loading = signal(false);

  protected readonly success = signal('');

  protected readonly error = signal('');

  protected product: ProductCreate = this.createEmptyProduct();

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['editingProduct']) {

      const product = changes['editingProduct'].currentValue;

      if (product) {
        this.loadProductForEditing(product);
      } else {
        this.resetForm();
      }
    }
  }

  protected get isEditing(): boolean {
    return this.editingProduct !== null;
  }

  private createEmptyProduct(): ProductCreate {
    return {
      owner_id: '7c29ed96-5076-402b-a748-0d288ed95298',
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

  private loadProductForEditing(product: Product): void {

    this.success.set('');
    this.error.set('');

    this.product = {
      owner_id: product.owner_id,
      name: product.name,
      description: product.description ?? '',
      category: product.category ?? '',
      sku: product.sku ?? '',
      price: product.price,
      cost: product.cost ?? 0,
      stock: product.stock,
      image_url: product.image_url ?? ''
    };
  }

  protected saveProduct(): void {

    this.success.set('');
    this.error.set('');

    if (!this.product.name.trim()) {
      this.error.set(
        'El nombre del producto es obligatorio.'
      );

      return;
    }

    if (this.product.price <= 0) {
      this.error.set(
        'El precio debe ser mayor a 0.'
      );

      return;
    }

    if (this.product.stock < 0) {
      this.error.set(
        'El stock no puede ser negativo.'
      );

      return;
    }

    this.loading.set(true);

    if (this.editingProduct) {
      this.updateProduct();
    } else {
      this.createProduct();
    }
  }

  private createProduct(): void {

    this.api.createProduct(this.product).subscribe({

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

  private updateProduct(): void {

    if (!this.editingProduct) {
      return;
    }

    const productId = this.editingProduct.id;

    const updateData: ProductUpdate = {
      name: this.product.name,
      description: this.product.description,
      category: this.product.category,
      sku: this.product.sku,
      price: this.product.price,
      cost: this.product.cost,
      stock: this.product.stock,
      image_url: this.product.image_url
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

  protected cancelEdit(): void {

    this.resetForm();

    this.cancelled.emit();
  }

  private resetForm(): void {

    this.product = this.createEmptyProduct();

    this.success.set('');

    this.error.set('');
  }
}