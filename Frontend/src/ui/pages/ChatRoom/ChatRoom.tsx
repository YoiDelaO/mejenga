import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockChats } from '../../../data/mockData';
import { Avatar } from '../../components/Avatar/Avatar';
import { ArrowLeft, Send } from 'lucide-react';
import type { Message } from '../../../core/types';
import './ChatRoom.css';

export const ChatRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  
  // Local state to simulate sending messages
  const [chat, setChat] = useState(() => mockChats.find(c => c.id === id) || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when chat loads or new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  if (!chat) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Chat no encontrado</div>;
  }

  const rival = chat.participants[0];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const newMessage: Message = {
      id: `m_${Date.now()}`,
      senderId: 'currentUser',
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    setChat(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, newMessage]
      };
    });
    
    setInputText('');
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mj-chat-room">
      <div className="mj-chat-room-header">
        <button className="mj-chat-back-btn" onClick={() => navigate('/chats')}>
          <ArrowLeft size={24} />
        </button>
        <Avatar src={rival.avatarUrl} size="sm" />
        <div className="mj-chat-room-info">
          <h2>{rival.name}</h2>
          <span className="mj-chat-room-status">Capitán Rival</span>
        </div>
      </div>

      <div className="mj-chat-messages">
        {chat.messages.map(msg => {
          const isMe = msg.senderId === 'currentUser';
          return (
            <div key={msg.id} className={`mj-chat-message-wrapper ${isMe ? 'sent' : 'received'}`}>
              <div className="mj-chat-bubble">{msg.text}</div>
              <span className="mj-chat-time">{formatTime(msg.timestamp)}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="mj-chat-input-area">
        <input 
          type="text" 
          className="mj-chat-input" 
          placeholder="Escribe un mensaje..." 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend(inputText)}
        />
        <button 
          className="mj-chat-send-btn" 
          disabled={!inputText.trim()}
          onClick={() => handleSend(inputText)}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
