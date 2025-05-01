import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { MediaCapture, MediaFile, CaptureAudioOptions } from '@awesome-cordova-plugins/media-capture/ngx';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { AuthService } from 'src/app/services/auth.service';
import { isPlatform } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class AudioService {
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

  async recordAndUploadAudio(): Promise<any> {
    try {
      console.log("Appel à audioService.recordAndUploadAudio()");

      if (isPlatform('capacitor')) {
        return await this.recordAndUploadAudioNative();
      } else {
        return await this.recordAndUploadAudioWeb();
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement audio :", error);
      throw new Error("Impossible d'enregistrer l'audio. Veuillez vérifier les permissions et réessayer.");
    }
  }

  private async recordAndUploadAudioNative(): Promise<any> {
    try {
      const options: CaptureAudioOptions = { limit: 1 };
      const captured = await this.mediaCapture.captureAudio(options);

      if (!Array.isArray(captured) || captured.length === 0) {
        throw new Error("Aucun fichier audio capturé.");
      }

      const audio = captured[0] as any;
      console.log("Audio capturé :", audio.name, audio.fullPath);

      const fileData = await Filesystem.readFile({
        path: audio.fullPath,
      });

      const base64Data = typeof fileData.data === 'string' ? fileData.data : '';
      const audioBlob = this.base64ToBlob(base64Data, 'audio/mpeg');

      return await this.uploadAudio(audioBlob, audio.name);
    } catch (error) {
      console.error("Erreur audio native :", error);
      throw new Error("Erreur lors de l'enregistrement audio sur l'appareil. Veuillez réessayer.");
    }
  }

  private async recordAndUploadAudioWeb(): Promise<any> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      return new Promise((resolve, reject) => {
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          try {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' });
            const fileName = `audio-${uuidv4()}.webm`;
            resolve(await this.uploadAudio(audioBlob, fileName));
          } catch (error) {
            reject(error);
          }
        };
        mediaRecorder.onerror = (error) => {
          console.error("Erreur MediaRecorder :", error);
          reject(new Error("Erreur lors de l'enregistrement audio dans le navigateur."));
        };
        mediaRecorder.start();
        setTimeout(() => {
          try {
            mediaRecorder.stop();
            stream.getTracks().forEach(track => track.stop());
          } catch (error) {
            console.error("Erreur lors de l'arrêt de l'enregistrement :", error);
          }
        }, 10000);
      });
    } catch (error) {
      console.error("Erreur audio web :", error);
      throw new Error("Impossible d'accéder au microphone. Veuillez vérifier les permissions et réessayer.");
    }
  }

  private async uploadAudio(audioBlob: Blob, fileName: string): Promise<any> {
    try {
      const generatedFileName = `${fileName.split('.')[0]}-${uuidv4()}.${fileName.split('.').pop()}`;
      const formData = new FormData();
      formData.append('file', audioBlob, fileName);
      formData.append('fileName', fileName);
      formData.append('folderStorage', generatedFileName);

      console.log("Envoi de l'audio au serveur...");
      return await this.http.post(`${this.apiUrl}/api/UploaderFile/Upload`, formData, {
        headers: this.getAuthHeaders()
      }).toPromise();
    } catch (error) {
      console.error("Erreur lors de l'upload de l'audio :", error);
      throw new Error("Erreur lors de l'envoi de l'audio au serveur. Veuillez réessayer.");
    }
  }

  private base64ToBlob(base64: string, contentType: string): Blob {
    try {
      const byteCharacters = atob(base64);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      return new Blob(byteArrays, { type: contentType });
    } catch (error) {
      console.error("Erreur lors de la conversion base64 en Blob :", error);
      throw new Error("Erreur lors du traitement du fichier audio.");
    }
  }
}
