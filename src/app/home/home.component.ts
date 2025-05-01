import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonContent } from "@ionic/angular/standalone";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonContent, RouterModule], // ✅ Ajoute RouterModule ici
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit() {}
}
