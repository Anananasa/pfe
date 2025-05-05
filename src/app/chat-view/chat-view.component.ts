import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupService } from '../services/group.service';
import { ChatService } from '../services/chat.service';
import { ChatMessage } from '../services/chat-message.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { ViewChild } from '@angular/core';
//import { IonPopover, IonHeader, IonToolbar, PopoverController, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon, IonContent, IonList, IonItem, IonAvatar, IonLabel, IonFooter } from "@ionic/angular/standalone";
import { IonicModule } from '@ionic/angular';
import { PopoverController, IonPopover } from '@ionic/angular';
interface ChatFileDto {
  name: string;
  data: string;
  type: string;
}

interface Participant {
  "fullName": string;
  "userId": string
}

@Component({
  selector: 'app-chat-view',
  templateUrl: './chat-view.component.html',
  styleUrls: ['./chat-view.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ChatViewComponent implements OnInit {
  @ViewChild('popover') popover?: IonPopover;
  @ViewChild('fileInput') fileInput: any;

  groupId: string = '';
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isPopoverOpen = false;
  groupName: string = '';
  participantsNames: Participant[] = [];

  isAdmin = false;

  currentUserId = this.authService.getCurrentUserId();
  messagesSub: Subscription = new Subscription();

  selectedFiles: ChatFileDto[] = [];

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
    this.groupName = this.route.snapshot.queryParams['groupName'];
    this.participantsNames = JSON.parse(this.route.snapshot.queryParams['participantsNames']);

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
        console.log('Messages avec fichiers:', messages.filter(m => m.files && m.files.length > 0));
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

  openFileInput() {
    this.fileInput.nativeElement.click();
  }

  async handleFileInput(event: any) {
    const files = event.target.files;
    for (let file of files) {
      const base64 = await this.convertFileToBase64(file);
      this.selectedFiles.push({
        name: file.name,
        data: base64,
        type: file.type
      });
    }
    // Réinitialiser l'input file
    this.fileInput.nativeElement.value = '';
  }

  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  sendMessage() {
    if (this.newMessage.trim() || this.selectedFiles.length > 0) {
      const senderId = this.authService.getCurrentUserId() || 'null';
      const messageContent = this.newMessage;
      
      this.chatService.sendMessage(this.groupId, senderId, messageContent, this.selectedFiles)
        .then(async () => {
          this.newMessage = '';
          this.loadMessages();
          const groupDetails = await this.GroupService.getGroupDetails(this.groupId);
          const messages: any = {
            GroupId: groupDetails['apiId'],
            UserId: senderId,
            FullName: 'Unknown',
            Photo: '',
            UrlImg: '',
            Msg: messageContent,
            AttachedFiles: JSON.stringify(this.selectedFiles),
            Files: this.selectedFiles.map(file => ({
              Name: file.name,
              Type: file.type,
              Data: file.data
            })),
            SentDate: new Date(),
            SeenBy: '',
            ConnectionId: '',
            DeleteBy: '',
            Type: 0,
            IsDeleted: false,
            DeletionDate: null,
            SeenByList: [],
            SiteId: groupDetails['siteId'] || '00000000-0000-0000-0000-000000000000',
            CompanyId: groupDetails['companyId'] || '00000000-0000-0000-0000-000000000000',
            IsShared: false,
            SharedWith: '',
            IsBookmark: false,
            SharedWithNames: '',
            CreatedDate: new Date(),
            CreatedBy: senderId,
            UpdatedDate: new Date(),
            UpdatedBy: senderId,
            CrudFrom: 0,
            Id: crypto.randomUUID(),
            CurrentUserId: senderId,
            CurrentEmployeeId: senderId,
            IsSystem: false,
            CRUD: 0
          };
          
          this.selectedFiles = [];
          try {
            console.log(messages);
            await this.GroupService.sendMessageToApi(messages);
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
    
  getFullPath(filePath: string): string {
    return filePath?.split('|')[0]?.replace('~', 'https://timserver.northeurope.cloudapp.azure.com/QalitasDemo') || '';
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

  removeFile(file: ChatFileDto) {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
  }

  downloadFile(file: ChatFileDto) {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    link.click();
  }

  getSenderName(senderId: string): string {
    return this.participantsNames.find(p => p.userId === senderId)?.fullName || 'Utilisateur';
  }

  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'document-text-outline';
      case 'doc':
      case 'docx':
        return 'document-text-outline';
      case 'xls':
      case 'xlsx':
        return 'document-text-outline';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image-outline';
      default:
        return 'document-outline';
    }
  }

  openFile(file: ChatFileDto) {
    window.open(file.data, '_blank');
  }
  
}
