import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ActionSheetController, ToastController } from '@ionic/angular';
import { FormsModule, FormControl } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, Employee } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { ChatGroupService } from '../services/chat-group.service';

interface GroupParticipant {
  id: string;
  fullName: string;
  isAdmin: boolean;
  isMember: boolean;
  isInformed: boolean;
  commentControl: FormControl;
  isAdminControl: FormControl;
  isMemberControl: FormControl;
  isInformedControl: FormControl;
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
  availableEmployees: Employee[] = [];
  currentUser: Employee | null = null;
  incidentCreator: Employee | null = null;
  incidentId: string = '';
  incidentName: string = '';
  employees: Employee[] = [];

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
    console.log('GroupCreationComponent - ngOnInit');
    const token = localStorage.getItem('token');
    console.log('Contenu du localStorage:');
    Object.keys(localStorage).forEach(key => {
      console.log(`${key}:`, localStorage.getItem(key));
    });
    
    this.route.queryParams.subscribe(params => {
      this.incidentId = params['incidentId'];
      this.incidentName = params['incidentName'];
      console.log('Incident ID:', this.incidentId);
      console.log('Incident Name:', this.incidentName);
      if (this.incidentId) {
        this.loadUsers();
      }
    });
    
    // Ajouter l'utilisateur connecté au groupe
    const CurrentUserId = localStorage.getItem('CurrentUserId');
    console.log('CurrentEmployeeId:', CurrentUserId);
    
