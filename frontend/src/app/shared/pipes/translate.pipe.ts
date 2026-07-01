import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

/**
 * Usage: {{ 'nav.dashboard' | t }}
 *
 * Impure so it re-evaluates when the active language changes (the change is
 * triggered by a user event, so it falls within a normal change-detection run).
 */
@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly translation = inject(TranslationService);

  transform(key: string): string {
    return this.translation.translate(key);
  }
}
