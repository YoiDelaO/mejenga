import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/contexts/AuthContext';
import { Button } from '../../components/Button/Button';
import { Shield, Search, Send, Users } from 'lucide-react';
import { CrearEquipoModal } from '../../components/CrearEquipoModal/CrearEquipoModal';
import { Avatar } from '../../components/Avatar/Avatar';
import { mockTeams } from '../../../data/mockData';
import type { Message } from '../../../core/types';
import '../ChatRoom/ChatRoom.css'; // Reusing chat styles

export const MiEquipo: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isCrearEquipoOpen, setIsCrearEquipoOpen] = useState(false);
  
  // Chat state
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      senderId: 'system',
      text: '¡Bienvenido al chat de tu equipo! Organiza los próximos partidos por aquí.',
      timestamp: new Date().toISOString()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) return null;

  // Si TIENE equipo, mostramos el Chat del Clan (Estilo Clash Royale)
  if (user.teamId) {
    const team = mockTeams.find(t => t.id === user.teamId);
    
    if (!team) {
      // Si hubo un error y el equipo no existe, le permitimos crear uno limpiando su estado
      updateProfile({ teamId: undefined });
      return null;
    }

    const handleSend = () => {
      if (!inputText.trim()) return;
      const newMessage: Message = {
        id: `m_${Date.now()}`,
        senderId: user.id,
        text: inputText.trim(),
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
    };

    const formatTime = (isoString: string) => {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
      <div className="mj-chat-room">
        <div 
          className="mj-chat-room-header" 
          style={{ cursor: 'pointer', borderBottom: '1px solid var(--color-border)' }}
          onClick={() => navigate(`/equipo/${team.id}`)}
        >
          <Avatar src={team.shieldUrl} size="md" isTeam />
          <div className="mj-chat-room-info" style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{team.name}</h2>
            <span className="mj-chat-room-status" style={{ color: 'var(--color-text-muted)' }}>
              <Users size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              {team.players.length}/{team.maxPlayers} Miembros
            </span>
          </div>
          <div style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)', fontWeight: 'bold' }}>
            Info
          </div>
        </div>

        <div className="mj-chat-messages" style={{ paddingBottom: '80px' }}>
          {messages.map(msg => {
            const isSystem = msg.senderId === 'system';
            const isMe = msg.senderId === user.id;
            
            if (isSystem) {
              return (
                <div key={msg.id} style={{ textAlign: 'center', margin: 'var(--spacing-md) 0' }}>
                  <span style={{ background: 'var(--color-surface-hover)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`mj-chat-message-wrapper ${isMe ? 'sent' : 'received'}`}>
                {!isMe && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginLeft: '4px', marginBottom: '2px', fontWeight: 'bold' }}>
                    {msg.senderId === user.id ? user.name : 'Compañero'}
                  </span>
                )}
                <div className="mj-chat-bubble">{msg.text}</div>
                <span className="mj-chat-time">{formatTime(msg.timestamp)}</span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="mj-chat-input-area" style={{ position: 'fixed', bottom: '60px', width: '100%', maxWidth: '480px', boxSizing: 'border-box' }}>
          <input 
            type="text" 
            className="mj-chat-input" 
            placeholder="Mensaje para el clan..." 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            className="mj-chat-send-btn" 
            disabled={!inputText.trim()}
            onClick={handleSend}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Si NO tiene equipo, mostramos las opciones para unirse o crear
  return (
    <div className="mj-perfil" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 'var(--spacing-xl)' }}>
      <Shield size={64} className="text-muted" style={{ marginBottom: 'var(--spacing-lg)', opacity: 0.5 }} />
      
      <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-sm)' }}>No tienes equipo</h2>
      <p className="text-muted" style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
        Para participar en este modo necesitas pertenecer a un equipo. ¿Qué deseas hacer?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', width: '100%' }}>
        <Button 
          size="lg" 
          fullWidth 
          onClick={() => setIsCrearEquipoOpen(true)}
          leftIcon={<Shield size={20} />}
        >
          Fundar un Equipo
        </Button>
        
        <Button 
          size="lg" 
          variant="outline" 
          fullWidth 
          onClick={() => navigate('/mercado/equipos')}
          leftIcon={<Search size={20} />}
        >
          Explorar Equipos
        </Button>
      </div>

      <CrearEquipoModal 
        isOpen={isCrearEquipoOpen} 
        onClose={() => setIsCrearEquipoOpen(false)} 
        onSuccess={async (teamData) => {
          setIsCrearEquipoOpen(false);
          const newTeamId = `t${Date.now()}`;
          
          mockTeams.push({
            id: newTeamId,
            name: teamData.name,
            description: teamData.description,
            modality: teamData.modality,
            shieldUrl: teamData.shieldBase64 || `https://ui-avatars.com/api/?name=${teamData.name.substring(0,2)}&background=random&color=fff&size=150`,
            captainId: user.id,
            subcaptainIds: [],
            players: [user],
            maxPlayers: 15,
            joinRequests: [],
            wins: 0,
            losses: 0,
            draws: 0,
            points: 0
          });
          
          localStorage.setItem('mejengas_db_teams', JSON.stringify(mockTeams));

          await updateProfile({ teamId: newTeamId });
        }} 
      />
    </div>
  );
};
