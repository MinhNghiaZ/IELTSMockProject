import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import ChatInterface from '../components/utils/ChatInterface';
import { getMyMessages, sendMessage, getUnreadCount } from '../services/supportChatService';
import type { ChatMessage } from '../services/supportChatService';

export default function SupportChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const previousMessageCountRef = useRef(0);

  useEffect(() => {
    loadMessages();
    loadUnreadCount();
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      loadMessages();
      loadUnreadCount();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const data = await getMyMessages();
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
