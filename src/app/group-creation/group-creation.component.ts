import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, users } from '../services/auth.service';
import { GroupService } from '../services/group.service';
import {  ActionSheetController, ToastController, } from "@ionic/angular/standalone";
import { IonicModule } from '@ionic/angular';

interface GroupParticipant {
  userId: string;
  fullName: string;
  userName: string | null;
  serviceDesignation: string;
  photo: string;
  isAdmin: boolean;
}

@Component({
  selector: 'app-group-creation',
  templateUrl: './group-creation.component.html',
  styleUrls: ['./group-creation.component.scss'],
  standalone: true,
  imports: [IonicModule ,CommonModule, FormsModule ],
})


export class GroupCreationComponent implements OnInit {
  groupTitle: string = '';
  participants: GroupParticipant[] = [];
  availableusers: users[] = [];
  incidentId: string = '';
  incidentName: string = '';
  groupId: string = '';

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
    this.route.queryParams.subscribe(params => {
      this.incidentId = params['incidentId'] || '';
      this.incidentName = params['incidentName'] || '';
      if (this.incidentId) {
        this.groupTitle = `Groupe - ${this.incidentName}`;
        this.loadUsers();
      }
    });
  }

  loadUsers() {
    this.authService.getUsers().subscribe({
      next: users => {
        this.availableusers = users;
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Erreur lors du chargement des utilisateurs', 'danger');
      }
    });
    console.log(this.availableusers);
    
  }

  async createGroupFirebase() {
    try {
      // 1. Create the group
      const adminId = this.authService.getCurrentUserId(); 
      const userIds = this.participants.map(p => p.userId);
      this.groupId = await this.groupService.createGroup(this.groupTitle, adminId!, this.incidentId, this.participants);
      console.log('Group created with ID:', this.groupId);
  
      // 2. Then add participants
      
      console.log('User IDs to add:', this.participants);
      await this.groupService.addUsers(this.groupId, this.incidentId, userIds, this.participants);
  
      console.log('All users added to group!');
      await this.showToast('Groupe créé avec succès');
  
      // Optionally: redirect to group page or clean the form
      this.router.navigate(['/incident-list']);
    } catch (error) {
      console.error('Error creating group:', error);
      await this.showToast('Erreur lors de la création du groupe', 'danger');
    }
  }
  

  async addParticipant() {
    this.loadUsers();
    console.log(this.participants);
  
    const buttons = this.availableusers
      .filter(user => !this.participants.some(p => p.fullName === user.fullName))
      .map(user => ({
        text: user.fullName,
        handler: () => {
          this.participants.push({
            userId: user.userId,  // lowercase
            fullName: user.fullName,
            userName: user.userName,
            serviceDesignation: user.serviceDesignation,
            photo: '',
            isAdmin: false
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
    this.participants = this.participants.filter(p => p.fullName !== participant.fullName);
  }

  getuserPhotoUrl(user: GroupParticipant): string {
    if (!user.photo) {
      return 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
    return `https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi/Uploaded/user/${user.photo}`;
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
