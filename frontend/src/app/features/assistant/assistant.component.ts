import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AIMessage, AiService } from '../../core/services/ai.service';

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="assistant">
      <header class="head">
        <mat-icon>smart_toy</mat-icon>
        <div>
          <h2>AI Assistant</h2>
          <span class="model">{{ model() || 'Ollama (local, free)' }}</span>
        </div>
      </header>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <div class="messages">
        @for (m of messages(); track $index) {
          <div class="bubble-row" [class.mine]="m.role === 'user'">
            <div class="bubble">{{ m.content }}</div>
          </div>
        } @empty {
          <div class="hint">
            <mat-icon>auto_awesome</mat-icon>
            <p>Ask me anything. I run locally via Ollama — no API keys, free.</p>
          </div>
        }
        @if (thinking()) {
          <div class="bubble-row">
            <div class="bubble typing">Thinking…</div>
          </div>
        }
      </div>

      <form class="composer" (ngSubmit)="send()">
        <mat-form-field appearance="outline" class="field">
          <input
            matInput
            placeholder="Message the assistant"
            [ngModel]="draft()"
            (ngModelChange)="draft.set($event)"
            name="draft"
            [disabled]="thinking()"
          />
        </mat-form-field>
        <button mat-fab color="primary" type="submit" [disabled]="thinking()"
                aria-label="Send">
          <mat-icon>send</mat-icon>
        </button>
      </form>
    </div>
  `,
  styles: [
    `
      .assistant {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);

        h2 {
          margin: 0;
          font-size: 1.1rem;
        }
        .model {
          font-size: 0.75rem;
          opacity: 0.6;
        }
        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }
      }
      .messages {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .bubble-row {
        display: flex;
        &.mine {
          justify-content: flex-end;
          .bubble {
            background: var(--mat-sys-primary, #1976d2);
            color: var(--mat-sys-on-primary, #fff);
          }
        }
      }
      .bubble {
        max-width: 72%;
        padding: 0.6rem 0.9rem;
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.06);
        white-space: pre-wrap;
      }
      .typing {
        font-style: italic;
        opacity: 0.7;
      }
      .hint {
        margin: auto;
        text-align: center;
        opacity: 0.55;
        mat-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
        }
      }
      .composer {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border-top: 1px solid rgba(0, 0, 0, 0.12);
        .field {
          flex: 1;
        }
      }
    `,
  ],
})
export class AssistantComponent {
  private readonly ai = inject(AiService);

  readonly messages = signal<AIMessage[]>([]);
  readonly draft = signal('');
  readonly thinking = signal(false);
  readonly loading = signal(false);
  readonly model = signal<string>('');

  constructor() {
    this.ai.status().subscribe({
      next: (s) => this.model.set(s.model),
      error: () => undefined,
    });
  }

  send(): void {
    const text = this.draft().trim();
    if (!text || this.thinking()) {
      return;
    }
    const history = this.messages();
    this.messages.update((m) => [...m, { role: 'user', content: text }]);
    this.draft.set('');
    this.thinking.set(true);

    this.ai.chat(text, history).subscribe({
      next: (res) => {
        this.messages.update((m) => [...m, { role: 'assistant', content: res.reply }]);
        this.thinking.set(false);
      },
      error: (err) => {
        this.messages.update((m) => [
          ...m,
          {
            role: 'assistant',
            content: err?.error?.detail ?? 'The assistant is unavailable right now.',
          },
        ]);
        this.thinking.set(false);
      },
    });
  }
}
