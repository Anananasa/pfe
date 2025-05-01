// rich-editor.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton } from "@ionic/angular/standalone";

@Component({
  selector: 'app-rich-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Rich Text Editor</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <quill-editor [(ngModel)]="editorContent"></quill-editor>
      <ion-button expand="full" (click)="logContent()">Show Content</ion-button>
    </ion-content>
  `
})
export class RichEditorComponent {
  editorContent: string = '';

  logContent() {
    console.log(this.editorContent);
  }
}
