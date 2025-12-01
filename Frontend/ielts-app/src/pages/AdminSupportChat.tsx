import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import ChatInterface from '../components/utils/ChatInterface';
import { 
  getAllConversations, 
  getMessagesByStudent, 
  replyToStudent, 
  getUnreadCount 
} from '../services/supportChatService';
import { createSignalRConnection, startConnection, stopConnection } from '../services/signalRService';
import type { ChatMessage, ChatConversation } from '../services/supportChatService';

export default function AdminSupportChat() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const hubConnectionRef = useRef<any>(null);

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
    
    // Setup SignalR connection
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log('🔄 Admin setting up SignalR connection...');
      const connection = createSignalRConnection(token);
      hubConnectionRef.current = connection;
      
      // Listen for new messages - MUST be set up BEFORE starting connection
      connection.on('ReceiveMessage', (message: ChatMessage) => {
        console.log('📨 Admin received message via SignalR:', message);
        setMessages(prev => {
          // Only add if not already in list
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
        loadConversations(); // Refresh conversations to update last message
        loadUnreadCount();
        // Scroll to bottom
        setTimeout(() => {
          const event = new CustomEvent('scrollToBottom');
          window.dispatchEvent(event);
        }, 100);
      });
      
      // Start connection AFTER setting up event handlers
      startConnection(connection).catch(err => {
        console.error('Admin failed to start SignalR connection:', err);
      });
    } else {
      console.warn('⚠️ Admin: No token found, cannot connect to SignalR');
    }

    return () => {
      if (hubConnectionRef.current) {
        console.log('🧹 Admin cleaning up SignalR connection');
        hubConnectionRef.current.off('ReceiveMessage');
        stopConnection(hubConnectionRef.current);
        hubConnectionRef.current = null;
      }
    };
  }, []); // Remove selectedStudentId dependency

  // Separate effect for messages refresh when a conversation is selected
  useEffect(() => {
    if (!selectedStudentId) return;

    loadMessages(selectedStudentId);
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
      setMessages(data);
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
    // Don't call loadMessages here, let the useEffect handle it
  };

  const handleSendMessage = async (messageText: string) => {
    if (!selectedStudentId) return;

    try {
      const newMsg = await replyToStudent(selectedStudentId, { message: messageText });
      setMessages([...messages, newMsg]);
      // Scroll to bottom when admin sends message
      setTimeout(() => {
        const event = new CustomEvent('scrollToBottom');
        window.dispatchEvent(event);
      }, 100);
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
