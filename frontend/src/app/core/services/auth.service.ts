import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  TokenPair,
} from '../models/auth.model';
import { User } from '../models/user.model';
import { TokenService } from './token.service';

/**
 * Owns authentication state. The current user is a signal so components react
 * to login/logout without manual subscriptions.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly base = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/register`, data)
      .pipe(tap((res) => this.onAuth(res)));
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/login`, data)
      .pipe(tap((res) => this.onAuth(res)));
  }

  loadCurrentUser(): Observable<User> {
    return this.http
      .get<User>(`${this.base}/me`)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  refresh(refreshToken: string): Observable<TokenPair> {
    return this.http
      .post<TokenPair>(`${this.base}/refresh`, { refresh_token: refreshToken })
      .pipe(tap((tokens) => this.tokenService.setTokens(tokens)));
  }

  logout(): void {
    this.http.post(`${this.base}/logout`, {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  clearSession(): void {
    this.tokenService.clear();
    this.currentUser.set(null);
  }

  private onAuth(res: AuthResponse): void {
    this.tokenService.setTokens(res.tokens);
    this.currentUser.set(res.user);
  }
}
