import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError, tap } from 'rxjs';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Incident {
  id: string;
  code: string;
  designation: string;
  fullDesignation: string;
  description: string;
  cause: string;
  consequence: string;
  type: number;
  typeStr: string;
  number: number;
  state: number;
  stateStr: string;
  incidentDate: string;
  declarationDate: string;
  approveDate: string | null;
  replyDate: string | null;
  duration: number;
  employeeId: string;
  employeeFullName: string;
  incidentTeams: any[];
  currentEmployeeId: string;
  currentUserId: string;
  isSystem: boolean;
  crudFrom: number;
  observation: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi/api';
  private apiUrltoken = 'https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi/token';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getcompanies(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    return this.http.get(`${this.apiUrl}/authorize/companies`, { headers });
  }
  
  getIncidents(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get(`${this.apiUrl}/incidents`, { headers });
  }
  getEmployees(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    return this.http.get(`${this.apiUrl}/Employees`, { headers });
  }
  getusers(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    return this.http.get(`${this.apiUrl}/ChatGroup/users`, { headers });
  }

  createIncident(incident: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(`${this.apiUrl}/incidents`, incident, { headers });
  }

  uploadFile(incidentId: number, file: File): Observable<any> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('incidentId', incidentId.toString());
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(`${this.apiUrl}/Incidents/IncidentFile`, formData, { headers });
  }

  deleteIncident(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    return this.http.delete(`${this.apiUrl}/Incidents/${id}`, { headers });
  }

  getIncidentById(id: number): Observable<Incident> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    console.log('Fetching incident with ID:', id);
    return this.http.get<Incident>(`${this.apiUrl}/Incidents/${id}`, { headers }).pipe(
      tap(response => console.log('API Response:', response))
    );
  }

  updateIncident(id: string, incident: Partial<Incident>): Observable<Incident> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.put<Incident>(`${this.apiUrl}/Incidents/${id}`, incident, { headers });  
  }

  getIncident(id: string): Observable<Incident> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    console.log('Appel API getIncident avec ID:', id);
    console.log('URL complète:', `${this.apiUrl}/incidents/${id}`);
    return this.http.get<Incident>(`${this.apiUrl}/incidents/${id}`, { headers }).pipe(
      tap(response => console.log('Réponse API getIncident:', response)),
      catchError(error => {
        console.error('Erreur API getIncident:', error);
        return throwError(() => error);
      })
    );
  }

  getIncidentTeams(incidentId: string): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    return this.http.get<any[]>(`${this.apiUrl}/incidents/${incidentId}/teams`, { headers });
  }
}
