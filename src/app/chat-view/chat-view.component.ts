import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../services/chat.service';
import { ChatMessage } from '../services/chat-message.interface';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs/internal/Subscription';

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

  currentUserId: string = '';
  messagesSub: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private chatService: ChatService,
    // Removed messagesSub declaration from constructor
  ) {
    // Get groupId from route params
    this.groupId = this.route.snapshot.params['groupId'];
    
    // Get currentUserId from localStorage (assuming it stores user data with 'id')
    const authData = localStorage.getItem('authData');
    if (authData) {
      const userData = JSON.parse(authData);
      this.currentUserId = userData.id;
    }
  }

  ngOnInit() {
    this.loadMessages();
    this.listenForMessages();
  }

  listenForMessages() {
    this.messagesSub = this.chatService.listenForMessages(this.groupId)
      .subscribe(messages => {
        this.messages = messages;
        console.log('Messages updated:', this.messages);
      });
  }
  

  loadMessages() {
    // Fetch messages based on groupId from the chat service and put it in messages
    this.chatService.getMessages(this.groupId).then((messages: ChatMessage[]) => {
      this.messages = messages;
    }).catch((error: Error) => {
      console.error('Erreur lors de la récupération des messages:', error);
    });
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      // Send new message using groupId and newMessage
      this.chatService.sendMessage(this.groupId, this.authService.getCurrentUserId() || 'null', this.newMessage).then(() => {
        this.newMessage = '';  // Clear the input after sending
        this.loadMessages();    // Reload messages after sending
      }).catch((error: Error) => {
        console.error('Erreur lors de l\'envoi du message:', error);
      });
    }
  }
  ngOnDestroy() {
    if (this.messagesSub) {
      this.messagesSub.unsubscribe();
    }
  }
}
