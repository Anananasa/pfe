import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavHeaderComponent } from '../nav-header/nav-header.component';
import { ApiService, Incident as ApiIncident } from '../services/api.service';
import { Chart, registerables, TooltipItem } from 'chart.js';

import { 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardSubtitle,
  IonIcon, 
  IonCardContent, 
  IonItem, 
  IonLabel, 
  IonList, 
  IonBadge, 
  IonProgressBar, 
  IonSearchbar, 
  ModalController,
  IonButton,
  IonInput,
  IonSpinner,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons
} from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';

interface DashboardIncident {
  designation: string;
  date: Date;
  status: 'En cours' | 'Validé' | 'Rejeté(es)' | 'Programmé(e)';
  duration: number;
  team: string;
  cause?: string;
  consequence?: string;
  imageUrl?: string;
  code?: string;
  showImages: boolean;
}

interface TeamPerformance {
  name: string;
  incidentsResolved: number;
  averageResolutionTime: number;
  totalIncidents: number;
  successRate: number;
}

interface IncidentTrend {
  date: Date;
  count: number;
  status: DashboardIncident['status'];
}

interface StatusDistribution {
  status: DashboardIncident['status'];
  count: number;
  percentage: number;
}

interface TeamDistribution {
  team: string;
  count: number;
  percentage: number;
}

interface EmployeeStats {
  name: string;
  count: number;
}

interface DayStats {
  name: string;
  count: number;
}

interface CauseStats {
  cause: string;
  count: number;
}

interface FilterOptions {
  date?: string;
  declarationDate?: string;
  year?: number;
  code?: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    IonProgressBar, 
    IonBadge, 
    IonList, 
    IonLabel, 
    IonItem, 
    IonCardContent, 
    IonIcon, 
    IonCardTitle, 
    IonCardSubtitle,
    IonCardHeader, 
    IonCard, 
    IonContent,
    IonSearchbar,
    IonButton,
    IonInput,
    IonSpinner,
    CommonModule,
    NavHeaderComponent,
    FormsModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons
  ]
})
export class DashboardComponent implements OnInit {
  @ViewChild('statusPieChart') statusPieChart!: ElementRef;
  @ViewChild('employeeChart') employeeChart!: ElementRef;
  @ViewChild('timeChart') timeChart!: ElementRef;
  @ViewChild('causesChart') causesChart!: ElementRef;
  @ViewChild('consequencesChart') consequencesChart!: ElementRef;

  private pieChart: Chart | null = null;
  private employeeBarChart: Chart | null = null;
  private timeLineChart: Chart | null = null;
  private causesBarChart: Chart | null = null;
  private consequencesBarChart: Chart | null = null;

  stats = [
    { title: 'Incidents Totaux', value: 0, icon: 'alert-circle-outline', color: 'primary' },
    { title: 'En cours', value: 0, icon: 'folder-open-outline', color: 'warning' },
    { title: 'Validé', value: 0, icon: 'checkmark-circle-outline', color: 'success' },
    { title: 'Programmé(e)', value: 0, icon: 'time-outline', color: 'tertiary' }
  ];

  recentIncidents: DashboardIncident[] = [];
  teamPerformance: TeamPerformance[] = [];
  incidentTrends: IncidentTrend[] = [];
  allIncidents: DashboardIncident[] = [];
  statusDistribution: StatusDistribution[] = [];
  teamDistribution: TeamDistribution[] = [];
  averageResolutionTime: number = 0;
  topPerformingTeams: TeamPerformance[] = [];
  monthlyTrends: { month: string; data: IncidentTrend[] }[] = [];
  topEmployees: EmployeeStats[] = [];
  dayDistribution: DayStats[] = [];
  topCauses: CauseStats[] = [];
  topConsequences: CauseStats[] = [];
  isIncidentRecentOpen: boolean = false;

  // Propriétés pour la galerie
  searchTerm: string = '';
  selectedDate: string = '';
  filteredIncidents: DashboardIncident[] = [];
  showFilter: boolean = false;
  isLoading: boolean = false;
  filter: FilterOptions = {};
  commentText: string = '';
  showImages = true; // Par défaut, les images sont visibles

  isImageModalOpen = false;
  selectedImagePath = '';

