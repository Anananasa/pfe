import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from '../models/employee.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  constructor(private http: HttpClient) {}

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${environment.apiUrl}/Employees`);
  }
} 