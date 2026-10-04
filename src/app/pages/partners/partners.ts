import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  FormsModule,
  NgForm
} from '@angular/forms';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
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
  Partner,
  PartnerCreate
} from '../../core/models/partner';


@Component({
  selector: 'app-partners',
  standalone: true,

  imports: [
    FormsModule,
    Header
  ],

  templateUrl: './partners.html',
  styleUrl: './partners.scss'
})
export class Partners implements OnInit {

  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);


  // =======================================================
  // STATE
  // =======================================================

  readonly partners = signal<Partner[]>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly deletingPartnerId =
    signal<string | null>(null);

  readonly loadError = signal('');
  readonly error = signal('');
  readonly success = signal('');

  readonly search = signal('');


  // =======================================================
  // FORM
  // =======================================================

  name = '';
  email = '';


  // =======================================================
  // COMPUTED
  // =======================================================

  readonly busy = computed(() =>
    this.loading() ||
    this.saving() ||
    this.deletingPartnerId() !== null
  );


  readonly filteredPartners = computed(() => {
    const query = this.normalize(this.search());

    if (!query) {
      return this.partners();
    }

    return this.partners().filter(partner => {
      const text = this.normalize(
        `${partner.name} ${partner.email ?? ''}`
      );

      return text.includes(query);
    });
  });


  // =======================================================
  // INIT
  // =======================================================

  ngOnInit(): void {
    this.loadPartners();
  }


  // =======================================================
  // LOAD
  // =======================================================

  loadPartners(): void {
    if (this.busy()) {
      return;
    }

    this.loading.set(true);
    this.loadError.set('');

    this.api
      .getPartners()
      .pipe(
        timeout(20000),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: response => {
          this.partners.set(response.data ?? []);
        },

        error: error => {
          this.loadError.set(
            this.readError(
              error,
              'No se pudieron cargar los socios. Intenta nuevamente.'
            )
          );
        }
      });
  }


  // =======================================================
  // CREATE
  // =======================================================

  createPartner(form: NgForm): void {
    if (this.busy()) {
      return;
    }

    this.error.set('');
    this.success.set('');

    const name = this.name.trim();
    const email = this.email.trim();

    if (!name) {
      form.control.markAllAsTouched();

      this.error.set(
        'El nombre del socio es obligatorio.'
      );

      return;
    }

    if (form.invalid) {
      form.control.markAllAsTouched();

      this.error.set(
        'Revisa los campos del formulario.'
      );

      return;
    }

    const payload: PartnerCreate = {
      name,
      email: email || null
    };

    this.saving.set(true);

    this.api
      .createPartner(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: response => {
          this.partners.update(partners => [
            ...partners,
            response.data
          ]);

          this.name = '';
          this.email = '';

          form.resetForm({
            name: '',
            email: ''
          });

          // Permite ver el nuevo registro si había
          // una búsqueda que lo ocultaba.
          this.search.set('');

          this.success.set(
            `${response.data.name} se registró correctamente.`
          );
        },

        error: error => {
          this.error.set(
            this.readError(
              error,
              'No se pudo registrar el socio.'
            )
          );
        }
      });
  }


  // =======================================================
  // DELETE
  // =======================================================

  deletePartner(partner: Partner): void {
    if (this.busy()) {
      return;
    }

    const confirmed = window.confirm(
      `¿Deseas eliminar a "${partner.name}"?`
    );

    if (!confirmed) {
      return;
    }

    this.error.set('');
    this.success.set('');
    this.deletingPartnerId.set(partner.id);

    this.api
      .deletePartner(partner.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.deletingPartnerId.set(null);
        })
      )
      .subscribe({
        next: () => {
          this.partners.update(partners =>
            partners.filter(
              item => item.id !== partner.id
            )
          );

          this.success.set(
            `${partner.name} se eliminó correctamente.`
          );
        },

        error: error => {
          this.error.set(
            this.readError(
              error,
              'No se pudo eliminar el socio.'
            )
          );
        }
      });
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


  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }


  private readError(
    error: unknown,
    fallback: string
  ): string {
    const response = error as {
      error?: {
        detail?: unknown;
        message?: unknown;
      };
    };

    const detail = response?.error?.detail;

    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map(item => {
          if (
            item &&
            typeof item === 'object' &&
            'msg' in item
          ) {
            return String(item.msg);
          }

          return '';
        })
        .filter(Boolean);

      if (messages.length) {
        return messages.join(' ');
      }
    }

    const message = response?.error?.message;

    return typeof message === 'string' && message.trim()
      ? message
      : fallback;
  }
}