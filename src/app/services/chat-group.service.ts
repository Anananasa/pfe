import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ChatGroupDto {
  id?: string;
  designation?: string;
  type?: number;
  fullName?: string;
  serviceDesignation?: string;
  photo?: string;
  isOnline?: boolean;
  urlImg?: string;
  displayDesignation?: string;
  source?: number;
  sourceId?: string;
  sourceReference?: string;
  participants?: ChatParticipantDto[];
  messages?: ChatMessageDto[];
  siteId?: string;
  companyId?: string;
  isShared?: boolean;
  sharedWith?: string;
  isBookmark?: boolean;
  sharedWithNames?: string;
  createdDate?: Date;
  createdBy?: string;
  updatedDate?: Date;
  updatedBy?: string;
  crudFrom?: number;
  currentUserId?: string;
  currentEmployeeId?: string;
  isSystem?: boolean;
  crud?: number;
}

export interface ChatParticipantDto {
  id?: string;
  userId?: string;
  groupId?: string;
  fullName?: string;
  photo?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  createdDate?: Date;
  createdBy?: string;
  updatedDate?: Date;
  updatedBy?: string;
  crudFrom?: number;
  currentUserId?: string;
  currentEmployeeId?: string;
  isSystem?: boolean;
  crud?: number;
}

export interface ChatMessageDto {
  id?: string;
  groupId?: string;
  userId?: string;
  fullName?: string;
  photo?: string;
  urlImg?: string;
  msg?: string;
  attachedFiles?: string;
  files?: ChatFileDto[];
  sentDate?: Date;
  seenBy?: string;
  connectionId?: string;
  deleteBy?: string;
  type?: number;
  isDeleted?: boolean;
  deletionDate?: Date;
  seenByList?: ChatMessageSeenDto[];
  siteId?: string;
  companyId?: string;
  isShared?: boolean;
  sharedWith?: string;
  isBookmark?: boolean;
  sharedWithNames?: string;
  createdDate?: Date;
  createdBy?: string;
  updatedDate?: Date;
  updatedBy?: string;
  crudFrom?: number;
  currentUserId?: string;
  currentEmployeeId?: string;
  isSystem?: boolean;
  crud?: number;
}

export interface ChatFileDto {
  id?: string;
  messageId?: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  fileType?: string;
  createdDate?: Date;
  createdBy?: string;
  updatedDate?: Date;
  updatedBy?: string;
  crudFrom?: number;
  currentUserId?: string;
  currentEmployeeId?: string;
  isSystem?: boolean;
  crud?: number;
}

export interface ChatMessageSeenDto {
  id?: string;
  messageId?: string;
  userId?: string;
  fullName?: string;
  seenDate?: Date;
  createdDate?: Date;
  createdBy?: string;
  updatedDate?: Date;
  updatedBy?: string;
  crudFrom?: number;
  currentUserId?: string;
  currentEmployeeId?: string;
  isSystem?: boolean;
  crud?: number;
}

