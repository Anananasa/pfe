import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

interface IncidentDetails {
  code?: string;
  designation: string;
  date: Date;
  status: string;
}

@Component({
  selector: 'app-image-modal',
  templateUrl: './image-modal.component.html',
  styleUrls: ['./image-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ImageModalComponent {
  @Input() imageUrl!: string;
  @Input() incidentDetails!: IncidentDetails;

  constructor(private modalController: ModalController) {}

  closeModal() {
    this.modalController.dismiss();
  }
} 