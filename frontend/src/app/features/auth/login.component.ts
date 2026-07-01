import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../core/services/auth.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    TranslatePipe,
  ],
  template: `
    <div class="auth-wrap">
      <div class="brand">
        <span class="logo"><mat-icon>forum</mat-icon></span>
        <span class="brand-name">Enterprise Chat</span>
      </div>
      <mat-card class="auth-card">
        @if (loading()) {
          <mat-progress-bar mode="indeterminate" />
        }
        <mat-card-header>
          <mat-card-title>{{ 'auth.welcomeBack' | t }}</mat-card-title>
          <mat-card-subtitle>{{ 'auth.signInToContinue' | t }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="field">
              <mat-label>{{ 'auth.emailOrUsername' | t }}</mat-label>
              <input matInput formControlName="identifier" autocomplete="username" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="field">
              <mat-label>{{ 'auth.password' | t }}</mat-label>
              <input matInput type="password" formControlName="password"
                     autocomplete="current-password" />
            </mat-form-field>
            @if (error()) {
              <p class="error">{{ error() }}</p>
            }
            <button mat-flat-button color="primary" class="field"
                    [disabled]="form.invalid || loading()">
              {{ 'auth.signIn' | t }}
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <span>{{ 'auth.noAccount' | t }}</span>
          <a mat-button routerLink="/auth/register">{{ 'auth.createOne' | t }}</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .auth-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 1rem;
        gap: 1.25rem;
        background:
          radial-gradient(900px 500px at 20% 10%, rgba(139, 92, 246, 0.25), transparent),
          radial-gradient(900px 500px at 90% 90%, rgba(37, 99, 235, 0.22), transparent),
          var(--app-bg);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--text);
      }
      .logo {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: var(--brand-grad);
        color: #fff;
        box-shadow: var(--shadow-md);
      }
      .auth-card {
        width: 100%;
        max-width: 400px;
        padding: 1.5rem;
      }
      mat-card-header {
        margin-bottom: 1.25rem;
      }
      mat-card-content {
        padding-top: 0.5rem;
      }
      .field {
        width: 100%;
        margin-top: 0.5rem;
      }
      .error {
        color: var(--mat-sys-error, #b00020);
        margin: 0.25rem 0;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly ws = inject(WebsocketService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.ws.connect();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? 'Login failed');
      },
    });
  }
}
