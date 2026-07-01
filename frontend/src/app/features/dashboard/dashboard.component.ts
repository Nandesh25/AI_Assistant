import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../core/services/chat.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { AuthService } from '../../core/services/auth.service';
import { Chat } from '../../core/models/chat.model';
import { AvatarComponent } from '../../shared/ui/avatar.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, MatIconModule, AvatarComponent, TranslatePipe],
  template: `
    <div class="page">
      <section class="hero">
        <div class="hero-text">
          <h1>{{ 'dash.hello' | t }}, {{ name() }} 👋</h1>
          <p>{{ 'dash.subtitle' | t }}</p>
        </div>
        <a class="cta" routerLink="/chat">
          <mat-icon>add_comment</mat-icon> {{ 'dash.newChat' | t }}
        </a>
      </section>

      <section class="stats">
        <div class="stat stat-a">
          <div class="stat-icon"><mat-icon>chat_bubble</mat-icon></div>
          <div class="stat-num">{{ chats().length }}</div>
          <div class="stat-label">{{ 'dash.conversations' | t }}</div>
        </div>
        <div class="stat stat-b">
          <div class="stat-icon"><mat-icon>bolt</mat-icon></div>
          <div class="stat-num">{{ ws.onlineUsers().size }}</div>
          <div class="stat-label">{{ 'dash.onlineNow' | t }}</div>
        </div>
        <div class="stat stat-c">
          <div class="stat-icon"><mat-icon>groups</mat-icon></div>
          <div class="stat-num">{{ groupCount() }}</div>
          <div class="stat-label">{{ 'dash.groups' | t }}</div>
        </div>
        <div class="stat stat-d">
          <div class="stat-icon"><mat-icon>smart_toy</mat-icon></div>
          <div class="stat-num">AI</div>
          <div class="stat-label">{{ 'dash.assistantReady' | t }}</div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>{{ 'dash.recentChats' | t }}</h2>
          <a routerLink="/chat" class="link">{{ 'dash.viewAll' | t }}</a>
        </div>
        @if (chats().length) {
          <div class="chat-list">
            @for (chat of chats(); track chat.id) {
              <a class="chat-row" [routerLink]="['/chat', chat.id]">
                <app-avatar
                  [name]="displayName(chat)"
                  [size]="44"
                  [bot]="displayName(chat) === 'ai-assistant'"
                  [showStatus]="chat.type === 'direct'"
                  [online]="isOnline(chat)"
                />
                <span class="meta">
                  <span class="name">{{ displayName(chat) }}</span>
                  <span class="sub">{{ (chat.type === 'group' ? 'dash.group' : 'dash.directMessage') | t }}</span>
                </span>
                <span class="time">{{ chat.created_at | date: 'shortDate' }}</span>
              </a>
            }
          </div>
        } @else {
          <div class="empty">
            <mat-icon>forum</mat-icon>
            <p>{{ 'dash.noConversations' | t }}</p>
          </div>
        }
      </section>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        max-width: 1100px;
        margin: 0 auto;
      }
      .hero {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.75rem 2rem;
        border-radius: 20px;
        background: var(--brand-grad);
        color: #fff;
        box-shadow: var(--shadow-lg);
        animation: fade-up 0.35s ease-out;
      }
      .hero h1 {
        margin: 0 0 0.25rem;
        font-size: 1.7rem;
      }
      .hero p {
        margin: 0;
        opacity: 0.9;
      }
      .cta {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: rgba(255, 255, 255, 0.18);
        border: 1px solid rgba(255, 255, 255, 0.35);
        color: #fff;
        padding: 0.6rem 1rem;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 600;
        transition: background 0.15s;
      }
      .cta:hover {
        background: rgba(255, 255, 255, 0.28);
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
      }
      .stat {
        position: relative;
        padding: 1.25rem;
        border-radius: 18px;
        color: #fff;
        overflow: hidden;
        box-shadow: var(--shadow-md);
        animation: pop-in 0.3s ease-out both;
      }
      .stat-a { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
      .stat-b { background: linear-gradient(135deg, #06b6d4, #2563eb); }
      .stat-c { background: linear-gradient(135deg, #10b981, #059669); }
      .stat-d { background: linear-gradient(135deg, #f59e0b, #ea580c); }
      .stat-icon {
        position: absolute;
        top: 1rem;
        right: 1rem;
        opacity: 0.35;
      }
      .stat-icon mat-icon {
        font-size: 34px;
        width: 34px;
        height: 34px;
      }
      .stat-num {
        font-size: 2.1rem;
        font-weight: 700;
        line-height: 1;
      }
      .stat-label {
        margin-top: 0.35rem;
        opacity: 0.92;
        font-size: 0.85rem;
      }

      .panel {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 18px;
        box-shadow: var(--shadow-md);
        padding: 1.25rem 1.5rem;
      }
      .panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }
      .panel-head h2 {
        margin: 0;
        font-size: 1.15rem;
      }
      .link {
        color: var(--brand-2);
        text-decoration: none;
        font-weight: 600;
        font-size: 0.85rem;
      }
      .chat-list {
        display: flex;
        flex-direction: column;
      }
      .chat-row {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 0.65rem 0.5rem;
        border-radius: 12px;
        text-decoration: none;
        color: var(--text);
        transition: background 0.15s;
      }
      .chat-row:hover {
        background: var(--surface-2);
      }
      .meta {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      .name {
        font-weight: 600;
      }
      .sub {
        font-size: 0.76rem;
        color: var(--text-muted);
      }
      .time {
        font-size: 0.76rem;
        color: var(--text-muted);
      }
      .empty {
        text-align: center;
        padding: 2rem;
        color: var(--text-muted);
      }
      .empty mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        opacity: 0.5;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private readonly chatService = inject(ChatService);
  private readonly auth = inject(AuthService);
  readonly ws = inject(WebsocketService);

  readonly chats = signal<Chat[]>([]);
  readonly groupCount = signal(0);
  readonly name = computed(
    () => this.auth.currentUser()?.profile?.full_name || this.auth.currentUser()?.username || 'there',
  );

  ngOnInit(): void {
    this.chatService.getChats().subscribe((chats) => {
      this.chats.set(chats);
      this.groupCount.set(chats.filter((c) => c.type === 'group').length);
    });
  }

  displayName(chat: Chat): string {
    if (chat.type === 'group') {
      return chat.name ?? 'Group';
    }
    const me = this.auth.currentUser()?.id;
    const other = chat.members.find((m) => m.user_id !== me);
    return other?.user?.username ?? 'Direct chat';
  }

  isOnline(chat: Chat): boolean {
    const me = this.auth.currentUser()?.id;
    const other = chat.members.find((m) => m.user_id !== me)?.user_id;
    return other !== undefined && this.ws.onlineUsers().has(other);
  }
}
