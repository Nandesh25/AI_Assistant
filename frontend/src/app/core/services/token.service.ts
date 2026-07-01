import { Injectable, signal } from '@angular/core';
import { TokenPair } from '../models/auth.model';

const ACCESS_KEY = 'chat_access_token';
const REFRESH_KEY = 'chat_refresh_token';

/**
 * Single source of truth for JWT storage. Tokens live in localStorage so the
 * session survives reloads; a signal exposes the access token reactively.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  readonly accessToken = signal<string | null>(localStorage.getItem(ACCESS_KEY));

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  setTokens(tokens: TokenPair): void {
    localStorage.setItem(ACCESS_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    this.accessToken.set(tokens.access_token);
  }

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.accessToken.set(null);
  }

  get hasToken(): boolean {
    return !!this.accessToken();
  }
}
