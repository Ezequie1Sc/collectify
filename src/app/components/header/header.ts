import {
  Component,
  DestroyRef,
  ElementRef,
  HostBinding,
  HostListener,
  ViewChild,
  afterNextRender,
  inject,
  signal
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import { filter } from 'rxjs';


interface NavigationItem {
  label: string;
  route: string;
  exact: boolean;
  paths: string[];
}


@Component({
  selector: 'app-header',
  standalone: true,

  imports: [
    RouterLink,
    RouterLinkActive
  ],

  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('sidebar')
  private sidebar?: ElementRef<HTMLElement>;

  @ViewChild('mobileToggle')
  private mobileToggle?: ElementRef<HTMLButtonElement>;

  @ViewChild('mobileClose')
  private mobileClose?: ElementRef<HTMLButtonElement>;


  readonly collapsed = signal(false);
  readonly mobileMenuOpen = signal(false);
  readonly isMobile = signal(false);

  readonly logoPath = 'collectify_logo.svg';


  @HostBinding('class.is-collapsed')
  get isCollapsed(): boolean {
    return this.collapsed();
  }


  // =======================================================
  // ROUTES
  // =======================================================

  readonly navigation: NavigationItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      exact: true,
      paths: [
        'M3 10 12 3l9 7',
        'M5 9v11h14V9',
        'M9 20v-7h6v7'
      ]
    },
    {
      label: 'Ventas',
      route: '/sales',
      exact: false,
      paths: [
        'M6 3h12v18l-3-2-3 2-3-2-3 2V3Z',
        'M9 8h6M9 12h6'
      ]
    },
    {
      label: 'Socios',
      route: '/partners',
      exact: false,
      paths: [
        'M12 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
        'M3 21v-3a6 6 0 0 1 12 0v3',
        'M16 5a3 3 0 0 1 0 6',
        'M17 15a5 5 0 0 1 4 5v1'
      ]
    },
    {
      label: 'Ganancias',
      route: '/earnings',
      exact: false,
      paths: [
        'M4 20h16',
        'M6 16v-4M12 16V8M18 16V4',
        'm5 8 6-5'
      ]
    },
    {
      label: 'Asistente IA',
      route: '/ai',
      exact: true,
      paths: [
        'm12 3 2.1 6.9L21 12l-6.9 2.1L12 21l-2.1-6.9L3 12l6.9-2.1L12 3Z'
      ]
    },
    {
      label: 'Proveedores',
      route: '/suppliers',
      exact: false,
      paths: [
        'M3 10h18l-2-6H5l-2 6Z',
        'M4 10v10h16V10',
        'M9 20v-6h6v6',
        'M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0'
      ]
    }
  ];


  constructor() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.closeMobileMenu(false);
      });

    afterNextRender(() => {
      const media = window.matchMedia('(max-width: 768px)');

      this.isMobile.set(media.matches);

      try {
        this.collapsed.set(
          localStorage.getItem('collectify.sidebar.collapsed') === 'true'
        );
      } catch {
        // El menú funciona aunque el almacenamiento no esté disponible.
      }

      const onResize = (event: MediaQueryListEvent): void => {
        this.isMobile.set(event.matches);
        this.mobileMenuOpen.set(false);
      };

      media.addEventListener('change', onResize);

      this.destroyRef.onDestroy(() => {
        media.removeEventListener('change', onResize);
      });
    });
  }


  // =======================================================
  // DESKTOP
  // =======================================================

  toggleCollapsed(): void {
    this.collapsed.update(value => !value);

    try {
      localStorage.setItem(
        'collectify.sidebar.collapsed',
        String(this.collapsed())
      );
    } catch {
      // No impide expandir o contraer la barra.
    }
  }


  // =======================================================
  // MOBILE
  // =======================================================

  toggleMobileMenu(): void {
    if (this.mobileMenuOpen()) {
      this.closeMobileMenu();
      return;
    }

    this.mobileMenuOpen.set(true);

    requestAnimationFrame(() => {
      if (!this.destroyRef.destroyed && this.mobileMenuOpen()) {
        this.mobileClose?.nativeElement.focus();
      }
    });
  }


  closeMobileMenu(restoreFocus = true): void {
    const wasOpen = this.mobileMenuOpen();

    this.mobileMenuOpen.set(false);

    if (wasOpen && restoreFocus) {
      this.mobileToggle?.nativeElement.focus();
    }
  }


  // =======================================================
  // KEYBOARD
  // =======================================================

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.isMobile() || !this.mobileMenuOpen()) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMobileMenu();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const controls = this.sidebar?.nativeElement
      .querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );

    const visibleControls = Array.from(controls ?? [])
      .filter(element => element.getClientRects().length > 0);

    const first = visibleControls[0];
    const last = visibleControls[visibleControls.length - 1];

    if (!first || !last) {
      return;
    }

    const activeElement = document.activeElement;

    if (event.shiftKey && activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}