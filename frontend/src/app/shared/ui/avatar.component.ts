import { Component, computed, input } from '@angular/core';
import { gradientFor, initialsFor } from '../utils/avatar.util';

/**
 * Reusable avatar: shows a deterministic gradient circle with the user's
 * initials, plus an optional online presence dot. Bot avatars get a robot icon.
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    <span
      class="avatar"
      [style.background]="bg()"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.fontSize.px]="size() * 0.4"
    >
      @if (bot()) {
        <span class="bot">🤖</span>
      } @else {
        {{ initials() }}
      }
      @if (showStatus()) {
        <span class="dot" [class.on]="online()"></span>
      }
    </span>
  `,
  styles: [
    `
      .avatar {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: #fff;
        font-weight: 600;
        flex-shrink: 0;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
        user-select: none;
      }
      .bot {
        filter: saturate(1.1);
      }
      .dot {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 28%;
        height: 28%;
        border-radius: 50%;
        background: #9ca3af;
        border: 2px solid var(--surface, #fff);
      }
      .dot.on {
        background: #22c55e;
        box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25);
      }
    `,
  ],
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly size = input(40);
  readonly online = input(false);
  readonly showStatus = input(false);
  readonly bot = input(false);

  readonly initials = computed(() => initialsFor(this.name()));
  readonly bg = computed(() => gradientFor(this.name()));
}
