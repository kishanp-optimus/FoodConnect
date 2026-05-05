import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatApi, IMAGE_BASE_URL } from '../services/api';
import { Badge, PageLoader, EmptyState } from '../components/common';
import './Chat.css';

const Chat = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preSelectedOrder = searchParams.get('order');
  
  const [conversations, setConversations] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
      
      if (data.length > 0 && !preSelectedOrder && !selectedOrderId) {
        setSelectedOrderId(data[0].order_id);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [preSelectedOrder, selectedOrderId]);

  const fetchMessages = useCallback(async (orderId) => {
    setMessagesLoading(true);
    try {
      const data = await chatApi.getMessages(orderId);
      setMessages(data);
      await chatApi.markAsRead(orderId);
      
      // Update unread count in conversations
      setConversations(prev => prev.map(c => 
        c.order_id === orderId ? { ...c, unread_count: 0 } : c
      ));
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (preSelectedOrder && conversations.length > 0) {
      setSelectedOrderId(preSelectedOrder);
    }
  }, [preSelectedOrder, conversations.length]);

  useEffect(() => {
    if (selectedOrderId) {
      fetchMessages(selectedOrderId);
    }
  }, [selectedOrderId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedOrderId || sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const sentMessage = await chatApi.sendMessage(selectedOrderId, messageText);
      setMessages(prev => [...prev, sentMessage]);
      
      // Update last message in conversations
      setConversations(prev => prev.map(c => 
        c.order_id === selectedOrderId 
          ? { 
              ...c, 
              last_message: { 
                message: messageText, 
                timestamp: new Date().toISOString(),
                sender_id: user.id
              } 
            }
          : c
      ));
    } catch (err) {
      alert('Failed to send message');
      setNewMessage(messageText);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) return <PageLoader />;

  if (conversations.length === 0) {
    return (
      <div className="chat-page">
        <EmptyState
          icon="💬"
          title="No conversations yet"
          description="Conversations will appear here when you place or receive orders."
          actionLabel="Browse Food"
          onAction={() => window.location.href = '/browse'}
        />
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Conversations List */}
        <div className="conversations-panel">
          <div className="panel-header">
            <h2>💬 Messages</h2>
          </div>
          
          <div className="conversations-list">
            {conversations.map(conv => (
              <div
                key={conv.order_id}
                className={`conversation-item ${selectedOrderId === conv.order_id ? 'active' : ''}`}
                onClick={() => setSelectedOrderId(conv.order_id)}
              >
                <div className="conv-avatar">
                  {conv.food_item?.image_path ? (
                    <img 
                      src={`${IMAGE_BASE_URL}/${conv.food_item.image_path}`}
                      alt={conv.food_item?.title}
                    />
                  ) : (
                    <span>🍽️</span>
                  )}
                </div>
                
                <div className="conv-info">
                  <div className="conv-header">
                    <span className="conv-name">{conv.other_user?.full_name}</span>
                    {conv.last_message && (
                      <span className="conv-time">
                        {formatDate(conv.last_message.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="conv-preview">
                    <span className="conv-food">{conv.food_item?.title}</span>
                  </div>
                  {conv.last_message && (
                    <p className="conv-last-message">
                      {conv.last_message.sender_id === user.id ? 'You: ' : ''}
                      {conv.last_message.message}
                    </p>
                  )}
                </div>
                
                {conv.unread_count > 0 && (
                  <span className="unread-badge">{conv.unread_count}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-panel">
          {selectedOrderId ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-user-info">
                  <div className="user-avatar">
                    {conversations.find(c => c.order_id === selectedOrderId)?.other_user?.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h3>{conversations.find(c => c.order_id === selectedOrderId)?.other_user?.full_name}</h3>
                    <span className="food-context">
                      Re: {conversations.find(c => c.order_id === selectedOrderId)?.food_item?.title}
                    </span>
                  </div>
                </div>
                <Badge 
                  variant={conversations.find(c => c.order_id === selectedOrderId)?.order_status === 'accepted' ? 'success' : 
                           conversations.find(c => c.order_id === selectedOrderId)?.order_status === 'rejected' ? 'error' : 'warning'}
                >
                  {conversations.find(c => c.order_id === selectedOrderId)?.order_status}
                </Badge>
              </div>

              {/* Messages */}
              <div className="messages-container">
                {messagesLoading ? (
                  <div className="messages-loading">
                    <span>Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="no-messages">
                    <span>👋</span>
                    <p>Start the conversation!</p>
                  </div>
                ) : (
                  <div className="messages-list">
                    {messages.map((msg, index) => {
                      const isOwn = msg.sender_id === user.id;
                      const showDate = index === 0 || 
                        formatDate(msg.timestamp) !== formatDate(messages[index - 1].timestamp);
                      
                      return (
                        <React.Fragment key={msg.id}>
                          {showDate && (
                            <div className="date-divider">
                              <span>{formatDate(msg.timestamp)}</span>
                            </div>
                          )}
                          <div className={`message ${isOwn ? 'own' : 'other'}`}>
                            <div className="message-bubble">
                              <p>{msg.message}</p>
                              <span className="message-time">{formatTime(msg.timestamp)}</span>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" disabled={!newMessage.trim() || sending}>
                  {sending ? '...' : '➤'}
                </button>
              </form>
            </>
          ) : (
            <div className="no-conversation-selected">
              <span>💬</span>
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
