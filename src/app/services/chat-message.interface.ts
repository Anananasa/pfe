export interface ChatMessage {
  id?: string;         // Optional ID for the message (from Firestore)
  groupId: string;     // ID of the group to which the message belongs
  senderId: string;    // ID of the sender (user)
  senderName?: string; // Optional sender name (can be used if needed)
  senderAvatar?: string; // Optional sender avatar (URL or path to image)
  text: string;        // The actual content of the message
  sentAt: Date;        // Timestamp of when the message was sent
}