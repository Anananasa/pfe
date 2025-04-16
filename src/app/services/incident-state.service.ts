import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IncidentStateService {
  private refreshList = new Subject<void>();
  refreshList$ = this.refreshList.asObservable();

  triggerRefresh() {
    this.refreshList.next();
  }
} 