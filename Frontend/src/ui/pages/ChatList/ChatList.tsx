import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockChats } from '../../../data/mockData';
import { Avatar } from '../../components/Avatar/Avatar';
import './ChatList.css';

export const ChatList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reto' | 'reclutamiento'>('reto');

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredChats = mockChats.filter(chat => chat.type === activeTab);

  return (
    <div className="mj-chat-list">
      <div className="mj-chat-list-header">
        <h1>Chats</h1>
      </div>

      <div className="mj-chat-tabs">
        <button 
          className={`mj-chat-tab ${activeTab === 'reto' ? 'active' : ''}`}
          onClick={() => setActiveTab('reto')}
        >
          Retos
        </button>
        <button 
          className={`mj-chat-tab ${activeTab === 'reclutamiento' ? 'active' : ''}`}
          onClick={() => setActiveTab('reclutamiento')}
        >
          Reclutamientos
        </button>
      </div>
      
      <div className="mj-chat-items">
        {filteredChats.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center', marginTop: '2rem' }}>
            No tienes chats de {activeTab === 'reto' ? 'retos' : 'reclutamiento'}.
          </p>
        ) : (
          filteredChats.map(chat => {
            const rival = chat.participants[0];
            const lastMessage = chat.messages[chat.messages.length - 1];
            
            return (
              <Link to={`/chats/${chat.id}`} key={chat.id} className="mj-chat-item">
                <div className="mj-chat-item-avatar">
                  <Avatar src={rival.avatarUrl} size="md" />
                  {chat.unreadCount > 0 && (
                    <div className="mj-chat-unread-badge">{chat.unreadCount}</div>
                  )}
                </div>
                <div className="mj-chat-item-content">
                  <div className="mj-chat-item-header">
                    <h3>{rival.name}</h3>
                    <span className="mj-chat-item-time">{formatTime(chat.lastMessageAt)}</span>
                  </div>
                  <p className={`mj-chat-item-preview ${chat.unreadCount > 0 ? 'unread' : ''}`}>
                    {lastMessage?.senderId === 'currentUser' ? 'Tú: ' : ''}{lastMessage?.text}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};
