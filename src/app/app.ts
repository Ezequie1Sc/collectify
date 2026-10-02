import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  ApiService,
  Product,
  ProductCreate,
} from './core/services/api';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly title = signal('Collectify');

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly showProductForm = signal(false);
  protected readonly creatingProduct = signal(false);
  protected readonly formError = signal('');

  protected readonly ownerId =
    '7c29ed96-5076-402b-a748-0d288ed95298';

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  protected loadProducts(): void {
    this.loading.set(true);
    this.error.set('');

    this.api.getProducts(this.ownerId).subscribe({
      next: (response) => {
        this.products.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.error.set('No se pudieron cargar los productos.');
        this.loading.set(false);
      },
    });
  }

  protected openProductForm(): void {
    this.formError.set('');
    this.showProductForm.set(true);
  }

  protected closeProductForm(): void {
    if (!this.creatingProduct()) {
      this.showProductForm.set(false);
    }
  }

  protected createProduct(event: Event): void {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const product: ProductCreate = {
      owner_id: this.ownerId,
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? ''),
      category: String(formData.get('category') ?? ''),
      sku: String(formData.get('sku') ?? ''),
      price: Number(formData.get('price')),
      cost: Number(formData.get('cost')),
      stock: Number(formData.get('stock')),
      image_url: null,
    };

    this.creatingProduct.set(true);
    this.formError.set('');

    this.api.createProduct(product).subscribe({
      next: () => {
        this.creatingProduct.set(false);
        this.showProductForm.set(false);
        form.reset();
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error al crear producto:', error);

        this.formError.set(
          error?.error?.detail ||
          error?.error?.error ||
          'No se pudo crear el producto.',
        );

        this.creatingProduct.set(false);
      },
    });
  }
}