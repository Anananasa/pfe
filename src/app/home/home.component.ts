import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router'; // ✅ Import nécessaire

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonicModule, RouterModule], // ✅ Ajoute RouterModule ici
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit() {}
}
