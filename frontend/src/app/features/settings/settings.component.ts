import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import {
  LANGUAGES,
  Lang,
  TranslationService,
} from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatButtonToggleModule,
    TranslatePipe,
  ],
  template: `
    <div class="settings">
      <mat-card>
        <mat-card-header><mat-card-title>{{ 'settings.language' | t }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <p class="hint">{{ 'settings.languageDesc' | t }}</p>
          <mat-button-toggle-group
            [value]="translation.lang()"
            (change)="setLang($event.value)"
            class="lang-group"
          >
            @for (l of languages; track l.code) {
              <mat-button-toggle [value]="l.code">
                <span class="flag">{{ l.flag }}</span> {{ l.native }}
              </mat-button-toggle>
            }
          </mat-button-toggle-group>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>{{ 'settings.appearance' | t }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <mat-slide-toggle
            [checked]="theme.theme() === 'dark'"
            (change)="theme.toggle()"
          >
            {{ 'settings.darkMode' | t }}
          </mat-slide-toggle>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>{{ 'settings.profile' | t }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
            <mat-form-field appearance="outline" class="field">
              <mat-label>{{ 'auth.fullName' | t }}</mat-label>
              <input matInput formControlName="full_name" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="field">
              <mat-label>{{ 'settings.bio' | t }}</mat-label>
              <textarea matInput rows="3" formControlName="bio"></textarea>
            </mat-form-field>
            <button mat-flat-button color="primary">{{ 'settings.saveProfile' | t }}</button>
            @if (savedProfile()) {
              <span class="ok">{{ 'settings.saved' | t }}</span>
            }
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>{{ 'settings.changePassword' | t }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
            <mat-form-field appearance="outline" class="field">
              <mat-label>{{ 'settings.currentPassword' | t }}</mat-label>
              <input matInput type="password" formControlName="current_password" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="field">
              <mat-label>{{ 'settings.newPassword' | t }}</mat-label>
              <input matInput type="password" formControlName="new_password" />
            </mat-form-field>
            <button mat-flat-button color="primary" [disabled]="passwordForm.invalid">
              {{ 'settings.updatePassword' | t }}
            </button>
            @if (passwordMsg()) {
              <span class="ok">{{ passwordMsg() }}</span>
            }
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .settings {
        display: grid;
        gap: 1rem;
        padding: 1rem;
        max-width: 560px;
      }
      .field {
        width: 100%;
      }
      .ok {
        margin-left: 0.75rem;
        color: green;
      }
      .hint {
        color: var(--text-muted);
        margin: 0 0 0.75rem;
        font-size: 0.85rem;
      }
      .lang-group {
        flex-wrap: wrap;
      }
      .flag {
        font-size: 1.1rem;
        margin-right: 0.25rem;
      }
    `,
  ],
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly translation = inject(TranslationService);
  readonly languages = LANGUAGES;

  setLang(lang: Lang): void {
    this.translation.setLang(lang);
  }

  readonly savedProfile = signal(false);
  readonly passwordMsg = signal<string | null>(null);

  readonly profileForm = this.fb.nonNullable.group({
    full_name: [this.auth.currentUser()?.profile?.full_name ?? ''],
    bio: [this.auth.currentUser()?.profile?.bio ?? ''],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    current_password: ['', [Validators.required]],
    new_password: ['', [Validators.required, Validators.minLength(8)]],
  });

  saveProfile(): void {
    this.http
      .put<User>(`${environment.apiUrl}/users/profile`, this.profileForm.getRawValue())
      .subscribe((user) => {
        this.auth.currentUser.set(user);
        this.savedProfile.set(true);
        setTimeout(() => this.savedProfile.set(false), 2000);
      });
  }

  changePassword(): void {
    this.http
      .post<{ detail: string }>(
        `${environment.apiUrl}/auth/change-password`,
        this.passwordForm.getRawValue(),
      )
      .subscribe({
        next: (res) => {
          this.passwordMsg.set(res.detail);
          this.passwordForm.reset();
        },
        error: (err) => this.passwordMsg.set(err?.error?.detail ?? 'Failed'),
      });
  }
}
