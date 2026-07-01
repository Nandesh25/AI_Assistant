import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WsEvent } from '../models/ws-event.model';
import { TokenService } from './token.service';

/**
 * Thin wrapper around the native WebSocket. Exposes a stream of typed events and
 * helper send methods. Auto-reconnects with a capped backoff.
 */
@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private readonly tokenService = inject(TokenService);
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private manualClose = false;

  private readonly events$ = new Subject<WsEvent>();
  readonly events = this.events$.asObservable();
  readonly connected = signal(false);
  readonly onlineUsers = signal<Set<number>>(new Set());

  connect(): void {
    const token = this.tokenService.accessToken();
    if (!token || this.socket) {
      return;
    }
    this.manualClose = false;
    this.socket = new WebSocket(`${environment.wsUrl}?token=${token}`);

    this.socket.onopen = () => {
      this.connected.set(true);
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as WsEvent;
      this.handleInternal(data);
      this.events$.next(data);
    };

    this.socket.onclose = () => {
      this.connected.set(false);
      this.socket = null;
      if (!this.manualClose) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = () => this.socket?.close();
  }

  disconnect(): void {
    this.manualClose = true;
    this.socket?.close();
    this.socket = null;
    this.connected.set(false);
  }

  send(type: string, payload: Record<string, unknown>): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    }
  }

  sendMessage(chatId: number, body: string, replyToId?: number): void {
    this.send('message:send', { chat_id: chatId, body, reply_to_id: replyToId ?? null });
  }

  sendTyping(chatId: number, isTyping: boolean): void {
    this.send('message:typing', { chat_id: chatId, is_typing: isTyping });
  }

  markRead(messageId: number): void {
    this.send('message:read', { message_id: messageId });
  }

  private handleInternal(event: WsEvent): void {
    if (event.type === 'presence:init') {
      const ids = (event.payload['online_users'] as number[]) ?? [];
      this.onlineUsers.set(new Set(ids));
    } else if (event.type === 'presence') {
      const userId = event.payload['user_id'] as number;
      const online = event.payload['online'] as boolean;
      const next = new Set(this.onlineUsers());
      online ? next.add(userId) : next.delete(userId);
      this.onlineUsers.set(next);
    }
  }

  private scheduleReconnect(): void {
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15000);
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
  }
}
