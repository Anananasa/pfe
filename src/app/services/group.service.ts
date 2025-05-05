import { Injectable } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { initializeApp, FirebaseApp } from '@angular/fire/app';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChatMessage, ApiGroupResponse } from './chat-message.interface';
import { getFirestore, Firestore, collection, addDoc, doc, updateDoc, getDoc, getDocs, query, where, CollectionReference, setDoc } from '@angular/fire/firestore';

interface GroupParticipant {
  userId: string;
  isAdmin: boolean;
}

interface ApiId {
  id: string; // ou number selon ton besoin
}

@Injectable({
  providedIn: 'root'
})
export class GroupService { 
  private firestore: Firestore;
  private groupsRef: CollectionReference;
  private apiUrl = 'https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi/api/ChatGroup';
  private token = localStorage.getItem('token');

  private firebaseConfig = {
    apiKey: "AIzaSyBmT-WEoNYu14uVDVOW9f6_Ft_PNHV8SIo",
    authDomain: "qualitas-87dad.firebaseapp.com",
    projectId: "qualitas-87dad",
    storageBucket: "qualitas-87dad.firebasestorage.app",
    messagingSenderId: "595779919125",
    appId: "1:595779919125:web:5bada50788799fbfeb1d1c"
  };  

  private headers = new HttpHeaders({
    'Authorization': `Bearer ${this.token}`,
    'Accept': 'application/json'
  });

  constructor(private http: HttpClient) { // Inject HttpClient here
    const app: FirebaseApp = initializeApp(this.firebaseConfig);
    this.firestore = getFirestore(app);
    this.groupsRef = collection(this.firestore, 'groups');
  }

  private generateGUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  async createGroup(groupName: string, adminId: string, incidentId: string, userIds: GroupParticipant[]) {
    const apiNewGroup = {
      Designation: groupName,
      CreatedDate: new Date().toISOString(),
      SourceId: incidentId,
      UpdatedBy: adminId,
      CreatedBy: adminId,
      Type: 1,
      Source: 17,
      messages: [],
      CurrentUserId: adminId,
      CurrentEmployeeId: adminId,
      Participants: userIds
    };

    console.log('Creating API group:', apiNewGroup);

    try {
      const apiResponse = await this.http.post(this.apiUrl, apiNewGroup, { headers: this.headers }).toPromise();
      console.log('API Response:', apiResponse);
      
      // Générer un ID local si l'API n'en fournit pas
      const apiId = (apiResponse as any)?.id || this.generateGUID();
      const firebaseGroupId = this.generateGUID();
      
      const newGroup = {
        name: groupName,
        incidentId: incidentId,
        adminId: adminId,
        members: [adminId],
        createdAt: new Date(),
        apiId: apiId
      };

      console.log('Creating Firebase group:', newGroup);

      const groupDocRef = doc(this.groupsRef, firebaseGroupId);
      await setDoc(groupDocRef, newGroup);

      return firebaseGroupId;
    } catch (apiError: any) {
      console.error('Erreur API lors de la création du groupe:', {
        status: apiError.status,
        message: apiError.message,
        error: apiError.error
      });
      throw apiError;
    }
  }

  async addUsers(groupId: string, incidentId: string, userIds: string[], participants: GroupParticipant[]) {
    const groupDocRef = doc(this.firestore, `groups/${groupId}`);
    const groupDocSnap = await getDoc(groupDocRef);

    if (groupDocSnap.exists()) {
      const groupData: any = groupDocSnap.data();
      console.log('Group data:', groupData);
      const existingMembers: string[] = Array.isArray(groupData.members) ? groupData.members : [];
      const updatedMembers = [...new Set([...existingMembers, ...userIds])]; // Merge and remove duplicates
      console.log('Updated members:', updatedMembers);

      // Update the group with the new members
      await updateDoc(groupDocRef, { members: updatedMembers });

      console.log('Users added successfully!');
    } else {
      console.log('Group not found!');
    }
  }

  async getUserGroups(userId: string, incidentId: string) {
    const q = query(this.groupsRef, where('incidentId', '==', incidentId), where('members', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    const groups = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('User groups:', groups);
    return groups;
  }

  async sendMessageToApi(message:  ChatMessage[] = []) {
    try {
      console.log("message",message)
      await this.http.post(`${this.apiUrl}/GroupMessage`, message, { headers: this.headers }).toPromise();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message à l\'API:', error);
      throw error;
    }
  }

  async getGroupDetails(groupId: string) {
    try {
      // Récupérer les détails du groupe depuis l'API
      const response = await this.http.get<ApiGroupResponse>(`${this.apiUrl}/${groupId}/groupById`, { headers: this.headers }).toPromise();
      
      if (response) {
        // Convertir la réponse de l'API en format compatible avec l'application
        const groupData = {
          id: groupId,
          name: response.designation,
          companyId: response.companyId,
          siteId: response.siteId,
          apiId: response.id,
          participants: response.participants,
          messages: response.messages
        };
        return groupData;
      } else {
        throw new Error('Groupe non trouvé dans l\'API');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du groupe:', error);
      throw error;
    }
  }

  async saveGroup(groupName: string, adminId: string, incidentId: string, userIds: GroupParticipant[], groupId: string) {
    try {
      const apiupdateGroup = {
        id: groupId,
        designation: groupName, 
        siteId: "39d00cd5-32af-c531-d230-e935a535103e",
        companyId: "39d00cd5-3251-9b25-bca0-bf46aa71c52b",
        participants: userIds
      };

      console.log(apiupdateGroup)

      await this.http.put(`${this.apiUrl}/${groupId}`, apiupdateGroup, { headers: this.headers }).toPromise();
      console.log('Groupe mis à jour avec succès');
    } catch (apiError: any) {
      console.error('Erreur API lors de la mise à jour du groupe:', {
        status: apiError.status,
        message: apiError.message,
        error: apiError.error
      });
      throw apiError;
    }
  }
}