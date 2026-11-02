export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  ine?: string; // Identifiant National de l'Étudiant (ex: BAMH0504463138)
  studentCardPhotoUrl?: string; // Photo de la Carte Unique de l'Étudiant
  department: string;
  program: string;
  level: string;
  institution?: string;
  role?: 'student' | 'teacher' | 'admin';
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'missing_card';
  birthDate?: string;
  photoURL?: string;
  bio?: string;
  createdAt?: any;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // List of user UIDs who voted
}

export interface PostItem {
  id: string;
  authorId: string;
  authorName: string;
  authorProgram?: string;
  authorDepartment?: string;
  content: string;
  department?: string;
  likes: string[];
  commentsCount: number;
  createdAt: any;
  mediaUrl?: string;
  tag?: string;
  isOfficial?: boolean;
  poll?: {
    question: string;
    options: PollOption[];
  };
  isQuestion?: boolean;
  resolvedAnswerId?: string;
}

export interface CommentItem {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: any;
  isBestAnswer?: boolean;
}

export interface GroupItem {
  id: string;
  name: string;
  description: string;
  department: string;
  creatorId: string;
  creatorName: string;
  members: string[];
  createdAt: any;
  icon?: string;
}

export interface GroupMessageItem {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  content: string;
  audioUrl?: string;
  audioDuration?: number;
  createdAt: any;
}

export interface ConversationItem {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  lastMessage?: string;
  lastSenderId?: string;
  updatedAt?: any;
}

export interface DirectMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  audioUrl?: string;
  audioDuration?: number;
  createdAt: any;
}

export interface CourseDocItem {
  id: string;
  title: string;
  course: string;
  department: string;
  level: string;
  description?: string;
  contentPreview?: string;
  authorId: string;
  authorName: string;
  fileType?: string;
  fileUrl?: string;
  category?: 'cours' | 'fiche_pedagogique' | 'annale_examen' | 'memoire';
  downloadCount?: number;
  savedOffline?: boolean;
  createdAt: any;
}

export interface StageLogItem {
  id: string;
  studentId: string;
  studentName: string;
  schoolName: string; // Ex: Lycée 1er Mars, Collège Ratoma
  classLevel: string; // Ex: 10ème Année, Terminale SM
  subject: string;
  lessonTheme: string;
  date: string;
  supervisorName?: string;
  observations: string;
  pedagogicalNotes: string;
  status: 'brouillon' | 'valide';
  createdAt: any;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'system' | 'post' | 'message' | 'group' | 'verification';
  read: boolean;
  createdAt: any;
}
