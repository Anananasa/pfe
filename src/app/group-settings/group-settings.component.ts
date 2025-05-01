import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, users } from '../services/auth.service';
import { GroupService } from '../services/group.service';
import { IonHeader, IonBackButton, ActionSheetController, ToastController, IonContent, IonTitle, IonButtons, IonToolbar, IonItem, IonLabel, IonList, IonItemDivider, IonAvatar, IonButton, IonIcon, IonFooter } from "@ionic/angular/standalone";

interface GroupParticipant {
  userId: string;
  isAdmin: boolean;
  photo: string;
  fullName: string;
}

@Component({
  selector: 'app-group-settings',
  templateUrl: './group-settings.component.html',
  styleUrls: ['./group-settings.component.scss'],
  standalone: true,
  imports: [IonFooter, IonIcon, IonButton, IonAvatar, IonItemDivider, IonList, IonLabel, IonItem, IonToolbar, IonButtons, IonTitle, IonContent, IonBackButton, IonHeader, CommonModule, FormsModule]
})
export class GroupSettingsComponent implements OnInit {
  groupTitle: string = '';
  participants: GroupParticipant[] = [];
  availableusers: users[] = [];
  groupId: string = '';
  isEditing: boolean = false;
  incidentId: string = '';

  constructor(
    private authService: AuthService,
    private groupService: GroupService,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.groupId = this.route.snapshot.params['groupId'];
    console.log('ID du groupe:', this.groupId); // Debug log
    if (this.groupId) {
      this.loadGroupDetails();
    }
    this.loadUsers();
  }

  async loadGroupDetails() {
    try {
      const groupDetails = await this.groupService.getGroupDetails(this.groupId);
      console.log('Détails du groupe:', groupDetails); // Debug log
      
      this.groupTitle = groupDetails['name'];
      this.participants = groupDetails['participants'];
       
      
      this.isEditing = true;
    } catch (error) {
      console.error('Erreur lors du chargement des détails du groupe:', error);
      await this.showToast('Erreur lors du chargement des détails du groupe', 'danger');
    }
  }

  loadUsers() {
    this.authService.getUsers().subscribe({
      next: users => {
        this.availableusers = users;
        console.log('Utilisateurs disponibles:', this.availableusers); // Debug log
        this.cdr.detectChanges();
        
        // Si nous sommes en mode édition, recharger les détails du groupe
        // pour avoir les noms complets des participants
        if (this.groupId) {
          this.loadGroupDetails();
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error); // Debug log
        this.showToast('Erreur lors du chargement des utilisateurs', 'danger');
      }
    });
  }

  async addParticipant() {
    this.loadUsers();
    console.log(this.participants);
  
    const buttons = this.availableusers
      .filter(user => !this.participants.some(p => p.userId === user.userId))
      .map(user => ({
        text: user.fullName,
        handler: () => {
          this.participants.push({
            userId: user.userId,  // lowercase
            isAdmin: false,
            photo: user.urlImg,
            fullName: user.fullName
          });
          
        }
      }));
  
    if (buttons.length === 0) {
      await this.showToast('Tous les utilisateurs sont déjà ajoutés');
      return;
    }
  
    const actionSheet = await this.actionSheetController.create({
      header: 'Sélectionner un participant',
      buttons: [...buttons]
    });
  
    await actionSheet.present();
  }
  
  

  toggleRole(participant: GroupParticipant) {
    participant.isAdmin = !participant.isAdmin;
  }

  removeParticipant(participant: GroupParticipant) {
    this.participants = this.participants.filter(p => p.userId !== participant.userId);
  }

  getuserPhotoUrl(user: GroupParticipant): string {
    if (!user.photo) {
      return 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
    return `https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi/Uploaded/user/${user.photo}`;
  }

  

  async saveGroup() {
    try {
      const adminId = this.authService.getCurrentUserId() || 'null';
      await this.groupService.saveGroup(this.groupTitle, adminId, this.incidentId, this.participants, this.groupId);
        await this.showToast('Groupe créé avec succès');
      
    } catch (error) {
      console.error(error);
      await this.showToast('Erreur lors de la création du groupe', 'danger');
    }
  }

  cancel() {
    this.router.navigate(['/incident-list']);
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}


  