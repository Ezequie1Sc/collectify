import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ApiService, Product } from './core/services/api';

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
  protected readonly error = signal<string | null>(null);

  private readonly api = inject(ApiService);

  private readonly ownerId =
    '7c29ed96-5076-402b-a748-0d288ed95298';

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getProducts(this.ownerId).subscribe({
      next: (response) => {
        this.products.set(response.data);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        console.error('Error al cargar productos:', error);
        this.error.set('No se pudieron cargar los productos.');
        this.loading.set(false);
      },
    });
  }
}