import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-image-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Image</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Fermer</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
        <img [src]="imagePath" style="max-width: 90%; max-height: 90%; border-radius: 8px;" />
      </div>
    </ion-content>
  `,
  styleUrls: ['./image-modal.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class ImageModalComponent {
  @Input() imagePath: string = '';

  constructor(private modalController: ModalController) {}

  async dismiss() {
    await this.modalController.dismiss();
  }
}