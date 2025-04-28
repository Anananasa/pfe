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
