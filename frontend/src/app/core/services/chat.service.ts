import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { UserPublic } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  getChats(): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.api}/chats`);
  }

  getChat(chatId: number): Observable<Chat> {
    return this.http.get<Chat>(`${this.api}/chats/${chatId}`);
  }

  createDirectChat(targetUserId: number): Observable<Chat> {
    return this.http.post<Chat>(`${this.api}/chats`, { target_user_id: targetUserId });
  }

  getMessages(chatId: number, beforeId?: number): Observable<Message[]> {
    const params = beforeId ? `?before_id=${beforeId}` : '';
    return this.http.get<Message[]>(`${this.api}/chats/${chatId}/messages${params}`);
  }

  sendMessage(chatId: number, body: string, replyToId?: number): Observable<Message> {
    return this.http.post<Message>(`${this.api}/chats/${chatId}/messages`, {
      body,
      reply_to_id: replyToId ?? null,
    });
  }

  editMessage(messageId: number, body: string): Observable<Message> {
    return this.http.put<Message>(`${this.api}/messages/${messageId}`, { body });
  }

  deleteMessage(messageId: number): Observable<{ detail: string }> {
    return this.http.delete<{ detail: string }>(`${this.api}/messages/${messageId}`);
  }

  searchUsers(query: string): Observable<UserPublic[]> {
    return this.http.get<UserPublic[]>(
      `${this.api}/users/search?q=${encodeURIComponent(query)}`,
    );
  }

  createGroup(name: string, memberIds: number[]): Observable<Chat> {
    return this.http.post<Chat>(`${this.api}/groups`, { name, member_ids: memberIds });
  }
}
