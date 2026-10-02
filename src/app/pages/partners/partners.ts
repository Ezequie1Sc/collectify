import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api';
import {
  Partner,
  PartnerCreate
} from '../../core/models/partner';


@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './partners.html',
  styleUrl: './partners.scss'
})
export class Partners implements OnInit {

  private readonly api = inject(ApiService);


  // =========================================================
  // STATE
  // =========================================================

  readonly partners =
    signal<Partner[]>([]);

  readonly loading =
    signal(true);

  readonly saving =
    signal(false);

  readonly error =
    signal('');

  readonly success =
    signal('');


  // =========================================================
  // FORM
  // =========================================================

  name = '';

  email = '';


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.loadPartners();

  }


  // =========================================================
  // LOAD
  // =========================================================

  loadPartners(): void {

    this.loading.set(true);
    this.error.set('');

    this.api.getPartners().subscribe({

      next: (response) => {

        this.partners.set(
          response.data
        );

        this.loading.set(false);

      },

      error: (error) => {

        console.error(
          'Error al cargar socios:',
          error
        );

        this.error.set(
          'No se pudieron cargar los socios.'
        );

        this.loading.set(false);

      }

    });

  }


  // =========================================================
  // CREATE
  // =========================================================

  createPartner(): void {

    this.error.set('');
    this.success.set('');

    const name =
      this.name.trim();

    const email =
      this.email.trim();


    if (!name) {

      this.error.set(
        'El nombre del socio es obligatorio.'
      );

      return;

    }


    const partner: PartnerCreate = {

      name,

      email: email || null

    };


    this.saving.set(true);


    this.api
      .createPartner(partner)
      .subscribe({

        next: (response) => {

          this.partners.update(
            partners => [
              ...partners,
              response.data
            ]
          );

          this.name = '';
          this.email = '';

          this.success.set(
            'Socio registrado correctamente.'
          );

          this.saving.set(false);

        },

        error: (error) => {

          console.error(
            'Error al crear socio:',
            error
          );

          this.error.set(
            error?.error?.detail ||
            'No se pudo registrar el socio.'
          );

          this.saving.set(false);

        }

      });

  }


  // =========================================================
  // DELETE
  // =========================================================

  deletePartner(
    partner: Partner
  ): void {

    const confirmed =
      window.confirm(
        `¿Deseas eliminar a ${partner.name}?`
      );


    if (!confirmed) {

      return;

    }


    this.api
      .deletePartner(partner.id)
      .subscribe({

        next: () => {

          this.partners.update(
            partners =>
              partners.filter(
                item =>
                  item.id !== partner.id
              )
          );

          this.success.set(
            'Socio eliminado correctamente.'
          );

        },

        error: (error) => {

          console.error(
            'Error al eliminar socio:',
            error
          );

          this.error.set(
            error?.error?.detail ||
            'No se pudo eliminar el socio.'
          );

        }

      });

  }

}