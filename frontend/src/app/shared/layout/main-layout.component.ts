import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { WebsocketService } from '../../core/services/websocket.service';
import {
  LANGUAGES,
  Lang,
  TranslationService,
} from '../../core/services/translation.service';
import { TranslatePipe } from '../pipes/translate.pipe';
import { AvatarComponent } from '../ui/avatar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    TranslatePipe,
    AvatarComponent,
  ],
  template: `
    <mat-toolbar class="toolbar">
      <button mat-icon-button (click)="drawer.toggle()" aria-label="Menu">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="brand">
        <mat-icon class="brand-icon">forum</mat-icon>
        Enterprise Chat
      </span>
      <span class="spacer"></span>
      <span class="pill" [class.on]="ws.connected()">
        <span class="pill-dot"></span>
        {{ (ws.connected() ? 'status.connected' : 'status.offline') | t }}
      </span>
      <button mat-icon-button [matMenuTriggerFor]="langMenu" [matTooltip]="'lang.title' | t">
        <span class="flag">{{ currentFlag() }}</span>
      </button>
      <mat-menu #langMenu="matMenu">
        @for (l of languages; track l.code) {
          <button mat-menu-item (click)="setLang(l.code)">
            <span class="flag">{{ l.flag }}</span>
            <span class="lang-label">{{ l.native }}</span>
            @if (l.code === translation.lang()) {
              <mat-icon class="check">check</mat-icon>
            }
          </button>
        }
      </mat-menu>
      <button mat-icon-button (click)="theme.toggle()" [matTooltip]="(theme.theme() === 'dark' ? 'theme.light' : 'theme.dark') | t">
        <mat-icon>{{ theme.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
      </button>
      <button mat-icon-button (click)="logout()" [matTooltip]="'action.logout' | t">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>

    <mat-sidenav-container class="container">
      <mat-sidenav #drawer mode="side" opened class="sidenav">
        <nav class="nav">
          <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon><span>{{ 'nav.dashboard' | t }}</span>
          </a>
          <a class="nav-item" routerLink="/chat" routerLinkActive="active">
            <mat-icon>chat</mat-icon><span>{{ 'nav.chats' | t }}</span>
          </a>
          <a class="nav-item" routerLink="/assistant" routerLinkActive="active">
            <mat-icon>smart_toy</mat-icon><span>{{ 'nav.assistant' | t }}</span>
            <span class="badge">AI</span>
          </a>
          <a class="nav-item" routerLink="/settings" routerLinkActive="active">
            <mat-icon>settings</mat-icon><span>{{ 'nav.settings' | t }}</span>
          </a>
        </nav>

        <div class="user-card">
          <app-avatar [name]="username()" [size]="40" [online]="true" [showStatus]="true" />
          <div class="user-meta">
            <span class="user-name">{{ username() }}</span>
            <span class="user-role">{{ auth.currentUser()?.role }}</span>
          </div>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="content">
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .toolbar {
        position: sticky;
        top: 0;
        z-index: 10;
        background: var(--brand-grad);
        color: #fff;
        box-shadow: var(--shadow-md);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 700;
        letter-spacing: 0.2px;
      }
      .brand-icon {
        opacity: 0.95;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.75rem;
        padding: 0.25rem 0.7rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.18);
        margin-right: 0.5rem;
      }
      .pill-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #fca5a5;
      }
      .pill.on .pill-dot {
        background: #4ade80;
        box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.3);
      }
      .container {
        height: calc(100vh - 64px);
        background: var(--app-bg);
      }
      .sidenav {
        width: 256px;
        border-right: 1px solid var(--border);
        background: var(--surface);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 0.75rem;
      }
      .nav {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.7rem 0.85rem;
        border-radius: 12px;
        color: var(--text);
        text-decoration: none;
        font-weight: 500;
        transition: background 0.15s;
        position: relative;
      }
      .nav-item:hover {
        background: var(--surface-2);
      }
      .nav-item.active {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.16), rgba(168, 85, 247, 0.16));
        color: var(--brand-2);
      }
      .nav-item.active mat-icon {
        color: var(--brand-2);
      }
      .badge {
        margin-left: auto;
        font-size: 0.6rem;
        font-weight: 700;
        padding: 0.1rem 0.4rem;
        border-radius: 6px;
        background: var(--brand-grad);
        color: #fff;
      }
      .user-card {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.65rem;
        border-radius: 14px;
        background: var(--surface-2);
        border: 1px solid var(--border);
      }
      .user-meta {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .user-name {
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .user-role {
        font-size: 0.72rem;
        color: var(--text-muted);
        text-transform: capitalize;
      }
      .content {
        height: 100%;
      }
      .flag {
        font-size: 1.15rem;
        line-height: 1;
      }
      .lang-label {
        margin-left: 0.5rem;
      }
      .check {
        margin-left: auto;
        color: var(--brand-2);
      }
    `,
  ],
})
export class MainLayoutComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly ws = inject(WebsocketService);
  readonly translation = inject(TranslationService);
  readonly languages = LANGUAGES;

  readonly username = computed(() => this.auth.currentUser()?.username ?? 'User');
  readonly currentFlag = computed(
    () => LANGUAGES.find((l) => l.code === this.translation.lang())?.flag ?? '🌐',
  );

  setLang(lang: Lang): void {
    this.translation.setLang(lang);
  }

  logout(): void {
    this.ws.disconnect();
    this.auth.logout();
  }
}
