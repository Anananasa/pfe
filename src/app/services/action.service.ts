import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Incident {
  id: string;
  incidentFiles: any[];
  actionFiles?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ActionService {
  private apiUrl = 'https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi/api';
  public action: Incident = { id: '', incidentFiles: [], actionFiles: [] };

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  getActionById(id: string): Observable<Incident> {
    return this.http.get<Incident>(`${this.apiUrl}/Incidents/${id}`, { headers: this.getHeaders() });
  }

  async presentToast(position: 'top' | 'middle' | 'bottom', message: string, color: string) {
    // Implementation will be added later
  }
} 