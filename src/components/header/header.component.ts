import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LOGO_URL, TITLE_URL } from '../../assets';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, RouterLinkActive],
})
export class HeaderComponent {
  private readonly sanitizer = inject(DomSanitizer);
  
  readonly logoUrl: SafeResourceUrl;
  readonly titleUrl: SafeResourceUrl;

  constructor() {
    this.logoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(LOGO_URL);
    this.titleUrl = this.sanitizer.bypassSecurityTrustResourceUrl(TITLE_URL);
  }
}
