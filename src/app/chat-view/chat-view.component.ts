import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupService } from '../services/group.service';
import { ChatService } from '../services/chat.service';
import { ChatMessage } from '../services/chat-message.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { ViewChild } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ActionSheetController, ToastController } from '@ionic/angular';
import { IonPopover, IonHeader, IonToolbar, PopoverController, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon, IonContent, IonList, IonItem, IonAvatar, IonLabel, IonFooter } from "@ionic/angular/standalone";
import { ModalController } from '@ionic/angular';
import { PopoverController, IonPopover } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Dialog } from '@capacitor/dialog';
import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { isPlatform } from '@ionic/angular';

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
  imports: [IonPopover, IonHeader, IonToolbar, PopoverController, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon, IonContent, IonList, IonItem, IonAvatar, IonLabel, IonFooter, CommonModule, FormsModule],
  providers: [FileChooser]
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
    private modalController: ModalController,
    private authService: AuthService,
    private GroupService: GroupService,
    private chatService: ChatService,
    private popoverController: PopoverController,
    private router: Router,
    private actionSheetController: ActionSheetController,
    private fileChooser: FileChooser,
    private toastController: ToastController
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

  async openFileInput() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Sélectionner un fichier',
      buttons: [
        
        {
          text: 'Choisir une photo',
          icon: 'image',
          handler: () => {
            this.pickImage();
          }
        },
        
        {
          text: 'Choisir une vidéo',
          icon: 'film',
          handler: () => {
            this.pickVideo();
          }
        },
        {
          text: 'Choisir un document',
          icon: 'document',
          handler: () => {
            this.pickDocument();
          }
        },
        {
          text: 'Annuler',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      if (image.base64String) {
        this.selectedFiles.push({
          name: 'photo.jpg',
          data: `data:image/jpeg;base64,${image.base64String}`,
          type: 'image/jpeg'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
    }
  }

  async pickImage() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });

      if (image.base64String) {
        this.selectedFiles.push({
          name: 'image.jpg',
          data: `data:image/jpeg;base64,${image.base64String}`,
          type: 'image/jpeg'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
    }
  }

  async takeVideo() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      
      input.onchange = async (event: any) => {
        const file = event.target.files[0];
        if (file) {
          try {
            const base64Data = await this.fileToBase64(file);
            this.selectedFiles.push({
              name: file.name,
              data: base64Data,
              type: file.type
            });
          } catch (error) {
            console.error('Erreur lors de la conversion du fichier:', error);
            this.showError('Erreur lors de la conversion du fichier');
          }
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Erreur lors de la sélection de la vidéo:', error);
      this.showError('Erreur lors de la sélection de la vidéo');
    }
  }

  async pickVideo() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      
      input.onchange = async (event: any) => {
        const file = event.target.files[0];
        if (file) {
          try {
            const base64Data = await this.fileToBase64(file);
            this.selectedFiles.push({
              name: file.name,
              data: base64Data,
              type: file.type
            });
          } catch (error) {
            console.error('Erreur lors de la conversion du fichier:', error);
            this.showError('Erreur lors de la conversion du fichier');
          }
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Erreur lors de la sélection de la vidéo:', error);
      this.showError('Erreur lors de la sélection de la vidéo');
    }
  }

  async pickDocument() {
    try {
      if (Capacitor.isNativePlatform()) {
        // Sur mobile, on utilise FileChooser
        const fileUri = await this.fileChooser.open();
        if (fileUri) {
          try {
            const fileData = await Filesystem.readFile({
              path: fileUri,
              directory: Directory.Documents
            });

            this.selectedFiles.push({
              name: fileUri.split('/').pop() || 'document',
              data: `data:application/octet-stream;base64,${fileData.data}`,
              type: 'application/octet-stream'
            });
          } catch (error) {
            console.error('Erreur lors de la lecture du fichier:', error);
            this.showError('Erreur lors de la lecture du fichier');
          }
        }
      } else {
        // Sur web, on utilise l'input standard
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt';
        input.multiple = true;
        
        input.onchange = async (event: any) => {
          const files = event.target.files;
          for (let file of files) {
            try {
              const base64Data = await this.fileToBase64(file);
              this.selectedFiles.push({
                name: file.name,
                data: base64Data,
                type: file.type
              });
            } catch (error) {
              console.error('Erreur lors de la conversion du fichier:', error);
              this.showError('Erreur lors de la conversion du fichier');
            }
          }
        };
        
        input.click();
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du document:', error);
      this.showError('Erreur lors de la sélection du document');
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
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
  isImageModalOpen = false;
  selectedImagePath = '';
  openImageFullscreen(filePath: string) {
    this.selectedImagePath = this.getFullPath(filePath);
    this.isImageModalOpen = true;
  }

  closeImageModal() {
    this.isImageModalOpen = false;
    this.selectedImagePath = '';
  
  }
  isVideo(fileName: string): boolean {
    return /\.(mp4|webm|ogg|mov|avi)$/i.test(fileName);
  }
  getFullPath(filePath: string): string {
    return filePath?.split('|')[0]?.replace('~', 'https://timserver.northeurope.cloudapp.azure.com/QalitasDemo') || '';
  }
  isImage(fileName: string): boolean {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);
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

  async downloadFile(file: ChatFileDto) {
    try {
      if (Capacitor.isNativePlatform()) {
        // Sur mobile, on télécharge le fichier dans le stockage local
        const loadingToast = await this.toastController.create({
          message: 'Téléchargement en cours...',
          duration: 0,
          position: 'bottom'
        });
        await loadingToast.present();

        const response = await fetch(file.data);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const blob = await response.blob();
        const base64Data = await this.blobToBase64(blob);
        
        // Créer un nom de fichier unique avec timestamp
        const timestamp = new Date().getTime();
        const fileName = `${timestamp}_${file.name}`;
        
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });

        await loadingToast.dismiss();
        
        const successToast = await this.toastController.create({
          message: `Fichier téléchargé: ${file.name}`,
          duration: 3000,
          position: 'bottom',
          buttons: [
            {
              text: 'OK',
              role: 'cancel'
            }
          ]
        });
        await successToast.present();
      } else {
        // Sur web, on utilise l'approche standard avec un nom de fichier unique
        const timestamp = new Date().getTime();
        const fileName = `${timestamp}_${file.name}`;
        const link = document.createElement('a');
        link.href = file.data;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      const errorToast = await this.toastController.create({
        message: `Erreur lors du téléchargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        duration: 3000,
        position: 'bottom',
        color: 'danger',
        buttons: [
          {
            text: 'OK',
            role: 'cancel'
          }
        ]
      });
      await errorToast.present();
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Supprimer le préfixe "data:*/*;base64," si présent
        const base64 = base64String.split(',')[1] || base64String;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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
  
  private showError(message: string) {
    // Vous pouvez implémenter une méthode pour afficher les erreurs à l'utilisateur
    console.error(message);
  }
}
