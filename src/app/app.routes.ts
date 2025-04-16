import { Routes } from '@angular/router';
import { GroupCreationComponent } from './group-creation/group-creation.component';
import { ChatViewComponent } from './chat-view/chat-view.component';

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
    path: 'chat/:groupId',
    component: ChatViewComponent
  },
  {
    path: 'edit-incident/:id',
    loadComponent: () => import('./edit-incident/edit-incident.component').then(m => m.EditIncidentComponent),
  },
  
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];


