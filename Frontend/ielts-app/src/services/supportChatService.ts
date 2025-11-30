import { client } from "./authService";

export interface ChatMessage {
  id: number;
  studentId: number;
  studentName: string;
  adminId: number | null;
  adminName: string | null;
  message: string;
  sentBy: "Student" | "Admin";
  createdAt: string;
  isRead: boolean;
}

export interface ChatConversation {
  studentId: number;
  studentName: string;
  studentEmail: string;
  unreadCount: number;
  lastMessage: ChatMessage | null;
}

export interface SendMessageDTO {
  message: string;
}

// Student sends a message
export async function sendMessage(messageDto: SendMessageDTO): Promise<ChatMessage> {
  const response = await client.post("/SupportChat/send", messageDto);
  return response.data;
}

// Admin replies to a student
export async function replyToStudent(studentId: number, messageDto: SendMessageDTO): Promise<ChatMessage> {
  const response = await client.post(`/SupportChat/reply/${studentId}`, messageDto);
  return response.data;
}

// Admin gets all conversations
export async function getAllConversations(): Promise<ChatConversation[]> {
  const response = await client.get("/SupportChat/conversations");
  return response.data;
}

// Student gets their own messages
export async function getMyMessages(): Promise<ChatMessage[]> {
  const response = await client.get("/SupportChat/messages");
  return response.data;
}

// Admin gets messages with a specific student
export async function getMessagesByStudent(studentId: number): Promise<ChatMessage[]> {
  const response = await client.get(`/SupportChat/messages/${studentId}`);
  return response.data;
}

// Get unread count for current user
export async function getUnreadCount(): Promise<number> {
  const response = await client.get("/SupportChat/unread-count");
  return response.data.unreadCount;
}
