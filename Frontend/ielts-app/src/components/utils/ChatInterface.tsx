import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../services/supportChatService';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  currentUserRole: 'Student' | 'Admin';
  isLoading?: boolean;
}

export default function ChatInterface({ messages, onSendMessage, currentUserRole, isLoading }: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true); // Track if we should auto-scroll

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  };

  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 150;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Track user scroll behavior
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Update whether we should auto-scroll based on user's position
      shouldScrollRef.current = isNearBottom();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for scroll events from parent components
  useEffect(() => {
    const handleScrollEvent = () => {
      // Only scroll if user is near the bottom (not reading old messages)
      if (shouldScrollRef.current) {
        scrollToBottom();
      }
    };

    window.addEventListener('scrollToBottom', handleScrollEvent);
    return () => window.removeEventListener('scrollToBottom', handleScrollEvent);
  }, []);

  // Scroll to bottom on initial load only
  useEffect(() => {
    if (messages.length > 0) {
      const container = messagesContainerRef.current;
      // Only scroll on first load (when container hasn't been scrolled yet)
      if (container && container.scrollTop === 0 && container.scrollHeight > container.clientHeight) {
        setTimeout(() => {
          scrollToBottom();
          shouldScrollRef.current = true; // Enable auto-scroll after initial load
        }, 100);
      }
    }
  }, [messages.length === 0]); // Only when messages first appear

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
      // Always scroll to bottom after sending a message
      shouldScrollRef.current = true;
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Today ${timeStr}`;
    } else if (isYesterday) {
      return `Yesterday ${timeStr}`;
    } else {
      return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + timeStr;
    }
  };

  return (
    <div className="card">
      <div className="card-body p-0" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        {/* Messages Area */}
        <div ref={messagesContainerRef} className="flex-grow-1 overflow-auto p-3" style={{ backgroundColor: '#f8f9fa' }}>
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="isax isax-messages-3 fs-1 d-block mb-3"></i>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isCurrentUser = msg.sentBy === currentUserRole;
                return (
                  <div key={msg.id} className={`d-flex mb-3 ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'}`}>
                    <div style={{ maxWidth: '70%' }}>
                      {!isCurrentUser && (
                        <div className="small text-muted mb-1">
                          <i className="isax isax-user me-1"></i>
                          {msg.sentBy === 'Admin' ? msg.adminName || 'Admin' : msg.studentName}
                        </div>
                      )}
                      <div
                        className={`p-3 rounded ${
                          isCurrentUser
                            ? 'bg-primary text-white'
                            : 'bg-white border'
                        }`}
                        style={{ wordWrap: 'break-word' }}
                      >
                        {msg.message}
                      </div>
                      <div className={`small text-muted mt-1 ${isCurrentUser ? 'text-end' : ''}`}>
                        {formatDate(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-top p-3 bg-white">
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!newMessage.trim() || isLoading}
              >
                <i className="isax isax-send-2 me-2"></i>
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
