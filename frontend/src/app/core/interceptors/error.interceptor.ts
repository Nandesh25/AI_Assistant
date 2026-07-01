import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

// Shared across concurrent 401s so we only refresh once.
let isRefreshing = false;
const refreshed$ = new BehaviorSubject<string | null>(null);

/**
 * On a 401, transparently attempt a token refresh and retry the request once.
 * If refresh fails, clear the session and redirect to login.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const tokenService = inject(TokenService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthCall = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
      if (error.status !== 401 || isAuthCall) {
        return throwError(() => error);
      }

      const refreshToken = tokenService.refreshToken;
      if (!refreshToken) {
        auth.clearSession();
        router.navigate(['/auth/login']);
        return throwError(() => error);
      }

      if (isRefreshing) {
        return refreshed$.pipe(
          filter((t): t is string => t !== null),
          take(1),
          switchMap((token) =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })),
          ),
        );
      }

      isRefreshing = true;
      refreshed$.next(null);

      return auth.refresh(refreshToken).pipe(
        switchMap((tokens) => {
          isRefreshing = false;
          refreshed$.next(tokens.access_token);
          return next(
            req.clone({ setHeaders: { Authorization: `Bearer ${tokens.access_token}` } }),
          );
        }),
        catchError((refreshError) => {
          isRefreshing = false;
          auth.clearSession();
          router.navigate(['/auth/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
