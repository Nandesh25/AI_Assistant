import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIChatResponse {
  reply: string;
  model: string;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/ai`;

  chat(message: string, history: AIMessage[]): Observable<AIChatResponse> {
    return this.http.post<AIChatResponse>(`${this.api}/chat`, { message, history });
  }

  summarize(chatId: number): Observable<{ summary: string }> {
    return this.http.post<{ summary: string }>(`${this.api}/summarize`, {
      chat_id: chatId,
    });
  }

  suggestReplies(chatId: number): Observable<{ suggestions: string[] }> {
    return this.http.post<{ suggestions: string[] }>(`${this.api}/suggest-replies`, {
      chat_id: chatId,
    });
  }

  status(): Observable<{ enabled: boolean; model: string }> {
    return this.http.get<{ enabled: boolean; model: string }>(`${this.api}/status`);
  }
}
