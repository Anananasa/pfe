import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { Incident } from './api.service';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  isEnabled: boolean;
  photo?: string;
  currentUserId?: string;
  serialNumber?: string;
  serialNumberFullName?: string;
  departmentDesignation?: string;
  serviceDesignation?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi';
  private apiUrltoken = 'https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi/token';

  
  constructor(private http: HttpClient, private router: Router) {
    
  }

  getCompanies() {
    return this.http.get(`${this.apiUrl}/api/authorize/companies`);
  }
  getEmployees(): Observable<Employee[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    return this.http.get<Employee[]>(`${this.apiUrl}/api/Employees`, { headers }).pipe(
      tap(response => {
        console.log('Réponse de l\'API:', response);
      })
    );
  }

  

  getIncidents() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    return this.http.get(`${this.apiUrl}/api/incidents`, { headers });
  }

  getSitesByCompany(companyId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/authorize/${companyId}/SitesByCompany`);
  }

  login(username: string, password: string, companyId: string, siteId: string) {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);
    body.set('companyId', companyId);
    body.set('siteId', siteId);
    body.set('grant_type', 'password');

    return this.http.post<any>(this.apiUrltoken, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(response => {
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('username', username);
        localStorage.setItem('CurrentEmployeeId', response.employeeId);
        localStorage.setItem('CurrentUserId', response.userId);
        
      })
    );
  }
  
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('CurrentEmployeeId');
    localStorage.removeItem('CurrentUserId');

    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  
}
