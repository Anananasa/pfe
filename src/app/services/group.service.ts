import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from '@angular/fire/app';
import { getFirestore, Firestore, collection, addDoc, doc, updateDoc, getDoc, getDocs, query, where, CollectionReference } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private firestore: Firestore;
  private groupsRef: CollectionReference;

  private firebaseConfig = {
    apiKey: "AIzaSyATlQRAggWF8w9B3VrrpR4nWK6P6luMs1U",
    authDomain: "qualitas-4f4a6.firebaseapp.com",
    projectId: "qualitas-4f4a6",
    storageBucket: "qualitas-4f4a6.firebasestorage.app",
    messagingSenderId: "649602588562",
    appId: "1:649602588562:web:822fb255fc1d1e07e72b4b"
  };

  constructor() {
    const app: FirebaseApp = initializeApp(this.firebaseConfig);
    this.firestore = getFirestore(app);
    this.groupsRef = collection(this.firestore, 'groups');
  }

  async createGroup(groupName: string, adminId: string, incidentId: string) {
    const newGroup = {
      name: groupName,
      incidentId: incidentId,
      adminId: adminId,
      members: [adminId],
      createdAt: new Date()
    };
    const groupDoc = await addDoc(this.groupsRef, newGroup);
    return groupDoc.id;
  }

  async addUsers(groupId: string, incidentId: string, userIds: string[]) {
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
}
