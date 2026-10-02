import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Api, Product } from './core/services/api';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly title = signal('collectify');

  protected products = signal<Product[]>([]);
  protected error = signal<string | null>(null);

  private readonly api = inject(Api);

  ngOnInit(): void {
    const ownerId = '7c29ed96-5076-402b-a748-0d288ed95298';

    this.api.getProducts(ownerId).subscribe({
      next: (response) => {
        console.log('Productos recibidos:', response.data);
        this.products.set(response.data);
      },
      error: (error) => {
        console.error('Error al obtener productos:', error);
        this.error.set('No se pudieron cargar los productos.');
      },
    });
  }
}