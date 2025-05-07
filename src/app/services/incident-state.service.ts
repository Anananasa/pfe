import { Injectable } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IncidentStateService {
  private refreshList = new Subject<void>();
  refreshList$ = this.refreshList.asObservable();
  private destroy$ = new Subject<void>();
  private pollingInterval = 30000; // 30 secondes

  constructor() {
    this.startPolling();
  }

  private startPolling() {
    interval(this.pollingInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.triggerRefresh();
      });
  }

  triggerRefresh() {
    this.refreshList.next();
  }

  stopPolling() {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 