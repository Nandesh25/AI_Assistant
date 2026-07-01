import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./features/chat/chat-page.component').then((m) => m.ChatPageComponent),
      },
      {
        path: 'chat/:chatId',
        loadComponent: () =>
          import('./features/chat/chat-page.component').then((m) => m.ChatPageComponent),
      },
      {
        path: 'assistant',
        loadComponent: () =>
          import('./features/assistant/assistant.component').then(
            (m) => m.AssistantComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(
            (m) => m.SettingsComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
