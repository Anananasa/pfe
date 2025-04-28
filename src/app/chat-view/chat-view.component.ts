import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { GroupService } from '../services/group.service';
import { ChatService } from '../services/chat.service';
import { ChatMessage } from '../services/chat-message.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { ViewChild } from '@angular/core';
import { IonPopover } from '@ionic/angular';


@Component({
  selector: 'app-chat-view',
  templateUrl: './chat-view.component.html',
  styleUrls: ['./chat-view.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class ChatViewComponent implements OnInit {
  @ViewChild('popover') popover?: IonPopover;

  groupId: string = '';
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isPopoverOpen = false;
  isAdmin = false;

  currentUserId = this.authService.getCurrentUserId();
  messagesSub: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private GroupService: GroupService,
    private chatService: ChatService,
    private popoverController: PopoverController,
    private router: Router
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
    
    this.updateAdmin();
  }

  async updateAdmin() {
    this.chatService.getAdminId(this.groupId).then((adminId: string) => {
      this.isAdmin = this.currentUserId === adminId;
    })
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
      const senderId = this.authService.getCurrentUserId() || 'null';
      const currentUserFullName = localStorage.getItem('CurrentFullName') || ''; // example: you can fetch full name from storage
      const currentEmployeeId = localStorage.getItem('CurrentEmployeeId') || '';
      const currentUserId = localStorage.getItem('CurrentUserId') || '';
      const siteId = localStorage.getItem('CurrentSiteId') || '';
      const companyId = localStorage.getItem('CurrentCompanyId') || '';
  
      const messageContent = this.newMessage;
  
      this.chatService.sendMessage(this.groupId, senderId, messageContent)
        .then(async () => {
          this.newMessage = '';
          this.loadMessages();
  
          // Now send to backend API
          const apiMessage = {
            GroupId: this.groupId,
            UserId: senderId,
            FullName: currentUserFullName,
            Photo: null,
            UrlImg: null,
            Msg: messageContent,
            SentDate: new Date().toISOString(), // or local date if needed
            CreatedBy: currentUserId,
            CurrentUserId: currentUserId,
            CurrentEmployeeId: currentEmployeeId,
            SiteId: siteId,
            CompanyId: companyId,
            IsSystem: false,
            Type: 1
          };
  
          try {
            await this.GroupService.sendMessageToApi(apiMessage);
            console.log('Message sent to backend API successfully!');
          } catch (apiError: any) {
            console.error('Erreur lors de l\'envoi du message à l\'API:', {
              status: apiError.status,
              message: apiError.message,
              error: apiError.error
            });
          }
  
        })
        .catch((error: Error) => {
          console.error('Erreur lors de l\'envoi du message:', error);
        });
    }
  }
  

  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  
  closeMenu() {
    this.isMenuOpen = false;
  }
  async openGroupSettings() {
    this.closeMenu();
    this.router.navigate(['/group-settings', this.groupId]);
  }
    
  

  async leaveGroup() {
    this.isPopoverOpen = false;
    if (!this.currentUserId) return;
    try {
      await this.chatService.leaveGroup(this.groupId, this.currentUserId);
      this.router.navigate(['/incident-list']);
    } catch (error) {
      console.error('Erreur lors de la sortie du groupe:', error);
    }
  }

  async deleteGroup() {
    this.isPopoverOpen = false;
    try {
      await this.chatService.deleteGroup(this.groupId);
      this.router.navigate(['/incident-list']);
    } catch (error) {
      console.error('Erreur lors de la suppression du groupe:', error);
    }
  }

  ngOnDestroy() {
    if (this.messagesSub) {
      this.messagesSub.unsubscribe();
    }
  }
}
