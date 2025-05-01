import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DxHtmlEditorModule } from 'devextreme-angular';
import { ActionFile } from '../models/action-file';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionService } from '../services/action.service';
import { MediaCapture } from '@awesome-cordova-plugins/media-capture/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { NavigationService } from 'src/app/services/navigation/navigation.service';
import { v4 as uuidv4 } from 'uuid';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';
import { VideoService } from 'src/app/services/media_services/video.service';
import { PhotoService } from 'src/app/services/media_services/photo.service';
import { AudioService } from 'src/app/services/media_services/audio.service';
import { IonIcon, ToastController } from "@ionic/angular/standalone";

@Component({
  selector: 'app-action-media',
  templateUrl: './action-media.component.html',
  styleUrls: ['./action-media.component.scss'],
  imports: [IonIcon, CommonModule, FormsModule, DxHtmlEditorModule]
})
export class ActionMediaComponent  implements OnInit {

  private apiUrl = 'https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi';

  audio: any;
  keys: string[] = [];

  @ViewChild('visualizer') canvasRef!: ElementRef<HTMLCanvasElement>;
  files: { name: string, type: string, url: string }[] = []; // Store added files

  photos: string[] = [];

  audioStream!: MediaStream;
  isRecording = false;
  isPaused = false;
  comments: { content: string, date: Date }[] = []; // Store comments
  commentText: string = ''; // Content of the text editor

  // Variables for Audit File generation
  actionId: string | null = null;
  processId: string | null = null;
  isLoading: boolean = false;
  pageTitle: string = ''; // Page title to display

  
  constructor(
    public photoService: PhotoService,
    private videoService: VideoService,
    private authService: AuthService,
    private audioService: AudioService,
    public actionService: ActionService,
    private cdr: ChangeDetectorRef, 
    private route: ActivatedRoute,
    private router: Router,
    private toastController: ToastController,
    private media: MediaCapture,
    private opener: FileOpener, 
    private datePipe: DatePipe,
    private http: HttpClient,
    ) { }

  ngOnInit() {}


  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }
  
  getActionData(actionId: string) {
    this.actionService.getActionById(actionId).subscribe((data) => {
      if (data) {
        this.actionService.action = data;

        // Si des fichiers existent, récupérer le commentaire du premier fichier
        if (this!.actionService!.action!.actionFiles!.length > 0) {
          const firstFile = this.actionService.action.actionFiles![0];
          this.commentText = firstFile.comments || '';  // Assigner le commentaire au champ commentText
        }
      }
    });
  }
  
  //SECTION FICHIERS 
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.add('active');
  }
  
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    (document.querySelector('.drag-drop-area') as HTMLElement)?.classList.remove('active');
  }
  
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.remove('active');
  
    if (event.dataTransfer?.files.length) {
      Array.from(event.dataTransfer.files).forEach(async (file) => {
        try {
          const filePathResponse = await this.uploadFile(file);
          this.addToActionFiles(filePathResponse);
          this.cdr.detectChanges();
        } catch (err) {
          console.error("Erreur lors du drop upload :", err);
        }
      });
    }
  }
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(async (file) => {
        try {
          const filePathResponse = await this.uploadFile(file);
          this.addToActionFiles(filePathResponse);
          this.cdr.detectChanges();
        } catch (err) {
          console.error("Erreur lors de l'upload du fichier sélectionné :", err);
        }
      });
    }
  }  
  
  // Fonction commune pour uploader un fichier directement
  uploadFile(file: File): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const originalFileName = file.name;
        const fileExtension = originalFileName.split('.').pop();
        const generatedFileName = `${originalFileName.split('.')[0]}-${uuidv4()}.${fileExtension}`;
        const folderId = uuidv4();
        const folderPath = `~/Uploaded/${folderId}/Actions/${generatedFileName}`;
        const virtualPath = `${folderPath}/${generatedFileName}`;
        const filePathResponse = `${virtualPath}|${originalFileName}|${generatedFileName}`;
  
        const formData = new FormData();
        formData.append('file', file, originalFileName);
        formData.append('fileName', originalFileName);
        formData.append('folderStorage', generatedFileName);
  
        await this.http.post(`${this.apiUrl}/api/UploaderFile/Upload`, formData, {
          headers: this.getAuthHeaders()
        }).toPromise();
  
        resolve(filePathResponse);
      } catch (error) {
        console.error('Erreur upload fichier', error);
        this.actionService.presentToast("top", "Erreur lors de l’upload du fichier", "danger");
        reject(error);
      }
    });
  }
  


  // SECTION VOICE RECORD
  recordAudio() {
    console.log("Appel à audioService.recordAudio()");
  
    this.audioService.recordAndUploadAudio().then((filePathResponse: string) => {
      this.addToActionFiles(filePathResponse);
    })
    .catch((err) => {
      console.error("Erreur lors de l'ajout de l'audio :", err);
      this.actionService.presentToast("top", "Erreur lors de l’ajout de l’audio", "danger");
    });
  }
  

  // SECTION PHOTOS
  takePhoto() {
    this.photoService.takeAndUploadPhoto().then((filePathResponse: string) => {
      this.addToActionFiles(filePathResponse);
    })
    .catch((error) => {
      console.error("Erreur lors de la prise ou l’envoi de la photo", error);
      this.actionService.presentToast("top", "Erreur lors de la prise ou l’envoi de la photo", "danger");
    });
  }
  
  //SECTION VIDEO 
  recordVideo() {
    console.log("🟡 Appel à videoService.recordVideo()");

    this.videoService.recordVideo().then((filePathResponse: string) => {
      this.addToActionFiles(filePathResponse);
    })
    .catch((err) => {
      console.error("Erreur lors de la vidéo :", err);
      this.actionService.presentToast("top", "Erreur lors de l’ajout de la vidéo", "danger");
    });
  }
  
  addToActionFiles(filePathResponse: string) {
  
    const newActionFile: ActionFile = {
      actionId: this.actionService.action.id,
      comments: this.commentText || '',
      linkType: 0,
      filePath: filePathResponse,
      fileData: '',
      generatedFileName: "",
      virtualPath: "",
      fileName: "",
      createdDate: new Date(),
      createdBy: '',
      updatedBy: '',
      updatedDate: new Date(),
      crudFrom: 0,
      id: uuidv4(),
      currentUserId: '00000000-0000-0000-0000-000000000000',
      currentEmployeeId: '00000000-0000-0000-0000-000000000000',
      isSystem: false,
      crud: 1
    };
  
    if (!this.actionService.action.actionFiles) {
      this.actionService.action.actionFiles = [];
    }
  
    this.actionService.action.actionFiles.push(newActionFile);
    this.actionService.presentToast("top", "Fichier ajouté à l'action", "success");
  }
  
  
  //Ajout des commentires pour les AuditFiles
  setActionFilesComments() {
    if (!this.commentText || this.commentText.trim() === '') {
      console.warn("Le champ de commentaire est vide !");
      return;
    }
  
    this!.actionService!.action!.actionFiles!.forEach(file => {
      file.comments = this.commentText;
    });
    
    console.log("Commentaires mis à jour dans tous les fichiers !");
  }

  deleteFile(fileId: string) {
    const file = this.actionService.action.actionFiles!.find(f => f.id === fileId);
    
    if (file) {
      file.crud = 3; // Mark for deletion
      console.log("File marked for deletion:", file.fileName);
    } else {
      console.error("File not found with ID:", fileId);
    }
  }

  getFullPath(filePath: string): string {
    return filePath?.split('|')[0]?.replace('~', 'https://timserver.northeurope.cloudapp.azure.com/QalitasDemo') || '';
  }
  
}
