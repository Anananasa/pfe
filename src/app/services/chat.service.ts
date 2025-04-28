import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from '@angular/fire/app';
import { getFirestore, Firestore, collection, addDoc, getDocs, query, where, CollectionReference, Timestamp, onSnapshot, orderBy, deleteDoc, doc, updateDoc, arrayRemove, getDoc, updateDoc as updateFirestoreDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})

export class ChatService {
  static getAdminId(groupId: string) {
    throw new Error('Method not implemented.');
  }
  private firestore: Firestore;
  private messagesRef: CollectionReference;
  private groupsRef: CollectionReference;

  private firebaseConfig = {
  apiKey: "AIzaSyBmT-WEoNYu14uVDVOW9f6_Ft_PNHV8SIo",
  authDomain: "qualitas-87dad.firebaseapp.com",
  projectId: "qualitas-87dad",
  storageBucket: "qualitas-87dad.firebasestorage.app",
  messagingSenderId: "595779919125",
  appId: "1:595779919125:web:5bada50788799fbfeb1d1c"
};

  constructor() {
    const app: FirebaseApp = initializeApp(this.firebaseConfig);
    this.firestore = getFirestore(app);
    this.messagesRef = collection(this.firestore, 'messages');
    this.groupsRef = collection(this.firestore, 'groups');
  }

  // Send a new message to a group
  async sendMessage(groupId: string, senderId: string, text: string) {
    const newMessage = {
      groupId: groupId,
      senderId: senderId,
      text: text,
      sentAt: Timestamp.fromDate(new Date())  // Use Firestore Timestamp
    };

    try {
      const messageDoc = await addDoc(this.messagesRef, newMessage);
      console.log('Message sent with ID: ', messageDoc.id);
      return messageDoc.id;
    } catch (error) {
      console.error('Error sending message: ', error);
      return null;
    }
  }

  // Get all messages for a specific group
  async getMessages(groupId: string) {
    const q = query(this.messagesRef, where('groupId', '==', groupId), orderBy('sentAt', 'asc'));
    const querySnapshot = await getDocs(q);
const messages = querySnapshot.docs.map(doc => {
  const data = doc.data() as {
    groupId: string;
    senderId: string;
    text: string;
    sentAt: Timestamp;
  };
  return {
    id: doc.id,
    groupId: data.groupId,
    senderId: data.senderId,
    text: data.text,
    sentAt: data.sentAt.toDate() // Convert Firestore Timestamp to Date
  };
});
    console.log('Messages:', messages);
    return messages;
  }

  async getAdminId(groupId: string) {
    try {
      console.log(groupId)
      const groupDoc = doc(this.firestore, 'groups', groupId);
      const groupSnapshot = await getDoc(groupDoc);

      if (groupSnapshot.exists()) {
        const groupData = groupSnapshot.data();
        const data = groupData as {
          adminId: string
        };
        
        return data.adminId;
        console.log('Group data:', groupData);
      } else {
        console.log('Group not found');
        throw 'error';
      }

    } catch (error) {
      console.error('Error getting admin ID:', error);
      throw error;
    }
  }
  
  
  listenForMessages(groupId: string): Observable<any[]> {
    return new Observable(observer => {
      const q = query(this.messagesRef, where('groupId', '==', groupId), orderBy('sentAt', 'asc'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages = querySnapshot.docs.map(doc => {
          const data = doc.data() as {
            groupId: string;
            senderId: string;
            text: string;
            sentAt: Timestamp;
          };
          return {
            id: doc.id,
            groupId: data.groupId,
            senderId: data.senderId,
            text: data.text,
            sentAt: data.sentAt.toDate()
          };
        });

        observer.next(messages);
      }, error => {
        observer.error(error);
      });

      // When unsubscribed
      return { unsubscribe };
    });
  }

  async leaveGroup(groupId: string, userId: string) {
    try {
      const groupDoc = doc(this.firestore, 'groups', groupId);
      await updateFirestoreDoc(groupDoc, {
        members: arrayRemove(userId)
      });
      console.log('User left group successfully');
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  }

  async deleteGroup(groupId: string) {
    try {
      // Delete all messages in the group
      const messagesQuery = query(this.messagesRef, where('groupId', '==', groupId));
      const messagesSnapshot = await getDocs(messagesQuery);
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete the group document
      const groupDoc = doc(this.firestore, 'groups', groupId);
      await deleteDoc(groupDoc);
      
      console.log('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  async getGroupDetails(groupId: string) {
    try {
      const groupDoc = doc(this.firestore, 'groups', groupId);
      const groupSnapshot = await getDoc(groupDoc);
      
      if (groupSnapshot.exists()) {
        return groupSnapshot.data();
      } else {
        throw new Error('Groupe non trouvé');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du groupe:', error);
      throw error;
    }
  }

  async updateGroup(groupId: string, data: { name: string; description: string }) {
    try {
      const groupDoc = doc(this.firestore, 'groups', groupId);
      await updateFirestoreDoc(groupDoc, {
        name: data.name,
        description: data.description
      });
      console.log('Groupe mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du groupe:', error);
      throw error;
    }
  }
}
