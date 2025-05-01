import { Injectable } from '@angular/core';
import { MediaCapture, MediaFile, CaptureAudioOptions } from '@awesome-cordova-plugins/media-capture/ngx';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { AuthService } from 'src/app/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AudioService {

  private apiUrl = 'https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi';

  constructor(private mediaCapture: MediaCapture, private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  async recordAndUploadAudio(): Promise<any> {
    console.log("Appel à audioService.recordAndUploadAudio()");

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

      console.log("Audio converti en blob :", audioBlob);

      const originalFileName = audio.name;
      const generatedFileName = `${originalFileName.split('.')[0]}-${uuidv4()}.m4a`;
     
      const formData = new FormData();
      formData.append('file', audioBlob, originalFileName);
      formData.append('fileName', originalFileName);
      formData.append('folderStorage', generatedFileName);
     

      console.log("Envoi de l'audio au serveur...");
      const result = await this.http.post(`${this.apiUrl}/api/UploaderFile/Upload`, formData, {
        headers: this.getAuthHeaders()
      }).toPromise();

      console.log("Upload audio réussi :", result);
      return result;
      
    } catch (error) {
      console.error("Erreur audio :", error);
      throw error;
    }
  }

  private base64ToBlob(base64: string, contentType: string): Blob {
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
  }
}
