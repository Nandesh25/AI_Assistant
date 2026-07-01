import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AvatarComponent } from '../../shared/ui/avatar.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ChatService } from '../../core/services/chat.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { AuthService } from '../../core/services/auth.service';
import { AiService } from '../../core/services/ai.service';
import { Chat } from '../../core/models/chat.model';
import { Message } from '../../core/models/message.model';
import { UserPublic } from '../../core/models/user.model';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    AvatarComponent,
    TranslatePipe,
  ],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.scss',
})
export class ChatPageComponent implements OnInit, OnDestroy {
  // Bound from the route param (withComponentInputBinding).
  @Input() chatId?: string;

  private readonly chatService = inject(ChatService);
  private readonly ws = inject(WebsocketService);
  private readonly auth = inject(AuthService);
  private readonly ai = inject(AiService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly typing$ = new Subject<void>();

  readonly chats = signal<Chat[]>([]);
  readonly messages = signal<Message[]>([]);
  readonly activeChatId = signal<number | null>(null);
  readonly draft = signal('');
  readonly typingUsers = signal<Set<number>>(new Set());
  readonly searchResults = signal<UserPublic[]>([]);
  readonly searchTerm = signal('');

  // AI features
  readonly summary = signal<string | null>(null);
  readonly summaryLoading = signal(false);
  readonly suggestions = signal<string[]>([]);
  readonly suggestionsLoading = signal(false);

  readonly meId = computed(() => this.auth.currentUser()?.id ?? -1);

  constructor() {
    // React to incoming route id changes.
    effect(() => {
      const id = this.chatId ? Number(this.chatId) : null;
      if (id && id !== this.activeChatId()) {
        this.openChat(id);
      }
    });
  }

  ngOnInit(): void {
    this.ws.connect();
    this.loadChats();
    this.listenToSocket();

    this.typing$
      .pipe(debounceTime(1500), takeUntil(this.destroy$))
      .subscribe(() => {
        const id = this.activeChatId();
        if (id) {
          this.ws.sendTyping(id, false);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadChats(): void {
    this.chatService.getChats().subscribe((chats) => this.chats.set(chats));
  }

  openChat(chatId: number): void {
    this.activeChatId.set(chatId);
    this.messages.set([]);
    this.summary.set(null);
    this.suggestions.set([]);
    this.chatService.getMessages(chatId).subscribe((msgs) => {
      // API returns newest-first; show oldest-first.
      this.messages.set([...msgs].reverse());
      this.markVisibleRead();
    });
  }

  selectChat(chatId: number): void {
    this.router.navigate(['/chat', chatId]);
  }

  private listenToSocket(): void {
    this.ws.events.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      switch (event.type) {
        case 'message:new': {
          const msg = event.payload as unknown as Message;
          if (msg.chat_id === this.activeChatId()) {
            this.messages.update((m) => [...m, msg]);
            if (msg.sender_id !== this.meId()) {
              this.ws.markRead(msg.id);
            }
          }
          break;
        }
        case 'message:edited': {
          const msg = event.payload as unknown as Message;
          this.messages.update((list) =>
            list.map((m) => (m.id === msg.id ? msg : m)),
          );
          break;
        }
        case 'message:deleted': {
          const id = event.payload['id'] as number;
          this.messages.update((list) => list.filter((m) => m.id !== id));
          break;
        }
        case 'typing': {
          if ((event.payload['chat_id'] as number) === this.activeChatId()) {
            const userId = event.payload['user_id'] as number;
            const isTyping = event.payload['is_typing'] as boolean;
            const next = new Set(this.typingUsers());
            isTyping ? next.add(userId) : next.delete(userId);
            this.typingUsers.set(next);
          }
          break;
        }
      }
    });
  }

  onInput(): void {
    const id = this.activeChatId();
    if (id) {
      this.ws.sendTyping(id, true);
      this.typing$.next();
    }
  }

  send(): void {
    const id = this.activeChatId();
    const body = this.draft().trim();
    if (!id || !body) {
      return;
    }
    // Send via REST (durable); the WS broadcast echoes it back to us.
    this.chatService.sendMessage(id, body).subscribe();
    this.draft.set('');
    this.suggestions.set([]);
  }

  // ----- AI features -----------------------------------------------------
  summarizeChat(): void {
    const id = this.activeChatId();
    if (!id || this.summaryLoading()) {
      return;
    }
    this.summaryLoading.set(true);
    this.summary.set(null);
    this.ai.summarize(id).subscribe({
      next: (res) => {
        this.summary.set(res.summary);
        this.summaryLoading.set(false);
      },
      error: () => {
        this.summary.set('The AI summary is unavailable right now.');
        this.summaryLoading.set(false);
      },
    });
  }

  dismissSummary(): void {
    this.summary.set(null);
  }

  loadSuggestions(): void {
    const id = this.activeChatId();
    if (!id || this.suggestionsLoading()) {
      return;
    }
    this.suggestionsLoading.set(true);
    this.ai.suggestReplies(id).subscribe({
      next: (res) => {
        this.suggestions.set(res.suggestions);
        this.suggestionsLoading.set(false);
      },
      error: () => this.suggestionsLoading.set(false),
    });
  }

  useSuggestion(text: string): void {
    this.draft.set(text);
    this.send();
  }

  deleteMessage(messageId: number): void {
    this.chatService.deleteMessage(messageId).subscribe();
  }

  searchUsers(): void {
    const term = this.searchTerm().trim();
    if (term.length < 2) {
      this.searchResults.set([]);
      return;
    }
    this.chatService.searchUsers(term).subscribe((users) => this.searchResults.set(users));
  }

  startChat(user: UserPublic): void {
    this.chatService.createDirectChat(user.id).subscribe((chat) => {
      this.searchResults.set([]);
      this.searchTerm.set('');
      this.loadChats();
      this.selectChat(chat.id);
    });
  }

  chatTitle(chat: Chat): string {
    if (chat.type === 'group') {
      return chat.name ?? 'Group';
    }
    const other = chat.members.find((m) => m.user_id !== this.meId());
    return other?.user?.username ?? 'Direct chat';
  }

  /** The other participant's id in a direct chat (for presence/avatar). */
  peerId(chat: Chat): number | null {
    if (chat.type === 'group') return null;
    return chat.members.find((m) => m.user_id !== this.meId())?.user_id ?? null;
  }

  isBotChat(chat: Chat): boolean {
    return this.chatTitle(chat) === 'ai-assistant';
  }

  isOnline(userId: number | null): boolean {
    return userId !== null && this.ws.onlineUsers().has(userId);
  }

  senderName(msg: Message): string {
    return msg.sender?.username ?? 'User';
  }

  activeChat(): Chat | undefined {
    return this.chats().find((c) => c.id === this.activeChatId());
  }

  private markVisibleRead(): void {
    for (const m of this.messages()) {
      if (m.sender_id !== this.meId()) {
        this.ws.markRead(m.id);
      }
    }
  }
}
