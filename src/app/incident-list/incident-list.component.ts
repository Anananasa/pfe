import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { NavHeaderComponent } from '../nav-header/nav-header.component';
import { FormsModule } from '@angular/forms';
import { IncidentStateService } from '../services/incident-state.service';
import { Subscription } from 'rxjs';
import { ChatGroupService } from '../services/chat-group.service';
import { GroupService } from '../services/group.service';
import { HttpClient } from '@angular/common/http';
import { IonInput, IonSearchbar, AlertController, ActionSheetController, ToastController, IonIcon, IonContent, IonRefresher, IonRefresherContent, IonSpinner, IonButton, IonFab, IonFabButton, IonItem, IonLabel, IonList } from "@ionic/angular/standalone";
import { Observable } from 'rxjs';
@Component({
  selector: 'app-incident-list',
  templateUrl: './incident-list.component.html',
  styleUrls: ['./incident-list.component.scss'],
  standalone: true,
  imports: [ IonInput, IonSearchbar, IonList, IonLabel, IonItem, IonFabButton, IonFab, IonButton, IonSpinner, IonRefresherContent, IonRefresher, IonContent, IonIcon, CommonModule, NavHeaderComponent, FormsModule]
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
    date: null as string | null,
    declarationDate: null as string | null,
    status: '',
    year: null as number | null
  };
  private apiUrl = 'https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi/api/ChatGroup';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private incidentState: IncidentStateService,
    private chatGroupService: ChatGroupService,
    private GroupService: GroupService,
    private http: HttpClient
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

  addMargin() {
    const filterPanel = document.querySelector('.floating-filter') as HTMLElement;
    if (filterPanel) {
      filterPanel.style.marginBottom = '350px';
    }
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }
  toggleFilter() {
    this.showFilter = !this.showFilter;
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
      const yearMatch = !this.filter.year || (
        incident.incidentDate &&
        new Date(incident.incidentDate).getFullYear() === +this.filter.year
      );
      return dateMatch && declMatch && statusMatch && yearMatch;
    });
  }
  resetandtoggle() {
    
    this.toggleFilter();
    this.resetFilter();
  }

  resetFilter() {
    this.filter = {
      date: null,
      declarationDate: null,
      status: '',
      year: null
    };
    this.filteredIncidents = [...this.incidents]; // or call this.loadIncidents() if needed
  }
