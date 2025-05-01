export interface ChatMessage {
  adminId?: string;
  id?: string;         // Optional ID for the message (from Firestore)
  groupId: string;     // ID of the group to which the message belongs
  senderId: string;    // ID of the sender (user)
  senderName?: string; // Optional sender name (can be used if needed)
  senderAvatar?: string; // Optional sender avatar (URL or path to image)
  text: string;        // The actual content of the message
  sentAt: Date;        // Timestamp of when the message was sent
  files?: ChatFileDto[];
  GroupId?: string;    // API specific field
  UserId?: string;     // API specific field
  Msg?: string;        // API specific field
  SentDate?: Date;     // API specific field
  AttachedFiles?: string; // API specific field
  Files?: any[];       // API specific field
}

export interface ChatFileDto {
  name: string;
  data: string;
  type: string;
}

export interface ApiMessage {
  id: string;
  groupId: string;
  userId: string;
  msg: string;
  sentDate: string;
  files: ApiFile[];
}

export interface ApiFile {
  fileName: string;
  filePath: string;
  fileType: string;
}

export interface ApiGroupResponse {
  id: string;
  designation: string;
  sourceId: string;
  createdBy: string;
  createdDate: string;
  companyId: string;
  siteId: string;
  participants: {
    userId: string;
    fullName: string;
    userName: string | null;
    serviceDesignation: string;
    photo: string;
    isAdmin: boolean;
  }[];
  messages: ApiMessage[];
}

export interface ApiGroupFilterResponse {
  id: string;
  designation: string;
  type: number;
  participants: {
    userId: string;
    fullName: string;
    userName: string | null;
    serviceDesignation: string;
    photo: string;
    isAdmin: boolean;
  }[];
  lastMessage: string;
  lastMessageDate: string;
  unseenMessages: number;
  serviceDesignation: string;
  urlImg: string;
  displayDesignation: string;
  isOnline: boolean;
  sourceReference: string;
  sourceId: string;
  createdBy: string;
  createdDate: string;
}