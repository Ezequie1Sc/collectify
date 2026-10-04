import {
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  ViewChild,
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive,
} from '@angular/router';


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
    RouterLinkActive,
  ],

  templateUrl: './header.html',

  styleUrl: './header.scss',
})
export class Header {


  // =========================================================
  // MOBILE TOGGLE
  // =========================================================

  @ViewChild('mobileToggle')
  private mobileToggle?: ElementRef<HTMLButtonElement>;


  // =========================================================
  // STATE
  // =========================================================

  collapsed = false;

  mobileMenuOpen = false;


  // =========================================================
  // MAIN NAVIGATION
  // =========================================================

  readonly mainNavigation: NavigationItem[] = [

    // -------------------------------------------------------
    // DASHBOARD
    // -------------------------------------------------------

    {
      label: 'Dashboard',

      route: '/dashboard',

      exact: true,

      paths: [
        'M3 3h7v7H3z',
        'M14 3h7v7h-7z',
        'M3 14h7v7H3z',
        'M14 14h7v7h-7z',
      ],
    },


    // -------------------------------------------------------
    // VENTAS
    // -------------------------------------------------------

    {
      label: 'Ventas',

      route: '/sales',

      exact: false,

      paths: [
        'M6 3h12v18l-3-2-3 2-3-2-3 2V3Z',
        'M9 7h6',
        'M9 11h6',
        'M9 15h3',
      ],
    },


    // -------------------------------------------------------
    // SOCIOS
    // -------------------------------------------------------

    {
      label: 'Socios',

      route: '/partners',

      exact: false,

      paths: [
        'M12 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
        'M3 20v-2a6 6 0 0 1 12 0v2',
        'M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1',
      ],
    },


    // -------------------------------------------------------
    // GANANCIAS
    // -------------------------------------------------------

    {
      label: 'Ganancias',

      route: '/earnings',

      exact: false,

      paths: [
        'M4 4v16h16',
        'm7 14 5-5 4 3 5-7',
        'M16 5h5v5',
      ],
    },

  ];


  // =========================================================
  // COLLAPSED CLASS
  // =========================================================

  @HostBinding('class.is-collapsed')
  get isCollapsed(): boolean {

    return this.collapsed;

  }


  // =========================================================
  // SIDEBAR
  // =========================================================

  toggleSidebar(): void {

    this.collapsed =
      !this.collapsed;

  }


  // =========================================================
  // MOBILE MENU
  // =========================================================

  toggleMobileMenu(): void {

    if (this.mobileMenuOpen) {

      this.closeMobileMenu();

      return;

    }

    this.mobileMenuOpen = true;

  }


  // =========================================================
  // CLOSE MOBILE MENU
  // =========================================================

  closeMobileMenu(): void {

    const wasOpen =
      this.mobileMenuOpen;

    this.mobileMenuOpen = false;


    if (wasOpen) {

      this.mobileToggle
        ?.nativeElement
        .focus();

    }

  }


  // =========================================================
  // ESCAPE
  // =========================================================

  @HostListener(
    'document:keydown.escape'
  )
  onEscape(): void {

    this.closeMobileMenu();

  }


  // =========================================================
  // WINDOW RESIZE
  // =========================================================

  @HostListener(
    'window:resize',
    ['$event']
  )
  onResize(event: Event): void {

    const viewport =
      event.target as Window | null;


    if (
      viewport &&
      viewport.innerWidth > 768
    ) {

      this.mobileMenuOpen = false;

    }

  }

}