async editIncident(incident: any) {
    const stateStr = incident.stateStr;

  
    if (stateStr === 'Validé' || stateStr === 'Rejeté(es)') {
      const alert = await this.alertController.create({
        header: 'Modification refusée',
        message: `L'incident a été ${stateStr} et ne peut pas être modifié.`,
        buttons: ['OK']
      });
      await alert.present();
      return;
    }
    
    
    // Proceed to edit if allowed
    console.log('Editing incident:', incident);
    console.log('Incident ID:', incident.id);
    this.router.navigate(['/edit-incident', incident.id]);
  }

  async confirmDelete(incident: any) {
    const stateStr = incident.stateStr;

  
    if (stateStr === 'En cours' || stateStr === 'Programmé(e)') {
      const alert = await this.alertController.create({
        header: 'suppression refusée',
        message: `L'incident est ${stateStr} et ne peut pas être supprimer.`,
        buttons: ['OK']
      });
      await alert.present();
      return;
    }
    else {const alert = await this.alertController.create({
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
  }


  async deleteIncident(incident: any) {
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
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000
    });
    await toast.present();
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
      header: 'Messages',
      buttons: [
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

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    };
  }

  async viewExistingChats(incident: any) {
    try {
      const response = await this.http.get(`${this.apiUrl}/filter?filter=${encodeURIComponent(JSON.stringify({ 
        sourceId: incident.id
      }))}`, { 
        headers: this.getHeaders() 
      }).toPromise();

      const groups = response as any[];
      if (groups && groups.length > 0) {
        console.log('groups', groups);
        const buttons: any[] = groups.map(group => ({
          text: group.designation || 'Groupe sans nom',
          handler: () => {
            this.router.navigate(['/chat', group.id],
              {
                queryParams: {
                  groupName: group.designation,
                  participantsNames: JSON.stringify(group.participants.map((p: any) => ({
                    fullName: p.fullName,
                    userId: p.userId
                  })))
                }
              }
            );
          }
        }));

        buttons.push({
          text: 'Annuler',
          role: 'cancel'
        });

        const actionSheet = await this.actionSheetController.create({
          header: 'Groupes existants',
          buttons: buttons
        });
        await actionSheet.present();
      } else {
        this.showToast('Aucun groupe existant pour cet incident', 'warning');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des groupes:', error);
      this.showToast('Erreur lors de la récupération des groupes', 'danger');
    }
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
  
    const thinkingMessage = { role: 'assistant', content: "L'IA réfléchit..." };
    this.chatMessages.push(thinkingMessage);
  
    // Convert incidents list to a readable format
    const incidentContext = this.incidents.map((inc, i) => {
      return `Incident ${i + 1}:
  - Code: ${inc.code}
  - Designation: ${inc.designation}
  - Employé: ${inc.employeeFullName}
  - cause: ${inc.cause}
  - consequence: ${inc.consequence}
  - constat: ${inc.observation}
  - Date d'incident: ${inc.incidentDate}
  - Date de déclaration: ${inc.declarationDate}
  - Statut: ${inc.stateStr}\n`;
    }).join('\n');
  
    const body = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            `Tu es un assistant virtuel qui aide à comprendre et gérer les incidents des certains situations appartient a  lentreprise TIM  TIM est une entreprise tunisienne qui offre divers services professionnels Ceux-ci comprennent Services a Divers services probablement dans le domaine du management ou de la gestion etConseil  Aide aux entreprises pour améliorer leurs processus ou résoudre des problèmes spécifiques Accompagnement qui Soutien à la mise en œuvre de projets ou de nouvelles stratégies Audit  Évaluation de systèmes ou de processus pour vérifier leur efficacité ou conformité Formation Séminaires ou cours pour améliorer les compétences des employés ou des entreprises Lentreprise semble se spécialiser dans les solutions informatiques dédiées à différents domaines comme la Qualité la Santé la Sécurité et l'Environnement (QHSE) la production la maintenance etc
            . Voici la liste actuelle des incidents:\n\n${incidentContext}\n\nTu peux répondre à des questions comme "Quels incidents sont validés ?", "Combien d'incidents ont été déclarés par [Nom] ?", ou "Donne-moi les détails de l'incident [code]".`
        },
        ...this.chatMessages.filter(m => m.role !== 'assistant' || m.content !== "L'IA réfléchit...")
      ],
      temperature: 0.7
    };
  
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer my_key'
      },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        const reply = data.choices[0].message;
  
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
  //***************************************************************** */

showRisquePopup(incident: any) {
  if (incident.risques) {
    // If already displayed, just toggle it off
    incident.risques = null;
    return;
  }
  incident.risques = "L'IA réfléchit...";

  const prompt = `Voici les détails d'un incident :
- Désignation : ${incident.designation}
- Description : ${incident.description}
- Cause : ${incident.cause}

Quels sont les risques potentiels liés à cet incident ? Donne une réponse claire et structurée.`;

  const body = {
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Tu es un assistant expert en gestion des risques industriels. Tu dois identifier les risques potentiels à partir des informations fournies sur un incident.reflichit vitement et donner les information dune maniere joli(ne depasser pas 5 ligne et retour ala ligne apres le point et presenter les donnees dune joli maniere )`
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7
  };

  fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer my_key' // 🔑 Remplace avec ta clé
    },
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .then(data => {
      const reply = data.choices[0].message.content;
      incident.risques = reply;
    })
    .catch(err => {
      console.error('Erreur API ChatGPT:', err);
      incident.risques = "Désolé, je n'ai pas pu analyser les risques.";
    });
}

}
