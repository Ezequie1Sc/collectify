import { Component, OnInit, signal } from '@angular/core';

import { Header } from '../../components/header/header';
import { ProductCard } from '../../components/product-card/product-card';
import { EmptyState } from '../../components/empty-state/empty-state';

import { ApiService } from '../../core/services/api';
import { Product } from '../../core/models/product';

@Component({
  selector: 'app-dashboard',
  imports: [
    Header,
    ProductCard,
    EmptyState
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  products = signal<Product[]>([]);
  loading = signal(true);
  error = signal('');

  // Por ahora utilizamos el usuario que ya creaste en Supabase.
  ownerId = '7c29ed96-5076-402b-a748-0d288ed95298';

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
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
      }
    });
  }
}