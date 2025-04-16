import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ActionSheetController } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { NavHeaderComponent } from '../nav-header/nav-header.component';
import { AuthService, Employee } from '../services/auth.service';
import { QuillModule } from 'ngx-quill';

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
  commentControl: FormControl;
  isMember: boolean;
  isAdminControl: FormControl;
  isMemberControl: FormControl;
  isInformedControl: FormControl;
}

@Component({
  standalone: true,
  selector: 'app-add-incident',
  templateUrl: './add-incident.component.html',
  styleUrls: ['./add-incident.component.scss'],
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule, NavHeaderComponent, QuillModule]
})
export class AddIncidentComponent implements OnInit {
  incidentForm: FormGroup;
  isSubmitting = false;
  selectedFiles: File[] = [];
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
    private router: Router,
    private authService: AuthService,
    private actionSheetController: ActionSheetController
  ) {
    this.incidentForm = this.fb.group({
      designation: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      dateDeclaration: [new Date().toISOString().split('T')[0], Validators.required],
      description: [''],
      duration: [0],
      causes: [''],
      consequences: [''],
      observation: [''],
      status: ['En cours'],
      files: [null]
    });
  }
  
  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.authService.getEmployees().subscribe({
      next: (employees) => {
        console.log('Structure détaillée du premier employé:', JSON.stringify(employees[0], null, 2));
        this.availableEmployees = employees;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des employés:', error);
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

  toggleRole(participant: GroupParticipantForm) {
    const currentUserId = localStorage.getItem('CurrentEmployeeId');
    if (participant.id === currentUserId) {
      return;
    }
    participant.isAdmin = !participant.isAdmin;
  }

  removeParticipant(participant: GroupParticipantForm) {
    const currentUserId = localStorage.getItem('CurrentEmployeeId');
    if (participant.id === currentUserId) {
      return;
    }
    this.participants = this.participants.filter(p => p.id !== participant.id);
  }

  async onSubmit() {
    if (this.incidentForm.valid) {
      this.isSubmitting = true;

      const incidentTeams: IncidentTeamDto[] = this.participants.map(participant => ({
        employeeId: participant.id,
        roleIsSupervisor: participant.isAdmin,
        roleIsMember: !participant.isAdmin,
        roleIsInformed: participant.isInformed || false,
        roleComments: participant.commentControl.value || ''
      }));

      console.log('Participants:', this.participants);
      console.log('Équipes à envoyer:', incidentTeams);

      const incidentData = {
        designation: this.incidentForm.value.designation,
        description: this.incidentForm.value.description,
        duration: this.incidentForm.value.duration || 0,
        cause: this.incidentForm.value.causes,
        consequence: this.incidentForm.value.consequences,
        observation: this.incidentForm.value.observation,
        incidentDate: this.incidentForm.value.date,
        declarationDate: this.incidentForm.value.dateDeclaration,
        status: 'En cours',
        state: 0,
        stateStr: 'En cours',
        code: this.generateIncidentCode(),
        employeeFullName: this.currentUser?.fullName || '',
        incidentTeams: incidentTeams,
        isSystem: false,
        crudFrom: 1,
        crud: 1, // CHANGES DEPENDING ON THE METHOD 1: CREATES, 2: UPDATES, 3: DELETES
        legacyId: '',
        typeLegacy: 0,
        isEnabled: true,
        isDeleted: false
      };

      console.log('Données d\'incident à envoyer:', JSON.stringify(incidentData, null, 2));

      this.apiService.createIncident(incidentData).subscribe({
        next: (response) => {
          console.log('Incident créé:', response);
          if (this.selectedFiles && this.selectedFiles.length > 0 && response.id) {
            this.uploadFiles(response.id);
          } else {
            this.router.navigate(['/incident-list']);
          }
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          if (error.error) {
            console.error('Message d\'erreur détaillé:', error.error);
          }
          this.isSubmitting = false;
        }
      });
    }
  }

  private uploadFiles(incidentId: number) {
    const uploadPromises = this.selectedFiles.map(file => 
      this.apiService.uploadFile(incidentId, file).toPromise()
    );

    Promise.all(uploadPromises)
      .then(() => {
        console.log('Tous les fichiers ont été uploadés');
        this.router.navigate(['/incident-list']);
      })
      .catch(error => {
        console.error('Erreur lors de l\'upload des fichiers:', error);
      })
      .finally(() => {
        this.isSubmitting = false;
      });
  }
  

  onFileChange(event: any) {
    const files = event.target.files;
    if (files.length > 0) {
      this.selectedFiles = Array.from(files);
      this.incidentForm.patchValue({
        files: this.selectedFiles
      });
    }
  }

  // Mettre à jour les rôles d'un participant
  updateParticipantRoles(participant: GroupParticipantForm, role: string, value: boolean) {
    const index = this.participants.findIndex(p => p.id === participant.id);
    if (index !== -1) {
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
  }}

  private generateIncidentCode(): string {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INC-${year}${month}${day}-${random}`;
  }
}