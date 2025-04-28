import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from '@angular/fire/app';
import { getFirestore, Firestore, collection, addDoc, getDocs, query, where, CollectionReference, Timestamp, onSnapshot, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private firestore: Firestore;
  private messagesRef: CollectionReference;

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
    this.messagesRef = collection(this.firestore, 'messages');
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
}
