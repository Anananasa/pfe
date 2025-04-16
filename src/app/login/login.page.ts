import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  
})
export class loginPage implements OnInit {

  username: string = '';
  password: string = '';
  companies: any[] = [];
  CompanyId: string = '';
  sites: any[] = [];
  SiteId: string = '';
  isLoading: boolean = false; // Loader pour les sites

  constructor(private authService: AuthService, private apiService: ApiService,private router :Router,private toastController: ToastController) {}

  ngOnInit() {
    // Charger les companies au démarrage
    this.authService.getCompanies().subscribe({
      next: (data: any) => {
        this.companies = data || [];
      },
      error: (error) => {
        console.error('Erreur lors du chargement des companies:', error);
      },
    });
  }

  // Charger les sites en fonction de la company sélectionnée
  onCompanyChange() {
    if (!this.CompanyId) {
      this.sites = [];
      return;
    }
  
    console.log('Company sélectionnée:', this.CompanyId);
  
    this.isLoading = true;
  
    this.authService.getSitesByCompany(this.CompanyId).subscribe({
      next: (data: any) => {
        console.log('Sites reçus de API:', data);
        this.sites = data || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des sites:', error);
        this.sites = [];
        this.isLoading = false;
      },
    });
  }
  async showWarning(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000, 
      color: 'danger', 
      position:'top' 
    });
    await toast.present();
  }
  onLogin() {
    if (!this.CompanyId || !this.SiteId || !this.username.trim() || !this.password.trim()) {
        console.error('All fields are required.');
        this.showWarning('⚠️ Tous les champs sont obligatoires !');
    } else {
        this.authService.login(this.username, this.password, this.CompanyId, this.SiteId).subscribe({
            next: () => {
                console.log('Login successful');
                this.router.navigate(['/home'])

            },
            error: (err) => console.error('Login error', err)
        });
    }
  }
}