import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

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
  imports: [CommonModule, IonicModule, RouterModule]
})
export class NavHeaderComponent {
  @Input() title: string = '';
  @Input() backUrl: string = '/home';
} 