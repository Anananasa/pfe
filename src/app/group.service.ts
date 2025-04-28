import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc, getDoc, getDocs, query, where, CollectionReference } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private groupsRef: CollectionReference;

  constructor(private firestore: Firestore) {
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

  async addUsers(groupId: string, userIds: string[]) {
    const groupDocRef = doc(this.firestore, `groups/${groupId}`);
    const groupDocSnap = await getDoc(groupDocRef);

    if (groupDocSnap.exists()) {
      const groupData: any = groupDocSnap.data();
      const updatedMembers = [...new Set([...groupData.members, ...userIds])]; // avoid duplicates

      // Update the group with the new members
      await updateDoc(groupDocRef, { members: updatedMembers });

      console.log('Users added successfully!');
    } else {
      console.log('Group not found!');
    }
  }

  async getUserGroups(userId: string) {
    const q = query(this.groupsRef, where('members', 'array-contains', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
