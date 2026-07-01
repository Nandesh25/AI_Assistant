import { Injectable, effect, signal } from '@angular/core';

type Theme = 'light' | 'dark';
const THEME_KEY = 'chat_theme';

/**
 * Dark/light mode using a signal. An effect mirrors the value to <body> and
 * localStorage so the choice persists and styles react instantly.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>((localStorage.getItem(THEME_KEY) as Theme) ?? 'light');

  constructor() {
    effect(() => {
      const theme = this.theme();
      document.body.classList.toggle('dark-theme', theme === 'dark');
      localStorage.setItem(THEME_KEY, theme);
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }
}
