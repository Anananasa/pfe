import { Routes } from '@angular/router';
import { GroupCreationComponent } from './group-creation/group-creation.component';
import { ChatViewComponent } from './chat-view/chat-view.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { GroupSettingsComponent } from './group-settings/group-settings.component';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.loginPage)
  },
  {
    path: 'incident-list',
    loadComponent: () => import('./incident-list/incident-list.component').then(m => m.IncidentListComponent),
  },
  {
    path: 'add-incident',
    loadComponent: () => import('./add-incident/add-incident.component').then(m => m.AddIncidentComponent),
  },
  {
    path: 'group-creation',
    component: GroupCreationComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'chat/:groupId',
    component: ChatViewComponent
  },
  {
    path: 'group-settings/:groupId',
    component: GroupSettingsComponent
  },
  {
    path: 'edit-incident/:id',
    loadComponent: () => import('./edit-incident/edit-incident.component').then(m => m.EditIncidentComponent),
  },
  {
    path: 'group-settings/:groupId',
    component: GroupSettingsComponent
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];


