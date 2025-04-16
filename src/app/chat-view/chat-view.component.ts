import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../services/chat.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-chat-view',
  templateUrl: './chat-view.component.html',
  styleUrls: ['./chat-view.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class ChatViewComponent implements OnInit {
  groupId: string = '';
  messages: ChatMessage[] = [];
  newMessage: string = '';
  groupTitle: string = '';
  currentUserId: string = '';

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService
  ) {
    this.groupId = this.route.snapshot.params['groupId'];
    const authData = localStorage.getItem('authData');
    if (authData) {
      const userData = JSON.parse(authData);
      this.currentUserId = userData.id;
    }
  }

  ngOnInit() {
    this.loadMessages();
  }

  loadMessages() {
    this.chatService.getMessages(this.groupId).subscribe({
      next: (messages: ChatMessage[]) => {
        this.messages = messages;
      },
      error: (error: Error) => {
        console.error('Erreur lors du chargement des messages:', error);
      }
    });
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.groupId, this.newMessage).subscribe({
        next: () => {
          this.newMessage = '';
          this.loadMessages();
        },
        error: (error: Error) => {
          console.error('Erreur lors de l\'envoi du message:', error);
        }
      });
    }
  }

  showGroupOptions() {
    // TODO: Implémenter les options du groupe (modifier, quitter, supprimer)
  }
} 