import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  Subscription,
  finalize,
  timeout
} from 'rxjs';

import {
  Header
} from '../../components/header/header';

import {
  ApiService
} from '../../core/services/api';

import {
  SupplierRequest,
  SupplierResponse
} from '../../core/models/supplier';


interface SupplierView {
  name: string;
  description: string;
  category: string;
  location: string;
  website: string | null;
  domain: string;
  rating: number | null;
  relevance: number | null;
  verified: boolean;
  tags: string[];
}

interface TextPart {
  text: string;
  strong: boolean;
}

interface AnalysisBlock {
  heading: boolean;
  parts: TextPart[];
}


@Component({
  selector: 'app-suppliers',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    Header
  ],

  templateUrl: './suppliers.html',
  styleUrl: './suppliers.scss'
})
export class Suppliers {

  private readonly api = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  private requestSubscription?: Subscription;

  @ViewChild('productInput')
  private productInput?: ElementRef<HTMLInputElement>;


  // =======================================================
  // FORM
  // =======================================================

  searchQuery = '';
  category = '';
  location = 'México';


  // =======================================================
  // STATE
  // =======================================================

  isSearching = false;
  hasSearched = false;

  errorMessage = '';
  notice = '';

  aiAnswer = '';
  totalResults = 0;

  suppliers: SupplierView[] = [];
  analysisBlocks: AnalysisBlock[] = [];

  submittedSearch: SupplierRequest | null = null;


  // =======================================================
  // QUICK SEARCH
  // =======================================================

  readonly recommendedProducts = [
    'Funko Batman',
    'Funko Spiderman',
    'Funko Pokémon',
    'Pins anime',
    'Plushies'
  ];


  // =======================================================
  // SEARCH
  // =======================================================

