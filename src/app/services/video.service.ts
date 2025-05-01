import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { MediaCapture, MediaFile, CaptureVideoOptions } from '@awesome-cordova-plugins/media-capture/ngx';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { v4 as uuidv4 } from 'uuid';
import { isPlatform } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class VideoService {
  private apiUrl = 'https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi';

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private mediaCapture: MediaCapture,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  async recordVideo(): Promise<any> {
    try {
      console.log("Appel à videoService.recordVideo()");
      
      if (isPlatform('capacitor')) {
        return await this.recordVideoNative();
      } else {
        return await this.recordVideoWeb();
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement vidéo :", error);
      throw new Error("Impossible d'enregistrer la vidéo. Veuillez vérifier les permissions et réessayer.");
    }
  }

  private async recordVideoNative(): Promise<any> {
    try {
      const options: CaptureVideoOptions = { limit: 1, duration: 30 };
      const captured = await this.mediaCapture.captureVideo(options);

      if (!Array.isArray(captured) || captured.length === 0) {
        throw new Error("Aucune vidéo capturée");
      }

      const video: MediaFile = captured[0];
      console.log("Vidéo capturée :", video.name, video.fullPath);

      const blob = await this.readAsBlob(video.fullPath);
      console.log("Blob prêt à l'envoi :", blob);

      const safeBlob = new Blob([blob], { type: blob.type || 'video/mp4' });
      return await this.uploadVideo(safeBlob, video.name);
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la vidéo native :", err);
      throw new Error("Erreur lors de l'enregistrement vidéo sur l'appareil. Veuillez réessayer.");
    }
  }

  private async recordVideoWeb(): Promise<any> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      return new Promise((resolve, reject) => {
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          try {
            const videoBlob = new Blob(chunks, { type: 'video/webm' });
            const fileName = `video-${uuidv4()}.webm`;
            resolve(await this.uploadVideo(videoBlob, fileName));
          } catch (error) {
            reject(error);
          }
        };
        mediaRecorder.onerror = (error) => {
          console.error("Erreur MediaRecorder :", error);
          reject(new Error("Erreur lors de l'enregistrement vidéo dans le navigateur."));
        };
        mediaRecorder.start();
        setTimeout(() => {
          try {
            mediaRecorder.stop();
            stream.getTracks().forEach(track => track.stop());
          } catch (error) {
            console.error("Erreur lors de l'arrêt de l'enregistrement :", error);
          }
        }, 30000);
      });
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la vidéo web :", err);
      throw new Error("Impossible d'accéder à la caméra. Veuillez vérifier les permissions et réessayer.");
    }
  }

  private async uploadVideo(videoBlob: Blob, fileName: string): Promise<any> {
    try {
      const generatedFileName = `${fileName.split('.')[0]}-${uuidv4()}.${fileName.split('.').pop()}`;
      const formData = new FormData();
      formData.append('file', videoBlob, fileName);
      formData.append('fileName', fileName);
      formData.append('folderStorage', generatedFileName);

      console.log("Upload en cours...");
      return await this.http.post(`${this.apiUrl}/api/UploaderFile/Upload`, formData, {
        headers: this.getAuthHeaders()
      }).toPromise();
    } catch (error) {
      console.error("Erreur lors de l'upload de la vidéo :", error);
      throw new Error("Erreur lors de l'envoi de la vidéo au serveur. Veuillez réessayer.");
    }
  }

  private readAsBlob(path: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        (window as any).resolveLocalFileSystemURL(path,
          (entry: any) => {
            entry.file((file: File) => {
              console.log("Fichier récupéré :", file);
              resolve(file);
            }, (err: any) => {
              console.error("Erreur lors de l'accès au fichier :", err);
              reject(new Error("Impossible d'accéder au fichier vidéo."));
            });
          },
          (err: any) => {
            console.error("Erreur lors de la résolution de l'URL :", err);
            reject(new Error("Impossible de trouver le fichier vidéo."));
          }
        );
      } catch (error) {
        console.error("Erreur lors de la lecture du fichier :", error);
        reject(new Error("Erreur lors du traitement du fichier vidéo."));
      }
    });
  }
}