export interface UserGroupRightDto {
  id?: string;
  userGroupId?: string;
  rightId?: string;
  rightName?: string;
  rightControllerName?: string;
  rightActionName?: string;
  rightCategory?: string;
  rightPrivilege?: number;
  rightIsSubMenu?: boolean;
  rightIsRight?: boolean;
  rightSubMenuLabel?: string;
  rightSubMenuCategory?: string;
  rightSubMenuOrder?: number;
  rightSubMenuCssClass?: string;
  appModuleId?: string;
  appModuleName?: string;
  appModuleOrder?: number;
  appModuleCssClass?: string;
  allowCreate?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  allowPrint?: boolean;
  allowSeeAll?: boolean;
  createdDate?: Date;
  createdBy?: string;
  updatedDate?: Date;
  updatedBy?: string;
  crudFrom?: number;
  currentUserId?: string;
  currentEmployeeId?: string;
  isSystem?: boolean;
  crud?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatGroupService {
  private apiUrl = 'https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi/api/ChatGroup';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    // Vérifier différents formats possibles de token
    const token = localStorage.getItem('token') || 
                 localStorage.getItem('access_token') || 
                 localStorage.getItem('jwt_token') ||
                 localStorage.getItem('auth_token');

    console.log('Token trouvé:', token ? 'Oui' : 'Non');
    
    if (!token) {
      console.error('Aucun token trouvé dans le localStorage');
      // Vous pouvez rediriger vers la page de login ici si nécessaire
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Une erreur est survenue:', error);
    return throwError(() => new Error(error.error?.message || 'Une erreur est survenue'));
  }

  // Compter les groupes par source
  countGroupsBySource(sourceId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/countGroupBySource?sourceId=${sourceId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Filtrer les groupes
  filterGroups(sourceId: string): Observable<ChatGroupDto[]> {
    // Essayer un format de filtre différent
    const filter = JSON.stringify({ sourceId: sourceId });
    return this.http.get<ChatGroupDto[]>(`${this.apiUrl}/filter?filter=${encodeURIComponent(filter)}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Obtenir un groupe par ID
  getGroupById(id: string): Observable<ChatGroupDto> {
    return this.http.get<ChatGroupDto>(`${this.apiUrl}/${id}/groupById`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Ajouter un participant au groupe
  addParticipant(selectedId: string, groupId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/GroupParticipant?selectedId=${selectedId}&groupId=${groupId}`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }


  // Supprimer un groupe
  deleteGroup(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Obtenir les droits d'un groupe d'utilisateurs
  getUserGroupRights(controllerName: string, actionName: string): Observable<UserGroupRightDto[]> {
    return this.http.get<UserGroupRightDto[]>(`${this.apiUrl}?controllerName=${controllerName}&actionName=${actionName}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Obtenir des informations par clé et langue
  getByKeyAndLang(key: string, lang: number): Observable<any> {
    return this.http.get(`${this.apiUrl}?key=${key}&lang=${lang}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Obtenir les groupes existants pour un incident
  getExistingGroupsForIncident(sourceId: string): Observable<ChatGroupDto[]> {
    const currentEmployeeId = localStorage.getItem('CurrentEmployeeId');
    
    // Utiliser l'endpoint filter pour récupérer les groupes
    return this.http.get<ChatGroupDto[]>(`${this.apiUrl}/filter?filter=${encodeURIComponent(JSON.stringify({ 
      sourceId: sourceId
    }))}`, { 
      headers: this.getHeaders() 
    }).pipe(
      // Filtrer les groupes où l'utilisateur connecté est participant
      map(groups => groups.filter(group => 
        group.participants?.some(p => p.userId === currentEmployeeId)
      )),
      catchError(error => {
        console.error('Erreur lors de la récupération des groupes:', error);
        return throwError(() => error);
      })
    );
  }

  createGroup(sourceId: string, title: string, participants: any[]): Observable<ChatGroupDto> {
    const currentUserId = localStorage.getItem('CurrentUserId');
    const currentEmployeeId = localStorage.getItem('CurrentEmployeeId');
    const siteId = localStorage.getItem('siteId');
    const companyId = localStorage.getItem('companyId');

    // Utiliser un GUID par défaut si nécessaire
    const defaultGuid = '00000000-0000-0000-0000-000000000000';
    const validUserId = currentUserId || defaultGuid;
    
    // S'assurer que currentEmployeeId n'est jamais "undefined"
    const validEmployeeId = (currentEmployeeId && currentEmployeeId !== "undefined") ? currentEmployeeId : defaultGuid;

    // Générer un identifiant unique pour le groupe
    const groupId = crypto.randomUUID();

    // Créer un timestamp unique pour éviter les conflits
    const timestamp = new Date().getTime();
    const uniqueTitle = `${title} (${timestamp})`;

    // Créer les participants avec des IDs uniques
    const participantsWithIds = participants.map(p => {
      const participantId = crypto.randomUUID();
      return {
        id: participantId,
        userId: p.employeeId || defaultGuid,
        groupId: groupId,
        fullName: p.fullName || p.FullName || '',
        photo: p.photo || '',
        isOnline: false,
        lastSeen: new Date(),
        createdDate: new Date(),
        createdBy: validUserId,
        updatedDate: new Date(),
        updatedBy: validUserId,
        crudFrom: 1,
        currentUserId: validUserId,
        currentEmployeeId: p.employeeId || validEmployeeId,
        isSystem: false,
        crud: 1
      };
    });

    // Créer un objet de groupe avec tous les champs requis par l'API
    const group: ChatGroupDto = {
      id: groupId,
      designation: uniqueTitle,
      type: 1,
      source: 1,
      sourceId: sourceId,
      sourceReference: sourceId,
      participants: participantsWithIds,
      messages: [],
      siteId: siteId || undefined,
      companyId: companyId || undefined,
      isShared: false,
      sharedWith: '',
      isBookmark: false,
      sharedWithNames: '',
      createdDate: new Date(),
      createdBy: validUserId,
      updatedDate: new Date(),
      updatedBy: validUserId,
      crudFrom: 1,
      currentUserId: validUserId,
      currentEmployeeId: validEmployeeId,
      isSystem: false,
      crud: 1,
      // Champs supplémentaires requis par l'API
      fullName: uniqueTitle,
      serviceDesignation: uniqueTitle,
      photo: '',
      isOnline: false,
      urlImg: '',
      displayDesignation: uniqueTitle
    };

    // Log pour déboguer
    console.log('Données envoyées à l\'API:', JSON.stringify(group, null, 2));

    // Envoyer la requête à l'API
    return this.http.post<ChatGroupDto>(this.apiUrl, group, { 
      headers: this.getHeaders(),
      observe: 'response'
    }).pipe(
      map(response => response.body as ChatGroupDto),
      catchError(error => {
        if (error.error?.modelState) {
          console.error('Détails de validation:', error.error.modelState);
        }
        return throwError(() => error);
      })
    );
  }
} 