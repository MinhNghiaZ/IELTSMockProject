import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import ChatInterface from '../components/utils/ChatInterface';
import { 
  getAllConversations, 
  getMessagesByStudent, 
  replyToStudent, 
  getUnreadCount 
} from '../services/supportChatService';
import type { ChatMessage, ChatConversation } from '../services/supportChatService';

export default function AdminSupportChat() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const previousMessageCountRef = useRef(0);

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
    
    // Poll for new conversations every 5 seconds
    const interval = setInterval(() => {
      loadConversations();
      loadUnreadCount();
    }, 5000);

    return () => clearInterval(interval);
  }, []); // Remove selectedStudentId dependency

  // Separate effect for messages refresh when a conversation is selected
  useEffect(() => {
    if (!selectedStudentId) return;

    loadMessages(selectedStudentId);

    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      loadMessages(selectedStudentId);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedStudentId]); // Only re-run when selectedStudentId changes

  const loadConversations = async () => {
    try {
      const data = await getAllConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations!');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setTotalUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadMessages = async (studentId: number) => {
    try {
      const data = await getMessagesByStudent(studentId);
      const hadNewMessages = data.length > previousMessageCountRef.current;
      setMessages(data);
      previousMessageCountRef.current = data.length;
      
      // Only trigger scroll if there are new messages
      if (hadNewMessages) {
        setTimeout(() => {
          const event = new CustomEvent('scrollToBottom');
          window.dispatchEvent(event);
        }, 100);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages!');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectConversation = (studentId: number) => {
    setSelectedStudentId(studentId);
    setIsLoadingMessages(true); // Set loading when switching
    previousMessageCountRef.current = 0; // Reset count when switching conversations
    // Don't call loadMessages here, let the useEffect handle it
  };

  const handleSendMessage = async (messageText: string) => {
    if (!selectedStudentId) return;

    try {
      const newMsg = await replyToStudent(selectedStudentId, { message: messageText });
      setMessages([...messages, newMsg]);
      previousMessageCountRef.current = messages.length + 1; // Update count
      toast.success('Message sent successfully!');
      // Update conversations in background without blocking
      loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again!');
    }
  };

  const selectedConversation = conversations.find(c => c.studentId === selectedStudentId);

  return (
    <div className="row">
      {/* Conversations List */}
      <div className="col-lg-4">
        <div className="card">
          <div className="card-header border-bottom">
            <h4 className="mb-1">
              <i className="isax isax-messages-3 me-2"></i>
              Support Conversations
            </h4>
            {totalUnreadCount > 0 && (
              <span className="badge bg-danger rounded-pill">{totalUnreadCount} new</span>
            )}
          </div>
          <div className="card-body p-0" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {isLoadingConversations ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="isax isax-message-text fs-1 d-block mb-3"></i>
                <p>No conversations yet</p>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {conversations.map((conv) => (
                  <button
                    key={conv.studentId}
                    className={`list-group-item list-group-item-action ${
                      selectedStudentId === conv.studentId ? 'active' : ''
                    }`}
                    onClick={() => handleSelectConversation(conv.studentId)}
                  >
                    <div className="d-flex w-100 justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-1">
                          <i className="isax isax-user me-2"></i>
                          <strong>{conv.studentName}</strong>
                          {conv.unreadCount > 0 && (
                            <span className="badge bg-danger rounded-pill ms-2">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="small text-muted mb-1">
                          <i className="isax isax-sms me-1"></i>
                          {conv.studentEmail}
                        </div>
                        {conv.lastMessage && (
                          <div className="small text-truncate" style={{ maxWidth: '250px' }}>
                            <strong>{conv.lastMessage.sentBy}:</strong> {conv.lastMessage.message}
                          </div>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <small className="text-muted">
                          {new Date(conv.lastMessage.createdAt).toLocaleDateString('vi-VN')}
                        </small>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="col-lg-8">
        {selectedStudentId ? (
          <div className="card">
            <div className="card-header border-bottom">
              <div className="d-flex align-items-center">
                <i className="isax isax-user me-2"></i>
                <div>
                  <h5 className="mb-0">{selectedConversation?.studentName}</h5>
                  <small className="text-muted">{selectedConversation?.studentEmail}</small>
                </div>
              </div>
            </div>
            <div className="card-body p-0" style={{ overflow: 'hidden' }}>
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                currentUserRole="Admin"
                isLoading={isLoadingMessages}
              />
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="isax isax-message-text fs-1 text-muted d-block mb-3"></i>
              <h5 className="text-muted">Select a conversation to start</h5>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
