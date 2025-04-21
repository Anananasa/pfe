import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ActionSheetController, ToastController } from '@ionic/angular';
import { FormsModule, FormControl } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, users } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { ChatGroupService } from '../services/chat-group.service';

interface IncidentTeamDto {
  Id: string;
  isAdmin: boolean;
  isMember: boolean;
  
}
interface GroupParticipant {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  isLoggedIn: boolean;
  fullName: string;
  serviceDesignation: string;
  photo: string;
  urlImg: string;
  isAdmin: boolean;
  isArchived: boolean;
  archiveDate: Date | null;
  isDeleted: boolean;
  deletionDate: Date | null;
  siteId: string | null;
  companyId: string | null;
  isShared: boolean;
  sharedWith: string | null;
  isBookmark: boolean;
  sharedWithNames: string | null;
  createdDate: Date;
  createdBy: string | null;
  updatedDate: Date;
  updatedBy: string | null;
  crudFrom: number;
  currentUserId: string | null;
  currentEmployeeId: string | null;
  isSystem: boolean;
  crud: number;
}

interface GroupParticipantForm extends GroupParticipant {
  userId: string;
  isMember: boolean;
  isAdminControl: FormControl;
  isMemberControl: FormControl;
}

@Component({
  selector: 'app-group-creation',
  templateUrl: './group-creation.component.html',
  styleUrls: ['./group-creation.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class GroupCreationComponent implements OnInit {
  groupTitle: string = '';
  participants: GroupParticipant[] = [];
  availableusers: users[] = [];
  users: users[] = [];
  incidentId: string = '';
  incidentName: string = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private actionSheetController: ActionSheetController,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private chatGroupService: ChatGroupService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    
    this.route.queryParams.subscribe(params => {
      this.incidentId = params['incidentId'];
      this.incidentName = params['incidentName'];
      console.log('Incident ID:', this.incidentId);
      console.log('Incident Name:', this.incidentName);
      if (this.incidentId) {
        this.loadUsers();
      }
    });

  }

  loadIncidentAndusers() {
    this.apiService.getIncident(this.incidentId).subscribe({
      next: (incident) => {
        console.log('Incident chargé:', incident);
        this.groupTitle = incident.designation;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'incident:', error);
      }
    });
  }

  private loadUsers() {
    this.authService.getuser().subscribe({
      next: (users) => {
        console.log('users reçus:', users);
        this.availableusers = users;
        this.groupTitle = `Groupe - ${this.incidentName}`;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      }
    });
  }

  async addParticipant() {
    const buttons = this.availableusers
      .filter(emp => !this.participants.some(p => p.id === emp.UserId))
      .map(emp => {
        console.log('Structure détaillée de l\'employé pour le bouton:', JSON.stringify(emp, null, 2));
        return {
          text: emp.fullName,
          handler: () => {
            console.log('Ajout du participant:', emp);
            this.participants.push({
              id: emp.UserId,
              groupId: '',
              userId: emp.UserId,
              userName: emp.UserName,
              isLoggedIn: false,
              fullName: emp.fullName,
              serviceDesignation: emp.ServiceDesignation,
              photo: emp.urlImg,
              urlImg: emp.urlImg,
              isAdmin: false,
              isArchived: false,
              archiveDate: null,
              isDeleted: false,
              deletionDate: null,
              siteId: null,
              companyId: null,
              isShared: false,
              sharedWith: null,
              isBookmark: false,
              sharedWithNames: null,
              createdDate: new Date(),
              createdBy: localStorage.getItem('CurrentUserId'),
              updatedDate: new Date(),
              updatedBy: localStorage.getItem('CurrentUserId'),
              crudFrom: 0,
              currentUserId: localStorage.getItem('CurrentUserId'),
              currentEmployeeId: localStorage.getItem('CurrentEmployeeId'),
              isSystem: false,
              crud: 0
            });
          }
        };
      });

    console.log('Boutons créés:', buttons);

    if (buttons.length === 0) {
      return;
    }

    const actionSheet = await this.actionSheetController.create({
      header: 'Sélectionner un participant',
      buttons: [
        ...buttons,
        {
          text: 'Annuler',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  toggleRole(participant: GroupParticipant) {
    const currentUserId = localStorage.getItem('CurrentEmployeeId');
    if (participant.id === currentUserId) {
      return;
    }
    participant.isAdmin = !participant.isAdmin;
  }

  removeParticipant(participant: GroupParticipant) {
    const currentUserId = localStorage.getItem('CurrentEmployeeId');
    if (participant.id === currentUserId) {
      return;
    }
    this.participants = this.participants.filter(p => p.id !== participant.id);
  }

  getuserPhotoUrl(user: users | GroupParticipant): string {
    if ('Photo' in user) {
      if (!user.Photo) {
        return 'assets/default-avatar.png';
      }
      return `https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi/Uploaded/user/${user.Photo}`;
    } else {
      return 'assets/default-avatar.png';
    }
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }

  async createGroup() {
    try {
      const currentUserId = localStorage.getItem('CurrentUserId');
      const currentUser = this.availableusers.find(u => u.UserId === currentUserId);
      
      if (!currentUser) {
        await this.showToast('Utilisateur courant non trouvé', 'danger');
        return;
      }

      const currentUserParticipant = {
        id: currentUser.UserId,
        fullName: currentUser.fullName || 'Utilisateur sans nom',
        isAdmin: true,
        userId: currentUser.UserId,
        userName: currentUser.UserName,
        serviceDesignation: currentUser.ServiceDesignation,
        photo: currentUser.urlImg
      };

      const allParticipants = [currentUserParticipant, ...this.participants];

      const response = await this.chatGroupService.createGroup(
        this.incidentId,
        this.groupTitle,
        allParticipants.map(participant => ({
          userId: participant.id,
          fullName: participant.fullName,
          serviceDesignation: 'serviceDesignation' in participant ? participant.serviceDesignation : '',
          photo: 'photo' in participant ? participant.photo : '',
          isAdmin: participant.isAdmin
        }))
      ).toPromise();
      
      if (response && response.id) {
        await this.showToast('Groupe créé avec succès', 'success');
        this.router.navigate(['/chat', response.id]);
      } else {
        await this.showToast('Erreur lors de la création du groupe', 'danger');
      }
    } catch (error) {
      console.error('Erreur lors de la création du groupe:', error);
      await this.showToast('Erreur lors de la création du groupe', 'danger');
    }
  }

  cancel() {
    this.router.navigate(['/incident-list']);
  }
}
