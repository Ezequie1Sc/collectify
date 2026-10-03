import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {

  mobileMenuOpen = false;


  // =========================================================
  // MOBILE MENU
  // =========================================================

  toggleMobileMenu(): void {
    this.mobileMenuOpen =
      !this.mobileMenuOpen;
  }


  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

}