    if (CurrentUserId) {
      console.log('Tentative de récupération des employés pour ajouter l\'utilisateur connecté');
      this.authService.getEmployees().subscribe({
        next: (employees) => {
          console.log('Employés récupérés:', employees.length);
          const loggedInUser = employees.find(e => e.currentUserId === CurrentUserId);
          console.log('Utilisateur connecté trouvé:', loggedInUser);          
          if (loggedInUser) {
            console.log('Ajout de l\'utilisateur connecté comme admin');
            this.participants.push({
              id: loggedInUser.id,
              fullName: loggedInUser.fullName,
              isAdmin: true,
              isMember: false,
              isInformed: false,
              commentControl: new FormControl(''),
              isAdminControl: new FormControl(false),
              isMemberControl: new FormControl(false),
              isInformedControl: new FormControl(false)
            });
            this.currentUser = loggedInUser;
            console.log('Participants après ajout:', this.participants);
          } else {
            console.error('Utilisateur connecté non trouvé dans la liste des employés');
          }
        },
        error: (error) => {
          console.error('Erreur lors de la récupération des employés:', error);
        }
      });
    } else {
      console.error('Aucun CurrentEmployeeId trouvé dans localStorage');
    }
  }

  loadIncidentAndEmployees() {
    this.apiService.getIncident(this.incidentId).subscribe({
      next: (incident) => {
        console.log('Incident chargé:', incident);
        this.groupTitle = incident.designation;
        this.loadEmployeesWithCreator(incident.employeeId);
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'incident:', error);
      }
    });
  }

  loadEmployeesWithCreator(creatorId: string) {
    console.log('ID du créateur:', creatorId);
    this.authService.getEmployees().subscribe({
      next: (employees) => {
        console.log('Employés chargés:', employees);
        this.availableEmployees = employees.filter(e => e.isEnabled);
        
        // Récupérer l'utilisateur connecté (sera admin)
        const CurrentUserId = localStorage.getItem('CurrentUserId');
        console.log('Utilisateur connecté ID:', CurrentUserId);
        const loggedInUser = this.availableEmployees.find(e => e.currentUserId === CurrentUserId);
        console.log('Utilisateur connecté trouvé:', loggedInUser);
        
        // Récupérer le créateur de l'incident (sera membre)
        const incidentCreator = this.availableEmployees.find(e => e.currentUserId === creatorId);
        console.log('Créateur trouvé:', incidentCreator);

        this.participants = [];

        // Ajouter l'utilisateur connecté comme admin
        if (loggedInUser) {
          this.participants.push({
            id: loggedInUser.id,
            fullName: loggedInUser.fullName,
            isAdmin: true,
            isMember: false,
            isInformed: false,
            commentControl: new FormControl(''),
            isAdminControl: new FormControl(false),
            isMemberControl: new FormControl(false),
            isInformedControl: new FormControl(false)
          });
          this.currentUser = loggedInUser;
        }

        // Ajouter le créateur comme membre s'il existe et s'il est différent de l'utilisateur connecté
        if (incidentCreator && incidentCreator.id !== CurrentUserId) {
          this.participants.push({
            id: incidentCreator.id,
            fullName: incidentCreator.fullName,
            isAdmin: false,
            isMember: false,
            isInformed: false,
            commentControl: new FormControl(''),
            isAdminControl: new FormControl(false),
            isMemberControl: new FormControl(false),
            isInformedControl: new FormControl(false)
          });
        }

        console.log('Participants finaux:', this.participants);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des employés:', error);
      }
    });
  }

  private loadUsers() {
    // Charger la liste des utilisateurs disponibles
    this.authService.getEmployees().subscribe({
      next: (employees) => {
        console.log('Employés reçus:', employees);
        this.employees = employees;
        this.availableEmployees = employees.filter(e => e.isEnabled);
        
        // Récupérer l'utilisateur connecté
        const currentEmployeeId = localStorage.getItem('CurrentEmployeeId');
        const loggedInUser = this.availableEmployees.find(e => e.id === currentEmployeeId);
        
        if (loggedInUser) {
          // Ajouter l'utilisateur connecté comme admin du groupe
          this.participants.push({
            id: loggedInUser.id,
            fullName: loggedInUser.fullName,
            isAdmin: true,
            isMember: false,
            isInformed: false,
            commentControl: new FormControl(''),
            isAdminControl: new FormControl(false),
            isMemberControl: new FormControl(false),
            isInformedControl: new FormControl(false)
          });
          this.currentUser = loggedInUser;
        }

        // Définir le titre du groupe
        this.groupTitle = `Groupe - ${this.incidentName}`;
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      }
    });
  }

  async addParticipant() {
    const buttons = this.availableEmployees
    .filter(emp => !this.participants.some(p => p.id === emp.id))
    .map(emp => {
      console.log('Structure détaillée de l\'employé pour le bouton:', JSON.stringify(emp, null, 2));
      return {
        text: emp.fullName || `${emp.firstName} ${emp.lastName}`,
        handler: () => {
          console.log('Ajout du participant:', emp);
          this.participants.push({
            ...emp,
            id: emp.id,
            fullName: emp.fullName || `${emp.firstName} ${emp.lastName}`,
            isAdmin: false,
            isMember: false,
            isInformed: false,
            commentControl: new FormControl(''),
            isAdminControl: new FormControl(false),
            isMemberControl: new FormControl(false),
            isInformedControl: new FormControl(false)
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

  removeParticipant(participant: GroupParticipant) {
    // Ne pas permettre la suppression de l'administrateur initial
    if (participant.id === this.currentUser?.id) {
      return;
    }
    this.participants = this.participants.filter(p => p.id !== participant.id);
  }

  toggleRole(participant: GroupParticipant) {
    // Ne pas permettre de changer le rôle de l'administrateur initial
    if (participant.id === this.currentUser?.id) {
      return;
    }
    participant.isAdmin = !participant.isAdmin;
  }

  getEmployeePhotoUrl(employee: Employee | GroupParticipant): string {
    if ('Photo' in employee) {
      if (!employee.Photo) {
        return 'assets/default-avatar.png';
      }
      return `https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi/Uploaded/Employee/${employee.Photo}`;
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
      const response = await this.chatGroupService.createGroup(
        this.incidentId,
        this.groupTitle,
        this.participants
      ).toPromise();
      
      if (response && response.id) {
        this.router.navigate(['/chat', response.id]);
      } else {
        console.error('Réponse invalide du serveur');
      }
    } catch (error) {
      console.error('Erreur lors de la création du groupe:', error);
      // Gérer l'erreur ici
    }
  }

  cancel() {
    this.router.navigate(['/incident-list']);
  }
}