  searchSuppliers(): void {
    if (this.isSearching) {
      return;
    }

    const product = this.searchQuery.trim();

    if (!product) {
      this.errorMessage =
        'Escribe un producto para buscar proveedores.';

      this.productInput?.nativeElement.focus();
      return;
    }

    const request: SupplierRequest = {
      product,

      ...(this.category.trim()
        ? { category: this.category.trim() }
        : {}),

      ...(this.location.trim()
        ? { location: this.location.trim() }
        : {})
    };

    this.submittedSearch = request;

    this.isSearching = true;
    this.hasSearched = false;

    this.errorMessage = '';
    this.notice = '';

    this.aiAnswer = '';
    this.analysisBlocks = [];

    this.suppliers = [];
    this.totalResults = 0;

    this.cdr.markForCheck();

    this.requestSubscription = this.api
      .searchSuppliers(request)
      .pipe(
        timeout(120000),
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.isSearching = false;

          if (!this.destroyRef.destroyed) {
            this.cdr.markForCheck();
          }
        })
      )
      .subscribe({
        next: (response: SupplierResponse) => {
          this.aiAnswer =
            typeof response?.answer === 'string'
              ? response.answer.trim()
              : '';

          this.analysisBlocks =
            this.buildAnalysis(this.aiAnswer);

          const results = Array.isArray(response?.results)
            ? response.results
            : [];

          this.suppliers = results.map(result =>
            this.normalizeSupplier(result)
          );

          const reportedTotal = Number(response?.total_results);

          this.totalResults =
            Number.isInteger(reportedTotal) &&
            reportedTotal >= this.suppliers.length
              ? reportedTotal
              : this.suppliers.length;

          this.hasSearched = true;

          this.cdr.markForCheck();
        },

        error: error => {
          // Un error no se presenta como una búsqueda sin resultados.
          this.hasSearched = false;

          this.errorMessage = this.getErrorMessage(error);

          this.cdr.markForCheck();
        }
      });
  }


  searchRecommended(product: string): void {
    if (this.isSearching) {
      return;
    }

    this.searchQuery = product;
    this.searchSuppliers();
  }


  // =======================================================
  // CANCEL / RESET
  // =======================================================

  cancelSearch(): void {
    if (!this.isSearching) {
      return;
    }

    this.requestSubscription?.unsubscribe();
    this.requestSubscription = undefined;

    this.isSearching = false;

    this.notice =
      'Búsqueda detenida. Puedes modificar los datos y volver a buscar.';

    this.productInput?.nativeElement.focus();
    this.cdr.markForCheck();
  }


  clearSearch(): void {
    this.requestSubscription?.unsubscribe();
    this.requestSubscription = undefined;

    this.searchQuery = '';
    this.category = '';
    this.location = 'México';

    this.isSearching = false;
    this.hasSearched = false;

    this.errorMessage = '';
    this.notice = '';

    this.aiAnswer = '';
    this.analysisBlocks = [];

    this.suppliers = [];
    this.totalResults = 0;
    this.submittedSearch = null;

    this.productInput?.nativeElement.focus();
    this.cdr.markForCheck();
  }


  // =======================================================
  // DISPLAY
  // =======================================================

  initials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase() || '?';
  }


  getRelevanceLabel(relevance: number): string {
    if (relevance >= 90) {
      return 'Excelente coincidencia';
    }

    if (relevance >= 75) {
      return 'Buena coincidencia';
    }

    if (relevance >= 50) {
      return 'Coincidencia moderada';
    }

    return 'Coincidencia baja';
  }


  // =======================================================
  // NORMALIZATION
  // =======================================================

  private normalizeSupplier(value: unknown): SupplierView {
    const data =
      value && typeof value === 'object'
        ? value as Record<string, unknown>
        : {};

    const website = this.normalizeWebsite(
      this.firstText(
        data['website'],
        data['url'],
        data['web']
      )
    );

    const tags = Array.isArray(data['tags'])
      ? [
          ...new Set(
            data['tags']
              .filter((tag): tag is string =>
                typeof tag === 'string'
              )
              .map(tag => tag.trim())
              .filter(Boolean)
          )
        ]
      : [];

    return {
      name: this.firstText(
        data['name'],
        data['business_name'],
        data['company'],
        data['title']
      ) || 'Proveedor sin nombre',

      description: this.firstText(
        data['description'],
        data['details'],
        data['summary']
      ),

      category: this.firstText(data['category']),

      location: this.firstText(
        data['location'],
        data['address']
      ),

      website,

      domain: website
        ? new URL(website).hostname.replace(/^www\./i, '')
        : '',

      rating: this.optionalNumber(
        data['rating'],
        0,
        5
      ),

      relevance: this.optionalNumber(
        data['relevance'] ?? data['score'],
        0,
        100
      ),

      verified:
        data['verified'] === true ||
        data['verified'] === 'true',

      tags
    };
  }


  private firstText(...values: unknown[]): string {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  }


  private optionalNumber(
    value: unknown,
    minimum: number,
    maximum: number
  ): number | null {
    if (
      value === null ||
      value === undefined ||
      typeof value === 'boolean' ||
      (typeof value === 'string' && !value.trim())
    ) {
      return null;
    }

    if (
      typeof value !== 'number' &&
      typeof value !== 'string'
    ) {
      return null;
    }

    const number = Number(value);

    return (
      Number.isFinite(number) &&
      number >= minimum &&
      number <= maximum
    )
      ? number
      : null;
  }


  private normalizeWebsite(value: string): string | null {
    if (!value || /[\s\u0000-\u001f]/.test(value)) {
      return null;
    }

    let candidate = value.trim();

    if (candidate.startsWith('//')) {
      candidate = `https:${candidate}`;
    } else if (!/^https?:\/\//i.test(candidate)) {
      // No convierte esquemas ajenos a HTTP en enlaces.
      if (/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
        return null;
      }

      candidate = `https://${candidate}`;
    }

    try {
      const url = new URL(candidate);

      if (
        !['http:', 'https:'].includes(url.protocol) ||
        !url.hostname.includes('.') ||
        url.username ||
        url.password
      ) {
        return null;
      }

      return url.href;
    } catch {
      return null;
    }
  }


  // =======================================================
  // AI ANALYSIS
  // Renderizado con texto de Angular, sin insertar HTML.
  // =======================================================

  private buildAnalysis(text: string): AnalysisBlock[] {
    if (!text) {
      return [];
    }

    return text
      .replace(/\r\n?/g, '\n')
      .split(/\n\s*\n|(?=^#{1,6}\s)/m)
      .map(block => block.trim())
      .filter(Boolean)
      .flatMap(block => {
        const lines = block.split('\n');
        const title = lines[0].match(/^#{1,6}\s+(.+)$/);

        if (!title) {
          return [{
            heading: false,
            parts: this.boldParts(block)
          }];
        }

        const result: AnalysisBlock[] = [{
          heading: true,
          parts: this.boldParts(title[1])
        }];

        const body = lines.slice(1).join('\n').trim();

        if (body) {
          result.push({
            heading: false,
            parts: this.boldParts(body)
          });
        }

        return result;
      });
  }


  private boldParts(text: string): TextPart[] {
    return text
      .split(/(\*\*[^*]+\*\*)/g)
      .filter(Boolean)
      .map(part => ({
        strong: part.startsWith('**') && part.endsWith('**'),
        text:
          part.startsWith('**') && part.endsWith('**')
            ? part.slice(2, -2)
            : part
      }));
  }


  // =======================================================
  // ERRORS
  // =======================================================

  private getErrorMessage(error: unknown): string {
    const response = error as {
      name?: string;
      status?: number;
      error?: {
        detail?: unknown;
        message?: unknown;
      };
    };

    if (response?.name === 'TimeoutError') {
      return 'La búsqueda tardó demasiado. Intenta con una descripción más específica.';
    }

    if (response?.status === 0) {
      return 'No se pudo conectar con el servidor. Intenta nuevamente.';
    }

    if (response?.status === 429) {
      return 'El servicio está temporalmente limitado. Intenta nuevamente en unos momentos.';
    }

    return this.firstText(
      response?.error?.detail,
      response?.error?.message
    ) || 'No fue posible completar la búsqueda de proveedores.';
  }
}