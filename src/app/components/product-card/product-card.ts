import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { Product } from '../../core/models/product';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss'
})
export class ProductCard {

  @Input({ required: true })
  product!: Product;

  @Output()
  edit = new EventEmitter<Product>();

  editProduct(): void {
    this.edit.emit(this.product);
  }
}