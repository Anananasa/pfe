import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  groupId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi`;

  constructor(private http: HttpClient) {}

  getMessages(groupId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/api/ChatGroup/${groupId}/messages`);
  }

  sendMessage(groupId: string, content: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/api/ChatGroup/GroupMessage`, {
      groupId,
      msg: content,
      type: 1,
      isDeleted: false
    });
  }

  saveMessage(message: ChatMessage): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/messages`, message);
  }
} 