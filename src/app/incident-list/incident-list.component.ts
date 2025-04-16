import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController, ActionSheetController } from '@ionic/angular';
import { ApiService } from '../services/api.service'; 
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { NavHeaderComponent } from '../nav-header/nav-header.component';
import { FormsModule } from '@angular/forms';
import { IncidentStateService } from '../services/incident-state.service';
import { Subscription } from 'rxjs';
import { ChatGroupService } from '../services/chat-group.service';

@Component({
  selector: 'app-incident-list',
  templateUrl: './incident-list.component.html',
  styleUrls: ['./incident-list.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, NavHeaderComponent, FormsModule]
})
export class IncidentListComponent implements OnInit, OnDestroy {
  incidents: any[] = [];
  filteredIncidents: any[] = [];
  searchTerm: string = '';
  error: string | null = null;
  isLoading = true;
  showFilter = false;
  private refreshSubscription: Subscription;

  filter = {
    date: null,
    declarationDate: null,
    status: ''
  };
  constructor(
    private authService: AuthService, 
    private apiService: ApiService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private incidentState: IncidentStateService,
    private chatGroupService: ChatGroupService
  ) {
    this.refreshSubscription = this.incidentState.refreshList$.subscribe(() => {
      this.loadIncidents();
    });
  }
  selectedIncidentId: number | null = null;
  toggleDetails(incident: any) {
    if (this.selectedIncidentId === incident.id) {
      this.selectedIncidentId = null; // collapse if already selected
    } else {
      this.selectedIncidentId = incident.id; // show new one
    }
  }
  ngOnInit() {
    this.loadIncidents();
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Validé':
        return 'status-valide';
      case 'En cours':
        return 'status-en-cours';
      case 'Rejeté(es)':
        return 'status-rejete';
      default:
        return 'status-default';
    }
  } 

  loadIncidents() {
    console.log('Loading incidents...');
    this.isLoading = true;
    this.error = null;

    this.authService.getIncidents().subscribe({
      next: (data: any) => {
        console.log('Received incidents:', data);
        this.incidents = data || [];
        this.filteredIncidents = [...this.incidents];
      },
      error: (error) => {
        console.error('Error loading incidents:', error);
        this.error = error;
        this.isLoading = false;
      },
      complete: () => {
        console.log('Loading completed');
        this.isLoading = false;
      }
    });
  }

  filterIncidents() {
    if (!this.searchTerm.trim()) {
      this.filteredIncidents = [...this.incidents];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredIncidents = this.incidents.filter(incident => 
      incident.code?.toLowerCase().includes(searchLower) ||
      incident.designation?.toLowerCase().includes(searchLower) ||
      incident.employeeFullName?.toLowerCase().includes(searchLower)
    );
  }
  applyFilter() {
    this.filteredIncidents = this.incidents.filter((incident) => {
      const dateMatch = !this.filter.date || incident.incidentDate?.startsWith(this.filter.date);
      const declMatch = !this.filter.declarationDate || incident.declarationDate?.startsWith(this.filter.declarationDate);
      const statusMatch = !this.filter.status || incident.stateStr === this.filter.status;
  
      return dateMatch && declMatch && statusMatch;
    });
  }
  
  resetFilter() {
    this.filter = {
      date: null,
      declarationDate: null,
      status: ''
    };
    this.filteredIncidents = [...this.incidents]; // or call this.loadIncidents() if needed
  }
  editIncident(incident: any) {
    console.log('Editing incident:', incident);
    console.log('Incident ID:', incident.id);
    this.router.navigate(['/edit-incident', incident.id]);
  }

  async confirmDelete(incident: any) {
    const alert = await this.alertController.create({
      header: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer l'incident "${incident.designation}" ?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: () => {
            this.deleteIncident(incident);
          }
        }
      ]
    });

    await alert.present();
  }
  toggleFilter() {
    this.showFilter = !this.showFilter;
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000
    });
    await toast.present();
  }

  async deleteIncident(incident: any) {
    const alert = await this.alertController.create({
      header: 'Confirmer la suppression',
      message: 'Êtes-vous sûr de vouloir supprimer cet incident ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Supprimer',
          handler: () => {
            const incidentData = {
              ...incident,
              crudFrom: 3
            };
            this.apiService.deleteIncident(incident.id).subscribe({
              next: () => {
                this.incidentState.triggerRefresh();
                this.presentToast('Incident supprimé avec succès');
              },
              error: (error) => {
                console.error('Erreur lors de la suppression:', error);
                this.presentToast('Erreur lors de la suppression de l\'incident');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  async showMessageOptions(incident: any) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Options de messages',
      buttons: [
        {
          text: 'Accéder au chat',
          icon: 'chatbubbles-outline',
          handler: () => {
            this.openChat(incident);
          }
        },
        {
          text: 'Voir les groupes existants',
          icon: 'people-outline',
          handler: () => {
            this.viewExistingChats(incident);
          }
        },
        {
          text: 'Nouveau groupe',
          icon: 'add-circle-outline',
          handler: () => {
            this.createNewGroup(incident);
          }
        },
        {
          text: 'Annuler',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async openChat(incident: any) {
    // Vérifier si un groupe existe déjà pour cet incident
    this.chatGroupService.countGroupsBySource(incident.id).subscribe({
      next: (count) => {
        if (count > 0) {
          // Récupérer le groupe existant
          this.chatGroupService.filterGroups(incident.id).subscribe({
            next: (groups) => {
              if (groups && groups.length > 0) {
                // Rediriger vers le chat avec l'ID du groupe
                this.router.navigate(['/chat'], { 
                  queryParams: { 
                    incidentId: incident.id,
                    groupId: groups[0].id
                  }
                });
              } else {
                this.showToast('Aucun groupe trouvé pour cet incident', 'warning');
              }
            },
            error: (error) => {
              console.error('Erreur lors de la récupération du groupe:', error);
              this.showToast('Erreur lors de la récupération du groupe', 'danger');
            }
          });
        } else {
          this.showToast('Aucun groupe trouvé pour cet incident', 'warning');
        }
      },
      error: (error) => {
        console.error('Erreur lors de la vérification des groupes:', error);
        this.showToast('Erreur lors de la vérification des groupes', 'danger');
      }
    });
  }

  async createNewGroup(incident: any) {
    this.router.navigate(['/group-creation'], { 
      queryParams: { 
        incidentId: incident.id,
        incidentName: incident.designation
      }
    });
  }

  async viewExistingChats(incident: any) {
    // Récupérer les groupes existants pour cet incident
    this.chatGroupService.getExistingGroupsForIncident(incident.id).subscribe({
      next: (groups) => {
        if (groups.length > 0) {
          // Créer une liste des groupes pour l'action sheet
          const buttons: any[] = groups.map(group => ({
            text: group.designation || 'Groupe sans nom',
            handler: () => {
              // Naviguer vers le chat avec l'ID du groupe
              this.router.navigate(['/chat'], { 
                queryParams: { 
                  incidentId: incident.id,
                  groupId: group.id
                }
              });
            }
          }));

          // Ajouter un bouton Annuler
          buttons.push({
            text: 'Annuler',
            role: 'cancel'
          });

          // Afficher l'action sheet avec la liste des groupes
          this.actionSheetController.create({
            header: 'Groupes existants',
            buttons: buttons
          }).then(actionSheet => {
            actionSheet.present();
          });
        } else {
          // Afficher un message si aucun groupe n'existe
          this.showToast('Aucun groupe existant pour cet incident', 'warning');
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des groupes:', error);
        this.showToast('Erreur lors de la récupération des groupes', 'danger');
      }
    });
  }
  navigateToAddIncident() {
    this.router.navigate(['/add-incident']);
  }
showChatbot = false;
chatInput: string = '';
chatMessages: { role: string, content: string }[] = [];
isThinking = false;
toggleChatbot() {
  this.showChatbot = !this.showChatbot;
}

sendChatMessage() {
  const input = this.chatInput.trim();
  if (!input) return;

  const userMessage = { role: 'user', content: input };
  this.chatMessages.push(userMessage);
  this.chatInput = '';

  // Step 1: Add temporary "thinking" message
  const thinkingMessage = { role: 'assistant', content: "L'IA réfléchit..." };
  this.chatMessages.push(thinkingMessage);

  const body = {
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'Tu es un assistant virtuel qui aide à comprendre et gérer les incidents des certains situations' },
      ...this.chatMessages.filter(m => m.role !== 'assistant' || m.content !== "L'IA réfléchit...") // remove fake message from context
    ],
    temperature: 0.7
  };

  fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer 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' // Make sure the token is valid
    },
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .then(data => {
      const reply = data.choices[0].message;

      // Step 2: Replace "thinking" message with real response
      const index = this.chatMessages.indexOf(thinkingMessage);
      if (index !== -1) {
        this.chatMessages[index] = reply;
      } else {
        this.chatMessages.push(reply);
      }
    })
    .catch(err => {
      console.error('Erreur API ChatGPT:', err);
      const index = this.chatMessages.indexOf(thinkingMessage);
      if (index !== -1) {
        this.chatMessages[index] = { role: 'assistant', content: "Désolé, je n'ai pas pu répondre. Réessayez plus tard." };
      }
    });
}

showMessageOptionss(incident: any) {
  console.log('Chat button clicked for incident:', incident);
  // Later: Open chatbot popover/modal here
}
} 