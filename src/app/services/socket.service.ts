import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  id?: string;
  content: string;
  sender: string;
  timestamp: Date;
  incidentId: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: any;
  private readonly SERVER_URL = 'http://localhost:3000';

  constructor() {
    this.socket = io(this.SERVER_URL);
  }

  joinRoom(incidentId: string): void {
    this.socket.emit('join-room', incidentId);
  }

  sendMessage(message: ChatMessage): void {
    this.socket.emit('send-message', {
      incidentId: message.incidentId,
      message
    });
  }

  onNewMessage(): Observable<ChatMessage> {
    return new Observable(observer => {
      this.socket.on('new-message', (message: ChatMessage) => {
        observer.next(message);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
} 