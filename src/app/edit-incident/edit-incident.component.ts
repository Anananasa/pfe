import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ActionSheetController } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl, FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService, Incident } from '../services/api.service';
import { IncidentStateService } from '../services/incident-state.service';
import { NavHeaderComponent } from '../nav-header/nav-header.component';
import { AuthService ,Employee} from '../services/auth.service';

interface IncidentTeamDto {
  employeeId: string;
  roleIsSupervisor: boolean;
  roleIsMember: boolean;
  roleIsInformed: boolean;
  roleComments: string;
}
interface GroupParticipant {
  id: string;
  fullName: string;
  isAdmin: boolean;
  isInformed: boolean;
}

interface GroupParticipantForm extends GroupParticipant {
  id: string;
  fullName: string;
  photo: string;
  serialNumber: string;
  isAdmin: boolean;
  isInformed: boolean;
  comment: string;
  commentControl: FormControl;
  isAdminControl: FormControl;
  isMemberControl: FormControl;
  isInformedControl: FormControl;
  isMember: boolean;
}

@Component({
  selector: 'app-edit-incident',
  templateUrl: './edit-incident.component.html',
  styleUrls: ['./edit-incident.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    NavHeaderComponent
  ]
})
export class EditIncidentComponent implements OnInit {
  incidentForm: FormGroup;
  isSubmitting = false;
  error: string | null = null;
  incidentId: string | null = null;
  currentIncident: Incident | null = null;
  participants: GroupParticipantForm[] = [];
  availableEmployees: Employee[] = [];
  currentUser: Employee | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private incidentState: IncidentStateService,
    private authService: AuthService,
    private actionSheetController: ActionSheetController,
    private cdr: ChangeDetectorRef
  ) {
    this.incidentForm = this.fb.group({
      designation: ['', Validators.required],
      date: ['', Validators.required],
      dateDeclaration: ['', Validators.required],
      description: [''],
      duration: [0],
      causes: [''],
      consequences: [''],
      state: [0]
    });
  }
  
  ngOnInit() {
    this.loadEmployees();
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.incidentId = idParam;
      this.loadIncident();
    } else {
      this.error = 'Aucun ID d\'incident fourni';
    }
  }
  stripHtml(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || '';
  }
  

  

  loadEmployees() {
    this.authService.getEmployees().subscribe({
      next: (employees) => {
        this.availableEmployees = employees.filter(e => e.isEnabled);
        const currentUserId = localStorage.getItem('CurrentEmployeeId');
        this.currentUser = this.availableEmployees.find(e => e.id === currentUserId) || null;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des employés:', error);
      }
    });
  }

  loadIncident() {
    this.apiService.getIncident(this.incidentId!).subscribe({
      next: (incident) => {
        this.currentIncident = incident as Incident;
        this.incidentForm.patchValue({
          designation: incident.designation,
          date: this.formatDateForInput(incident.incidentDate),
          dateDeclaration: this.formatDateForInput(incident.declarationDate),
          description: incident.description,
          duration: incident.duration || 0,
          causes: incident.cause,
          consequences: incident.consequence,
          state: incident.state
        });

        this.loadIncidentTeams();
      },
      error: (error) => {
        console.error('Error loading incident:', error);
        this.error = 'Erreur lors du chargement de l\'incident';
      }
    });
  }

  loadIncidentTeams() {
    this.apiService.getIncidentTeams(this.incidentId!).subscribe({
      next: (teams) => {
        console.log('Équipes chargées depuis l\'API:', teams);
        
        if (teams && teams.length > 0) {
          this.participants = teams
            .map((team: any) => {
              console.log('Équipe en cours de traitement:', team);
              
              // Utiliser les informations de l'équipe si l'employé n'est pas trouvé
              const employee = this.availableEmployees.find(e => e.id === team.employeeId);
              if (!employee) {
                console.log('Employé non trouvé pour l\'ID:', team.employeeId);
                // Créer un objet participant à partir des informations de l'équipe
                return {
                  id: team.employeeId,
                  fullName: team.employeeFullName || team.serialNumberFullName?.split(' : ')[1] || 'Employé inconnu',
                  photo: '',
                  serialNumber: team.employeeSerialNumber || team.serialNumberFullName?.split(' : ')[0] || '',
                  isAdmin: team.roleIsSupervisor || false,
                  isApprover: team.roleIsApprover || false,
                  isEvaluator: team.roleIsEvaluator || false,
                  isInformed: team.roleIsInformed || false,
                  comment: team.roleComments || '',
                  commentControl: new FormControl(team.roleComments || ''),
                  isAdminControl: new FormControl(team.roleIsSupervisor || false),
                  isMemberControl: new FormControl(!team.roleIsSupervisor && !team.roleIsInformed),
                  isInformedControl: new FormControl(team.roleIsInformed || false),
                  isMember: !team.roleIsSupervisor && !team.roleIsInformed
                } as GroupParticipantForm;
              }
              
              return {
                id: employee.id,
                fullName: employee.fullName,
                photo: employee.photo,
                serialNumber: employee.serialNumber,
                isAdmin: team.roleIsSupervisor || false,
                isApprover: team.roleIsApprover || false,
                isEvaluator: team.roleIsEvaluator || false,
                isInformed: team.roleIsInformed || false,
                comment: team.roleComments || '',
                commentControl: new FormControl(team.roleComments || ''),
                isAdminControl: new FormControl(team.roleIsSupervisor || false),
                isMemberControl: new FormControl(!team.roleIsSupervisor && !team.roleIsInformed),
                isInformedControl: new FormControl(team.roleIsInformed || false),
                isMember: !team.roleIsSupervisor && !team.roleIsInformed
              } as GroupParticipantForm;
            })
            .filter((p): p is GroupParticipantForm => p !== null);
          
          console.log('Participants chargés:', this.participants);
        } else {
          console.log('Aucune équipe trouvée pour cet incident');
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des équipes:', error);
      }
    });
  }

  async addParticipant() {
    const buttons = this.availableEmployees
      .filter(emp => !this.participants.some(p => p.id === emp.id))
      .map(emp => ({
        text: emp.fullName,
        handler: () => {
          this.participants.push({
            ...emp,
            isAdmin: false,
            isApprover: false,
            isEvaluator: false,
            isInformed: false,
            comment: '',
            commentControl: new FormControl(''),
            isAdminControl: new FormControl(false),
            isMemberControl: new FormControl(false),
            isInformedControl: new FormControl(false),
            isMember: false
          } as GroupParticipantForm);
        }
      }));

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

  updateParticipantRoles(participant: GroupParticipantForm, role: string, value: boolean) {
    const index = this.participants.findIndex(p => p.id === participant.id);
    
    if (index !== -1) {
      // Réinitialiser tous les rôles avant d'appliquer le nouveau
      this.participants[index].isAdmin = false;
      this.participants[index].isAdminControl.setValue(false);
      this.participants[index].isMember = false;
      this.participants[index].isMemberControl.setValue(false);
      this.participants[index].isInformed = false;
      this.participants[index].isInformedControl.setValue(false);

      // Appliquer le nouveau rôle
      switch(role) {
        case 'supervisor':
          this.participants[index].isAdmin = value;
          this.participants[index].isAdminControl.setValue(value);
          break;
        case 'member':
          this.participants[index].isMember = value;
          this.participants[index].isMemberControl.setValue(value);
          break;
        case 'informed':
          this.participants[index].isInformed = value;
          this.participants[index].isInformedControl.setValue(value);
          break;
      }

      // Mettre à jour l'incident avec la nouvelle liste d'équipes
      const incidentTeams: IncidentTeamDto[] = this.participants.map(p => {
        const teamDto = {
          employeeId: p.id,
          roleIsSupervisor: p.isAdmin,
          roleIsMember: p.isMember,
          roleIsInformed: p.isInformed || false,
          roleComments: p.commentControl.value || ''
        };
        return teamDto;
      });

      const formData = {
        ...this.currentIncident,
        incidentTeams: incidentTeams
      };

      this.apiService.updateIncident(this.incidentId!, formData).subscribe({
        next: (response) => {
          console.log('Réponse de l\'API après mise à jour:', response);
          // Recharger les équipes après la mise à jour
          this.loadIncidentTeams();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour des rôles:', error);
        }
      });
    }
  }

  async removeParticipant(participant: GroupParticipantForm) {
    console.log('removeParticipant appelé avec:', participant);
    const currentUserId = localStorage.getItem('CurrentEmployeeId');
    if (participant.id === currentUserId) {
      return;
    }
    
    console.log('Participants avant suppression:', this.participants);
    this.participants = this.participants.filter(p => p.id !== participant.id);
    console.log('Participants après suppression:', this.participants);
    
    // Mettre à jour l'incident avec la nouvelle liste d'équipes
    const incidentTeams: IncidentTeamDto[] = this.participants.map(p => ({
      employeeId: p.id,
      roleIsSupervisor: p.isAdminControl.value,
      roleIsMember: !p.isAdminControl.value && !p.isInformedControl.value,
      roleIsInformed: p.isInformedControl.value,
      roleComments: p.commentControl.value || ''
    }));

    console.log('Nouvelle liste d\'équipes après suppression:', incidentTeams);

    const formData = {
      ...this.currentIncident,
      incidentTeams: incidentTeams
    };

    console.log('Données complètes à envoyer après suppression:', formData);

    this.apiService.updateIncident(this.incidentId!, formData).subscribe({
      next: (response) => {
        console.log('Réponse de l\'API après suppression:', response);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du participant:', error);
      }
    });
  }

  private cleanHtmlContent(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
  private formatDateForInput(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Correct and safe for <input type="date">
  }
  
  
  async onSubmit() {
    if (this.incidentForm.valid && this.incidentId) {
      this.isSubmitting = true;

      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      const incidentTeams: IncidentTeamDto[] = this.participants.map(participant => ({
        employeeId: participant.id,
        roleIsSupervisor: participant.isAdminControl.value,
        roleIsMember: !participant.isAdminControl.value && !participant.isInformedControl.value,
        roleIsInformed: participant.isInformedControl.value,
        roleComments: participant.commentControl.value || ''
      }));

      const formData = {
        ...this.currentIncident,
        designation: this.incidentForm.value.designation.trim(),
        incidentDate: formatDate(this.incidentForm.value.date),
        declarationDate: formatDate(this.incidentForm.value.dateDeclaration),
        description: this.cleanHtmlContent(this.incidentForm.value.description),
        duration: this.incidentForm.value.duration || 0,
        cause: this.cleanHtmlContent(this.incidentForm.value.causes),
        consequence: this.cleanHtmlContent(this.incidentForm.value.consequences),
        state: this.incidentForm.value.state,
        incidentTeams
      };

      this.apiService.updateIncident(this.incidentId, formData).subscribe({
        next: () => {
          this.incidentState.triggerRefresh();
          this.navCtrl.navigateBack('/incident-list');
        },
        error: (error) => {
          this.error = 'Erreur lors de la mise à jour de l\'incident';
          console.error('Error updating incident:', error);
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    }
  }
}