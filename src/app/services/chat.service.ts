import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from '@angular/fire/app';
import { getFirestore, Firestore, collection, addDoc, getDocs, query, where, CollectionReference, Timestamp, onSnapshot, orderBy, deleteDoc, doc, updateDoc, arrayRemove, getDoc, updateDoc as updateFirestoreDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { ChatFileDto } from './chat-message.interface';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

export class ChatService {
  private firestore: Firestore;
  private messagesRef: CollectionReference;
  private groupsRef: CollectionReference;
  private apiUrl = 'https://timserver.northeurope.cloudapp.azure.com/QalitasWebApi/api/ChatGroup';
  private token = localStorage.getItem('token');
  private headers = new HttpHeaders({
    'Authorization': `Bearer ${this.token}`,
    'Accept': 'application/json'
  });

  private firebaseConfig = {
  apiKey: "AIzaSyBmT-WEoNYu14uVDVOW9f6_Ft_PNHV8SIo",
  authDomain: "qualitas-87dad.firebaseapp.com",
  projectId: "qualitas-87dad",
  storageBucket: "qualitas-87dad.firebasestorage.app",
  messagingSenderId: "595779919125",
  appId: "1:595779919125:web:5bada50788799fbfeb1d1c"
};

  constructor(private http: HttpClient) {
    const app: FirebaseApp = initializeApp(this.firebaseConfig);
    this.firestore = getFirestore(app);
    this.messagesRef = collection(this.firestore, 'messages');
    this.groupsRef = collection(this.firestore, 'groups');
  }

  // Send a new message to a group
  async sendMessage(groupId: string, senderId: string, text: string, files: ChatFileDto[] = []) {
    const newMessage = {
      groupId: groupId,
      senderId: senderId,
      text: text,
      sentAt: Timestamp.fromDate(new Date()),
      files: files
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
        files?: ChatFileDto[];
      };
      return {
        id: doc.id,
        groupId: data.groupId,
        senderId: data.senderId,
        text: data.text,
        sentAt: data.sentAt.toDate(),
        files: data.files || []
      };
    });
    return messages;
  }

  async getAdminId(groupId: string): Promise<string> {
    try {
      const response = await this.http.get(`${this.apiUrl}/${groupId}/groupById`, { headers: this.headers }).toPromise();
      return (response as any)?.createdBy || '';
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
            files?: ChatFileDto[];
          };
          return {
            id: doc.id,
            groupId: data.groupId,
            senderId: data.senderId,
            text: data.text,
            sentAt: data.sentAt.toDate(),
            files: data.files || []
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
      // Récupérer les détails actuels du groupe
      const groupDetails = await this.getGroupDetails(groupId);
      
      // Filtrer le participant qui quitte du tableau des participants
      const updatedParticipants = groupDetails['participants'].filter((p: { userId: string }) => p.userId !== userId);

      // Mettre à jour le groupe dans l'API avec la nouvelle liste de participants
      await this.http.put(`${this.apiUrl}/${groupId}`, {
        ...groupDetails,
        participants: updatedParticipants
      }, { headers: this.headers }).toPromise();

      // Supprimer le participant du groupe dans Firestore
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
      // Supprimer le groupe dans l'API
      await this.http.delete(`${this.apiUrl}/${groupId}`, { headers: this.headers }).toPromise();

      // Supprimer tous les messages du groupe dans Firestore
      const messagesQuery = query(this.messagesRef, where('groupId', '==', groupId));
      const messagesSnapshot = await getDocs(messagesQuery);
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Supprimer le document du groupe dans Firestore
      const groupDoc = doc(this.firestore, 'groups', groupId);
      await deleteDoc(groupDoc);
      
      console.log('Groupe supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du groupe:', error);
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
