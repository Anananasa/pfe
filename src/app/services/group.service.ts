import { Injectable } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { initializeApp, FirebaseApp } from '@angular/fire/app';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { getFirestore, Firestore, collection, addDoc, doc, updateDoc, getDoc, getDocs, query, where, CollectionReference } from '@angular/fire/firestore';

interface GroupParticipant {
  userId: string;
  fullName: string;
  userName: string | null;
  serviceDesignation: string;
  photo: string;
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

    console.log(apiNewGroup)

    try {
      var apiId = await this.http.post(this.apiUrl, apiNewGroup, { headers: this.headers }).toPromise();
    } catch (apiError: any) {
      console.error('Erreur API lors de la création du groupe:', {
        status: apiError.status,
        message: apiError.message,
        error: apiError.error
      });
    }

    const newGroup = {
      name: groupName,
      incidentId: incidentId,
      adminId: adminId,
      members: [adminId],
      createdAt: new Date(),
      apiId: (apiId as any)?.id
    };

    const groupDoc = await addDoc(this.groupsRef, newGroup);

    return groupDoc.id;
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
  
      try {
        await this.http.post(`${this.apiUrl}/GroupParticipant?selectedId=${updatedMembers.join(',')}&groupId=${groupData.apiId}`, {}, { headers: this.headers }).toPromise();
      } catch (apiError: any) {
        console.error('Erreur API lors de la création du groupe:', {
          status: apiError.status,
          message: apiError.message,
          error: apiError.error
        });
      }

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
}
