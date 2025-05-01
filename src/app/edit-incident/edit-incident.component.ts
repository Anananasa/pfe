import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl, FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService, Incident } from '../services/api.service';
import { IncidentStateService } from '../services/incident-state.service';
import { NavHeaderComponent } from '../nav-header/nav-header.component';
import { AuthService ,Employee} from '../services/auth.service';
import { QuillModule } from 'ngx-quill';
import { IncidentMediaComponent } from '../incident-media/incident-media.component'
import { IonContent, NavController, ActionSheetController, IonLabel, IonItem, IonItemDivider, IonRow, IonGrid, IonCol, IonButton, IonIcon, IonSpinner } from "@ionic/angular/standalone";

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
  imports: [IonSpinner, IonIcon, IonButton, IonCol, IonGrid, IonRow, IonItemDivider, IonItem, IonLabel, IonContent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    NavHeaderComponent,
    QuillModule, IncidentMediaComponent]
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
  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ]
  };

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
      observation: [''],
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
          observation:incident.observation,
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
    const availableEmployees = this.availableEmployees
    .filter(emp => !this.participants.some(p => p.id === emp.id));

    if (availableEmployees.length === 0) {
      // Show message if no employees are available to add
      const noEmployeesAction = await this.actionSheetController.create({
        header: 'Aucun participant disponible',
        buttons: [{
          text: 'OK',
          role: 'cancel'
        }]
      });

      return await noEmployeesAction.present();
    }

    const buttons = availableEmployees.map(emp => ({
      text: emp.fullName,
      handler: () => {
        // Create the new participant with proper form controls
        const newParticipant = {
          id: emp.id,
          fullName: emp.fullName,
          photo: emp.photo,
          serialNumber: emp.serialNumber,
          isAdmin: false,
          isInformed: false,
          comment: '',
          commentControl: new FormControl(''),
          isAdminControl: new FormControl(false),
          isMemberControl: new FormControl(true),
          isInformedControl: new FormControl(false),
          isMember: true
        } as GroupParticipantForm;

        this.participants.push(newParticipant);

        this.updateIncidentTeams();

        return true;
      }
    }));

    // add the cancel button
    buttons.push({
      text: 'Annuler',
      handler: () => {
        return true
      }
    });

    const actionSheet = await this.actionSheetController.create({
      header: 'Sélectionner un participant',
      buttons: buttons
    });

    await actionSheet.present();
  }

  private updateIncidentTeams() {
    // Create DTO from current participants
    const incidentTeams: IncidentTeamDto[] = this.participants.map(p => ({
      employeeId: p.id,
      roleIsSupervisor: p.isAdminControl.value,
      roleIsMember: p.isMemberControl.value,
      roleIsInformed: p.isInformedControl.value,
      roleComments: p.commentControl.value || ''
    }));

    // Update the incident
    const formData = {
      ...this.currentIncident,
      incidentTeams: incidentTeams
    };

    this.apiService.updateIncident(this.incidentId!, formData).subscribe({
      next: (response) => {
        console.log('Participant added successfully:', response);
        // Force UI update
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error updating incident teams:', error);
      }
    });
  }

  updateParticipantRoles(participant: GroupParticipantForm, role: string, value: boolean) {
    const index = this.participants.findIndex(p => p.id === participant.id);

    if (index !== -1) {
      // Reset all roles before applying the new one
      this.participants[index].isAdmin = false;
      this.participants[index].isAdminControl.setValue(false);
      this.participants[index].isMember = false;
      this.participants[index].isMemberControl.setValue(false);
      this.participants[index].isInformed = false;
      this.participants[index].isInformedControl.setValue(false);

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

      this.updateIncidentTeams();
    }
  }

  async removeParticipant(participant: GroupParticipantForm) {
    console.log('removeParticipant called with:', participant);
    const currentUserId = localStorage.getItem('CurrentEmployeeId');

    // No allow removing the current user
    if (participant.id === currentUserId) {
      return;
    }

    // Remove the participant from the array
    this.participants = this.participants.filter(p => p.id !== participant.id);
    console.log('Participants after removal:', this.participants);

    // Update the incident with the new team list
    this.updateIncidentTeams();
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
        observation: this.incidentForm.value.observation,
        cause: this.cleanHtmlContent(this.incidentForm.value.causes),
        consequence: this.cleanHtmlContent(this.incidentForm.value.consequences),
        state: this.incidentForm.value.state,
        crud: 2, // CHANGES DEPENDING ON THE METHOD 1: CREATES, 2: UPDATES, 3: DELETES
        incidentTeams: incidentTeams
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
