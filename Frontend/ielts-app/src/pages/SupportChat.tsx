import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import ChatInterface from '../components/utils/ChatInterface';
import { getMyMessages, sendMessage, getUnreadCount } from '../services/supportChatService';
import { createSignalRConnection, startConnection, stopConnection } from '../services/signalRService';
import type { ChatMessage } from '../services/supportChatService';

export default function SupportChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const hubConnectionRef = useRef<any>(null);

  useEffect(() => {
    loadMessages();
    loadUnreadCount();
    
    // Setup SignalR connection
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log('🔄 Setting up SignalR connection...');
      const connection = createSignalRConnection(token);
      hubConnectionRef.current = connection;
      
      // Listen for new messages - MUST be set up BEFORE starting connection
      connection.on('ReceiveMessage', (message: ChatMessage) => {
        console.log('📨 Received message via SignalR:', message);
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
        loadUnreadCount();
        // Scroll to bottom
        setTimeout(() => {
          const event = new CustomEvent('scrollToBottom');
          window.dispatchEvent(event);
        }, 100);
      });
      
      // Start connection AFTER setting up event handlers
      startConnection(connection).catch(err => {
        console.error('Failed to start SignalR connection:', err);
      });
    } else {
      console.warn('⚠️ No token found, cannot connect to SignalR');
    }

    return () => {
      if (hubConnectionRef.current) {
        console.log('🧹 Cleaning up SignalR connection');
        hubConnectionRef.current.off('ReceiveMessage');
        stopConnection(hubConnectionRef.current);
        hubConnectionRef.current = null;
      }
    };
  }, []);

  const loadMessages = async () => {
    try {
      const data = await getMyMessages();
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    try {
      const newMsg = await sendMessage({ message: messageText });
      setMessages([...messages, newMsg]);
      // Scroll to bottom when user sends message
      setTimeout(() => {
        const event = new CustomEvent('scrollToBottom');
        window.dispatchEvent(event);
      }, 100);
      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again!');
    }
  };

  return (
    <div className="card">
      <div className="card-header border-bottom d-flex align-items-center justify-content-between">
        <div>
          <h4 className="mb-1">
            <i className="isax isax-messages-3 me-2"></i>
            Support
          </h4>
          <p className="text-muted mb-0">Contact Admin for assistance</p>
        </div>
        {unreadCount > 0 && (
          <span className="badge bg-danger rounded-pill">{unreadCount} new</span>
        )}
      </div>
      <div className="card-body p-0" style={{ overflow: 'hidden' }}>
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          currentUserRole="Student"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
