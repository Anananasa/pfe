import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle } from "@ionic/angular/standalone";

@Component({
  selector: 'app-nav-header',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="backUrl"></ion-back-button>
        </ion-buttons>
        <ion-title>{{title}}</ion-title>
        
      </ion-toolbar>
    </ion-header>
  `,
  styleUrls: ['./nav-header.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle]
})
export class NavHeaderComponent {
  @Input() title: string = '';
  @Input() backUrl: string = '/home';
} 