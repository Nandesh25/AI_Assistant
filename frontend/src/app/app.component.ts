import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { TokenService } from './core/services/token.service';
import { WebsocketService } from './core/services/websocket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly ws = inject(WebsocketService);

  ngOnInit(): void {
    // Restore session on a hard refresh: if a token exists, hydrate the user
    // and open the realtime connection.
    if (this.tokenService.hasToken) {
      this.auth.loadCurrentUser().subscribe({
        next: () => this.ws.connect(),
        error: () => this.auth.clearSession(),
      });
    }
  }
}
