import { Injectable } from '@angular/core';
import { MediaCapture, MediaFile, CaptureVideoOptions } from '@awesome-cordova-plugins/media-capture/ngx';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class VideoService {
  private apiUrl = 'https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi';

  constructor(
    private mediaCapture: MediaCapture,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  async recordVideo(): Promise<any> {
    console.log("Appel à videoService.recordVideo()");
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
      
      const originalFileName = video.name;
      const generatedFileName = `${originalFileName.split('.')[0]}-${uuidv4()}.mp4`;
     
      const formData = new FormData();
      formData.append('file', safeBlob, originalFileName);
      formData.append('fileName', originalFileName);
      formData.append('folderStorage', generatedFileName);
     
      console.log("Upload en cours...");
      const response = await this.http.post(`${this.apiUrl}/api/UploaderFile/Upload`, formData, {
        headers: this.getAuthHeaders()
      }).toPromise();

      console.log("Upload terminé :", response);
      return response;
    } catch (err) {
      console.error("Erreur lors de l'upload de la vidéo :", err);
      throw err;
    }
  }

  private readAsBlob(path: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      (window as any).resolveLocalFileSystemURL(path,
        (entry: any) => {
          entry.file((file: File) => {
            console.log("Fichier récupéré :", file);
            resolve(file); 
          }, (err: any) => {
            console.error("Erreur lors de l'accès au fichier :", err);
            reject(err);
          });
        },
        (err: any) => {
          console.error("Erreur lors de la résolution de l'URL :", err);
          reject(err);
        }
      );
    });
  }
}
