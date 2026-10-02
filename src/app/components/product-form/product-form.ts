import { Component, inject, output, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { ApiService, ProductCreate } from '../../core/services/api';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss'
})
export class ProductForm {

  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  readonly productCreated = output<void>();

  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  readonly ownerId = '7c29ed96-5076-402b-a748-0d288ed95298';

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    category: [''],
    sku: [''],
    price: [0, [Validators.required, Validators.min(0.01)]],
    cost: [0, [Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    image_url: ['']
  });

  submit(): void {
    this.error.set('');
    this.success.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const value = this.form.getRawValue();

    const product: ProductCreate = {
      owner_id: this.ownerId,
      name: value.name,
      description: value.description || null,
      category: value.category || null,
      sku: value.sku || null,
      price: value.price,
      cost: value.cost,
      stock: value.stock,
      image_url: value.image_url || null
    };

    this.api.createProduct(product).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Producto creado correctamente.');

        this.form.reset({
          name: '',
          description: '',
          category: '',
          sku: '',
          price: 0,
          cost: 0,
          stock: 0,
          image_url: ''
        });

        this.productCreated.emit();
      },

      error: (error) => {
        console.error('Error al crear producto:', error);

        this.loading.set(false);
        this.error.set(
          error?.error?.detail ||
          error?.error?.error ||
          'No se pudo crear el producto.'
        );
      }
    });
  }
}