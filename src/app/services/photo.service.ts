import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from 'src/app/services/auth.service';

@Injectable({ providedIn: 'root' })
export class PhotoService {

  private apiUrl = 'https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }
  
  async takeAndUploadPhoto(): Promise<any> {
    try {
      // 1. Prendre la photo avec la caméra
      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90
      });

      // 2. Récupérer le fichier image comme Blob
      const response = await fetch(capturedPhoto.webPath!);
      const blob = await response.blob();

      // 3. Générer les noms de fichier
      const originalFileName = `photo_${new Date().getTime()}.jpeg`;
      const generatedFileName = `${originalFileName.split('.')[0]}-${uuidv4()}.jpeg`;
      
      // 4. Préparer le FormData
      const formData = new FormData();
      formData.append('file', blob, originalFileName); // fichier image
      formData.append('fileName', originalFileName);
      formData.append('folderStorage', generatedFileName);
     

      // 5. Envoi au backend via POST 
      const result = await this.http.post(`${this.apiUrl}/api/UploaderFile/Upload`, formData, { headers: this.getAuthHeaders() }).toPromise();
      console.log('Upload successful:', result);

      return result;

    } catch (error) {
      console.error('Photo upload failed:', error);
      throw error;
    }
  }
}