  constructor(
    public apiService: ApiService,
    private modalController: ModalController
  ) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.loadDashboardData();
    this.getincidentData(this.apiService.incident.id);
  }

  ionViewWillEnter() {
    this.loadDashboardData();
    this.getincidentData(this.apiService.incident.id);
  }

  getStatusColor(status: DashboardIncident['status']): string {
    switch (status) {
      case 'En cours':
        return 'warning';
      case 'Rejeté(es)':
        return 'danger';
      case 'Validé':
        return 'success';
      case 'Programmé(e)':
        return 'tertiary';
      default:
        return 'primary';
    }
  }

  private loadDashboardData() {
    this.apiService.getIncidents().subscribe({
      next: (incidents: ApiIncident[]) => {
        this.allIncidents = incidents.map((incident: ApiIncident) => ({
          designation: incident.designation,
          date: new Date(incident.incidentDate),
          status: this.getIncidentStatus(incident.state),
          duration: incident.duration || 0,
          team: incident.incidentTeams?.[0]?.employeeFullName || 'Non assigné',
          cause: incident.cause,
          consequence: incident.consequence,
          image: incident.incidentFiles,
          code: incident.code,
          showImages: true
        }));

        // Initialiser la galerie filtrée
        this.filteredIncidents = [...this.allIncidents];

        this.updateStats();
        this.updateRecentIncidents();
        this.updateTeamPerformance();
        this.updateIncidentTrends();
        this.updateStatusDistribution();
        this.updateTeamDistribution();
        this.updateAverageResolutionTime();
        this.updateTopPerformingTeams();
        this.updateMonthlyTrends();
        this.updateEmployeeStats();
        this.updateDayDistribution();
        this.updateCauseAndConsequenceStats();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des incidents:', error);
      }
    });
  }

  private getIncidentStatus(state: number): DashboardIncident['status'] {
    switch (state) {
      case 0: return 'Programmé(e)';
      case 1: return 'En cours';
      case 3: return 'Validé';
      case 2: return 'Rejeté(es)';
      default: return 'En cours';
    }

   /* case 0: return 'En cours';
      case 1: return 'Rejeté(es)';
      case 2: return 'Validé';
      case 3: return 'Programmé(e)';
      default: return 'En cours'; */
  }

  private updateStats() {
    this.stats[0].value = this.allIncidents.length;
    this.stats[1].value = this.allIncidents.filter(i => i.status === 'En cours').length;
    this.stats[2].value = this.allIncidents.filter(i => i.status === 'Validé').length;
    this.stats[3].value = this.allIncidents.filter(i => i.status === 'Programmé(e)').length;
  }

  private updateRecentIncidents() {
    this.recentIncidents = this.allIncidents
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }

  private updateTeamPerformance() {
    const teams = [...new Set(this.allIncidents.map(i => i.team))];
    this.teamPerformance = teams.map(team => {
      const teamIncidents = this.allIncidents.filter(i => i.team === team);
      const resolved = teamIncidents.filter(i => i.status === 'Validé').length;
      return {
        name: team,
        incidentsResolved: resolved,
        averageResolutionTime: this.calculateAverageResolutionTime(teamIncidents),
        totalIncidents: teamIncidents.length,
        successRate: (resolved / teamIncidents.length) * 100
      };
    });
  }

  private calculateAverageResolutionTime(incidents: DashboardIncident[]): number {
    const validIncidents = incidents.filter(i => i.status === 'Validé');
    if (validIncidents.length === 0) return 0;
    return validIncidents.reduce((sum, i) => sum + i.duration, 0) / validIncidents.length;
  }

  private updateIncidentTrends() {
    const incidentsByDate = this.allIncidents.reduce((acc, incident) => {
      const date = incident.date.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date: new Date(date), count: 0, status: incident.status };
      }
      acc[date].count++;
      return acc;
    }, {} as Record<string, IncidentTrend>);

    this.incidentTrends = Object.values(incidentsByDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private updateStatusDistribution() {
    const total = this.allIncidents.length;
    this.statusDistribution = Object.entries(
      this.allIncidents.reduce((acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      }, {} as Record<DashboardIncident['status'], number>)
    ).map(([status, count]) => ({
      status: status as DashboardIncident['status'],
      count,
      percentage: (count / total) * 100
    }));

    this.initPieChart();
  }

  private initPieChart() {
    setTimeout(() => {
      if (!this.statusPieChart?.nativeElement) {
        return;
      }

      if (this.pieChart) {
        this.pieChart.destroy();
      }

      const ctx = this.statusPieChart.nativeElement.getContext('2d');
      if (!ctx) {
        console.error('Could not get 2D context for pie chart');
        return;
      }

      this.pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: this.statusDistribution.map(item => item.status),
          datasets: [{
            data: this.statusDistribution.map(item => item.count),
            backgroundColor: this.statusDistribution.map(item => 
              getComputedStyle(document.documentElement)
                .getPropertyValue(`--ion-color-${this.getStatusColor(item.status)}`)
            ),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }, 0);
  }

  private updateTeamDistribution() {
    const total = this.allIncidents.length;
    this.teamDistribution = Object.entries(
      this.allIncidents.reduce((acc, i) => {
        acc[i.team] = (acc[i.team] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([team, count]) => ({
      team,
      count,
      percentage: (count / total) * 100
    }));
  }

  private updateAverageResolutionTime() {
    const validIncidents = this.allIncidents.filter(i => i.status === 'Validé');
    if (validIncidents.length === 0) {
      this.averageResolutionTime = 0;
      return;
    }
    this.averageResolutionTime = validIncidents.reduce((sum, i) => sum + i.duration, 0) / validIncidents.length;
  }

  private updateTopPerformingTeams() {
    this.topPerformingTeams = [...this.teamPerformance]
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 3);
  }

  private updateMonthlyTrends() {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentYear = new Date().getFullYear();
    
    this.monthlyTrends = months.map(month => {
      const monthIndex = months.indexOf(month);
      const startDate = new Date(currentYear, monthIndex, 1);
      const endDate = new Date(currentYear, monthIndex + 1, 0);
      
      const monthIncidents = this.allIncidents.filter(i => 
        i.date >= startDate && i.date <= endDate
      );

      const trends = Object.entries(
        monthIncidents.reduce((acc, i) => {
          acc[i.status] = (acc[i.status] || 0) + 1;
          return acc;
        }, {} as Record<DashboardIncident['status'], number>)
      ).map(([status, count]) => ({
        date: startDate,
        count,
        status: status as DashboardIncident['status']
      }));

      return {
        month,
        data: trends
      };
    });
  }

  getMaxCount(data: IncidentTrend[]): number {
    return Math.max(...data.map(trend => trend.count), 1);
  }

  getValidationRate(): number {
    const validatedCount = this.allIncidents.filter(i => i.status === 'Validé').length;
    return (validatedCount / this.allIncidents.length) * 100;
  }

  getMaxDayCount(): number {
    return Math.max(...this.dayDistribution.map(day => day.count), 1);
  }

  private updateEmployeeStats() {
    const employeeStats = this.allIncidents.reduce((acc, incident) => {
      const employee = incident.team;
      acc[employee] = (acc[employee] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.topEmployees = Object.entries(employeeStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    this.initEmployeeChart();
  }

  private updateDayDistribution() {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const dayStats = this.allIncidents.reduce((acc, incident) => {
      const dayIndex = new Date(incident.date).getDay();
      const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1];
      acc[dayName] = (acc[dayName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.dayDistribution = days.map(day => ({
      name: day,
      count: dayStats[day] || 0
    }));

    this.initTimeChart();
  }

  private cleanHtmlContent(html: string): string {
    if (!html) return 'Non spécifié';
    
    // Créer un élément temporaire pour décoder les entités HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Récupérer le texte et nettoyer
    let text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Nettoyer les espaces multiples et les caractères spéciaux
    text = text
      .replace(/\s+/g, ' ')  // Remplacer les espaces multiples par un seul espace
      .replace(/&nbsp;/g, ' ')  // Remplacer &nbsp; par un espace
      .replace(/&amp;/g, '&')  // Remplacer &amp; par &
      .replace(/&lt;/g, '<')   // Remplacer &lt; par <
      .replace(/&gt;/g, '>')   // Remplacer &gt; par >
      .replace(/&quot;/g, '"') // Remplacer &quot; par "
      .trim();
    
    return text || 'Non spécifié';
  }

  private updateCauseAndConsequenceStats() {
    const causeStats = this.allIncidents.reduce((acc, incident) => {
      const cause = this.cleanHtmlContent(incident.cause || '');
      acc[cause] = (acc[cause] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const consequenceStats = this.allIncidents.reduce((acc, incident) => {
      const consequence = this.cleanHtmlContent(incident.consequence || '');
      acc[consequence] = (acc[consequence] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.topCauses = Object.entries(causeStats)
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    this.topConsequences = Object.entries(consequenceStats)
      .map(([consequence, count]) => ({ cause: consequence, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    this.initCausesAndConsequencesCharts();
  }

  private initEmployeeChart() {
    setTimeout(() => {
      if (!this.employeeChart?.nativeElement) {
        return;
      }

      if (this.employeeBarChart) {
        this.employeeBarChart.destroy();
      }

      const ctx = this.employeeChart.nativeElement.getContext('2d');
      if (!ctx) {
        console.error('Could not get 2D context for employee chart');
        return;
      }

      this.employeeBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.topEmployees.map(emp => emp.name),
          datasets: [{
            label: 'Nombre d\'incidents',
            data: this.topEmployees.map(emp => emp.count),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }, 0);
  }

  private initTimeChart() {
    setTimeout(() => {
      if (!this.timeChart?.nativeElement) {
        return;
      }

      if (this.timeLineChart) {
        this.timeLineChart.destroy();
      }

      const ctx = this.timeChart.nativeElement.getContext('2d');
      if (!ctx) {
        console.error('Could not get 2D context for time chart');
        return;
      }

      this.timeLineChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.dayDistribution.map(day => day.name),
          datasets: [{
            label: 'Incidents par jour',
            data: this.dayDistribution.map(day => day.count),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }, 0);
  }

  private initCausesAndConsequencesCharts() {
    setTimeout(() => {
      if (!this.causesChart?.nativeElement || !this.consequencesChart?.nativeElement) {
        return;
      }

      if (this.causesBarChart) {
        this.causesBarChart.destroy();
      }
      if (this.consequencesBarChart) {
        this.consequencesBarChart.destroy();
      }

      const causesCtx = this.causesChart.nativeElement.getContext('2d');
      const consequencesCtx = this.consequencesChart.nativeElement.getContext('2d');

      if (!causesCtx || !consequencesCtx) {
        console.error('Could not get 2D context for causes/consequences charts');
        return;
      }

      // Configuration commune pour les deux graphiques
      const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(tooltipItem: TooltipItem<'bar'>) {
                return `${tooltipItem.raw} incidents`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      };

      this.causesBarChart = new Chart(causesCtx, {
        type: 'bar',
        data: {
          labels: this.topCauses.map(item => item.cause),
          datasets: [{
            label: 'Nombre d\'occurrences',
            data: this.topCauses.map(item => item.count),
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1,
            borderRadius: 5
          }]
        },
        options: {
          ...commonOptions,
          indexAxis: 'y',
          plugins: {
            ...commonOptions.plugins,
            title: {
              display: true,
              text: 'Top 5 Causes',
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          }
        }
      });

      this.consequencesBarChart = new Chart(consequencesCtx, {
        type: 'bar',
        data: {
          labels: this.topConsequences.map(item => item.cause),
          datasets: [{
            label: 'Nombre d\'occurrences',
            data: this.topConsequences.map(item => item.count),
            backgroundColor: 'rgba(153, 102, 255, 0.7)',
            borderColor: 'rgb(153, 102, 255)',
            borderWidth: 1,
            borderRadius: 5
          }]
        },
        options: {
          ...commonOptions,
          indexAxis: 'y',
          plugins: {
            ...commonOptions.plugins,
            title: {
              display: true,
              text: 'Top 5 Conséquences',
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          }
        }
      });
    }, 0);
  }

  ngAfterViewInit() {
    // Les graphiques seront initialisés uniquement lorsque leurs sections respectives seront ouvertes
  }

  getMaxCauseCount(): number {
    return Math.max(...this.topCauses.map(item => item.count), 1);
  }

  getMaxConsequenceCount(): number {
    return Math.max(...this.topConsequences.map(item => item.count), 1);
  }

  // Méthodes pour la galerie
  toggleFilter() {
    this.showFilter = !this.showFilter;
  }
  resetandtoggle() {
    
    this.toggleFilter();
    this.resetFilter();
  }
  resetFilter() {
    this.filter = {
      date: undefined,
      declarationDate: undefined,
      year: undefined
    };
    this.incidentsThatHaveFiles = this.incidents.filter(incident => incident.incidentFiles && incident.incidentFiles.length > 0);
    this.filteredIncidents = [...this.incidentsThatHaveFiles];
  }

  
  applyFilter() {
    // Si tous les filtres sont vides, on réinitialise à la liste des incidents avec fichiers
    if (!this.filter.date && !this.filter.declarationDate && !this.filter.year) {
      this.incidentsThatHaveFiles = this.incidents.filter(incident => incident.incidentFiles && incident.incidentFiles.length > 0);
      return;
    }

    this.filteredIncidents = this.incidentsThatHaveFiles.filter((incident) => {
      const dateMatch = !this.filter.date || incident.incidentDate?.startsWith(this.filter.date);
      const declMatch = !this.filter.declarationDate || incident.declarationDate?.startsWith(this.filter.declarationDate);
      const yearMatch = !this.filter.year || (
        incident.incidentDate &&
        new Date(incident.incidentDate).getFullYear() === +this.filter.year
      );
      return dateMatch && declMatch && yearMatch;
    });
    this.incidentsThatHaveFiles = this.filteredIncidents;
  }

  filterGallery() {
    this.filteredIncidents = this.incidentsThatHaveFiles.filter(incident => {
      // Filtre par texte de recherche
      const matchesSearch = !this.searchTerm || 
        incident.designation.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (incident.code && incident.code.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      // Filtre par date
      const matchesDate = !this.filter.date || 
        incident.incidentDate?.startsWith(this.filter.date);
      
      // Filtre par année
      const matchesYear = !this.filter.year || 
        (incident.incidentDate && new Date(incident.incidentDate).getFullYear() === +this.filter.year);

      return matchesSearch && matchesDate && matchesYear;
    });
    this.incidentsThatHaveFiles = this.filteredIncidents;
  }
  isTeamPerformanceOpen: boolean = false;

  openTeamPerformance() {
    this.isTeamPerformanceOpen = !this.isTeamPerformanceOpen;
    if (this.isTeamPerformanceOpen) {
      this.initEmployeeChart();
    }
  }

  isTeamDistributionOpen: boolean = false;    

  openTeamDistribution() {
    this.isTeamDistributionOpen = !this.isTeamDistributionOpen;
    if (this.isTeamDistributionOpen) {
      this.initPieChart();
    }
  }
  isAverageResolutionTimeOpen: boolean = false;

  openAverageResolutionTime() {
    this.isAverageResolutionTimeOpen = !this.isAverageResolutionTimeOpen;
  }
  isStatusStatisticsOpen: boolean = false;

  openStatusStatistics() {
    this.isStatusStatisticsOpen = !this.isStatusStatisticsOpen;
    if (this.isStatusStatisticsOpen) {
      this.initPieChart();
    }
  } 
  isCausesAndConsequencesOpen: boolean = false;

  openCausesAndConsequences() {
    this.isCausesAndConsequencesOpen = !this.isCausesAndConsequencesOpen;
    if (this.isCausesAndConsequencesOpen) {
      this.initCausesAndConsequencesCharts();
    }
  } 
  isTimeStatisticsOpen: boolean = false;

  openTimeStatistics() {
    this.isTimeStatisticsOpen = !this.isTimeStatisticsOpen;
    if (this.isTimeStatisticsOpen) {
      this.initTimeChart();
    }
  } 
  
  
  
  

  openIncidentRecent() {
    this.isIncidentRecentOpen = !this.isIncidentRecentOpen;
  }
  async openImageModal(incident: DashboardIncident) {
    const modal = await this.modalController.create({
      component: 'ImageModalComponent', // Vous devrez créer ce composant
      componentProps: {
        imageUrl: incident.imageUrl,
        incidentDetails: {
          code: incident.code,
          designation: incident.designation,
          date: incident.date,
          status: incident.status
        }
      }
    });
    return await modal.present();
  }
  getFullPath(filePath: string): string {
    return filePath?.split('|')[0]?.replace('~', 'https://timserver.northeurope.cloudapp.azure.com/QalitasDemo') || '';
  }
  
  getincidentData(incidentId: string) {
    this.apiService.getIncidentById(incidentId).subscribe((data) => {
      if (data) {
        this.apiService.incident = data;
      }
      console.log(this.apiService.incident);
      this.getIncidentsThatHaveFiles();
    });
  }

  getIncidentsThatHaveFiles() {
    for (let incident of (this.apiService.incident as any)) {
      if (incident.incidentFiles.length > 0) {
        incident.showImages = false; // Initialiser la propriété showImages
        this.incidentsThatHaveFiles.push(incident);
        this.incidents.push(incident);
      }
    }
    console.log("incidentsThatHaveFiles", this.incidentsThatHaveFiles);
  }
  

  incidentsThatHaveFiles: any[] = [];
  
  incidents: any[] = [];  

  toggleIncidentImages(incident: any) {
    incident.showImages = !incident.showImages;
  }

  handleImageError(event: any) {
    event.target.style.display = 'none';
  }

  openImageFullscreen(filePath: string) {
    this.selectedImagePath = this.getFullPath(filePath);
    this.isImageModalOpen = true;
  }

  closeImageModal() {
    this.isImageModalOpen = false;
    this.selectedImagePath = '';
  }
} 