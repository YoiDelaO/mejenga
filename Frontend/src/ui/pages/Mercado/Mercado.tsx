import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/contexts/AuthContext';
import { mockUsers, mockTeams } from '../../../data/mockData';
import type { User } from '../../../core/types';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Avatar } from '../../components/Avatar/Avatar';
import { RankIcon } from '../../components/RankIcon/RankIcon';
import { Modal } from '../../components/Modal/Modal';
import { Search, MapPin, Shield, Star, Users, Activity } from 'lucide-react';
import './Mercado.css';

export const Mercado: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const myTeam = mockTeams.find(t => t.id === authUser?.teamId);
  

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  // Invite modal state
  const [inviteTarget, setInviteTarget] = useState<User | null>(null);
  const [inviteType, setInviteType] = useState<'party' | 'team'>('party');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviteSuccess, setIsInviteSuccess] = useState(false);

  const CITIES = ['San José', 'Heredia', 'Alajuela', 'Cartago', 'Puntarenas', 'Guanacaste', 'Limón'];
  const POSITIONS = ['Delantero', 'Mediocampista', 'Defensa', 'Portero'];

  // Only get users who are free agents
  const freeAgents = mockUsers.filter(u => u.isFreeAgent);

  const filteredAgents = useMemo(() => {
    return freeAgents.filter(agent => {
      if (selectedCity && agent.location?.city !== selectedCity) return false;
      if (selectedPosition && agent.position !== selectedPosition && agent.secondaryPosition !== selectedPosition) return false;
      return true;
    });
  }, [freeAgents, selectedCity, selectedPosition]);

  const handleSendInvite = (type: 'party' | 'team') => {
    if (type === 'team') {
      if (!myTeam) {
        alert('Debes pertenecer a un equipo para invitar jugadores.');
        return;
      }
      
      const isCaptain = myTeam.captainId === authUser?.id;
      const isSubcaptain = myTeam.subcaptainIds?.includes(authUser?.id || '');
      
      if (!isCaptain && !isSubcaptain) {
        alert('Solo el Capitán y los Subcapitanes pueden reclutar jugadores.');
        return;
      }
    }

    setInviteType(type);
    setIsInviteSuccess(true);
    setTimeout(() => {
      setInviteTarget(null);
      setIsInviteSuccess(false);
      setInviteMessage('');
    }, 2000);
  };

  return (
    <div className="mj-mercado">
      <div className="mj-mercado-header">
        <h1>Mercado de Fichajes</h1>
        <p>Recluta agentes libres o encuentra tu equipo ideal</p>
      </div>



          <div className="mj-mercado-filters">
        <div className="mj-filter-group">
          <h3>Provincia</h3>
          <div className="mj-filter-pills">
            <button 
              className={`mj-filter-pill ${selectedCity === null ? 'active' : ''}`}
              onClick={() => setSelectedCity(null)}
            >
              Todas
            </button>
            {CITIES.map(city => (
              <button 
                key={city}
                className={`mj-filter-pill ${selectedCity === city ? 'active' : ''}`}
                onClick={() => setSelectedCity(city)}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        <div className="mj-filter-group">
          <h3>Posición</h3>
          <div className="mj-filter-pills">
            <button 
              className={`mj-filter-pill ${selectedPosition === null ? 'active' : ''}`}
              onClick={() => setSelectedPosition(null)}
            >
              Todas
            </button>
            {POSITIONS.map(pos => (
              <button 
                key={pos}
                className={`mj-filter-pill ${selectedPosition === pos ? 'active' : ''}`}
                onClick={() => setSelectedPosition(pos)}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mj-agents-grid">
        {filteredAgents.length === 0 ? (
          <div className="mj-empty-state">
            <Search size={48} />
            <h3>Sin resultados</h3>
            <p>No hay agentes libres con estos filtros.</p>
          </div>
        ) : (
          filteredAgents.map(agent => (
            <div key={agent.id} className="mj-agent-card">
              <div className="mj-agent-info-wrapper">
                <Avatar src={agent.avatarUrl} size="lg" />
                <div className="mj-agent-details">
                  <h3>{agent.name}</h3>
                  <div className="mj-agent-rank" style={{ color: 'var(--color-warning)' }}>
                    <RankIcon tier={agent.rank?.tier || 'Bronce'} size={14} />
                    <span>{agent.rank?.tier || 'Bronce'} {agent.rank?.division || 4}</span>
                  </div>
                  <div className="mj-agent-meta">
                    <span className="mj-badge">
                      <Shield size={12} /> {agent.position}
                    </span>
                    {agent.modality && (
                      <span className="mj-badge">
                        <Activity size={12} /> {agent.modality}
                      </span>
                    )}
                    {agent.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                        <MapPin size={12} /> {agent.location.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mj-agent-actions">
                <Button size="sm" variant="outline" onClick={() => navigate(`/perfil/${agent.id}`)}>
                  Ver Perfil
                </Button>
                <Button size="sm" onClick={() => setInviteTarget(agent)}>
                  Invitar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>


      <Modal
        isOpen={!!inviteTarget}
        onClose={() => {
          setInviteTarget(null);
          setIsInviteSuccess(false);
          setInviteMessage('');
        }}
        title={`Invitar a ${inviteTarget?.name}`}
      >
        {isInviteSuccess ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>¡Invitación Enviada!</h3>
            {inviteType === 'team' ? (
              <p className="text-muted">La invitación a nombre de <strong>{myTeam?.name}</strong> ha sido enviada.</p>
            ) : (
              <p className="text-muted">Invitación para jugar ahora en tu escuadra enviada.</p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', background: 'var(--color-surface-hover)', padding: 'var(--spacing-md)', borderRadius: '12px' }}>
              <Avatar src={inviteTarget?.avatarUrl} size="md" />
              <div>
                <h4 style={{ margin: 0 }}>{inviteTarget?.name}</h4>
                <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>{inviteTarget?.position}</span>
              </div>
            </div>
            
            <div className="mj-input-group">
              <label className="mj-input-label">Mensaje opcional</label>
              <textarea 
                className="mj-input-field" 
                placeholder="Escribe un mensaje para convencerlo..."
                rows={3}
                value={inviteMessage}
                onChange={e => setInviteMessage(e.target.value)}
                style={{ resize: 'none', width: '100%', marginTop: 'var(--spacing-xs)' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              <Button fullWidth onClick={() => handleSendInvite('party')}>
                Invitar a jugar ahora (Escuadra)
              </Button>
              <Button fullWidth variant="outline" onClick={() => handleSendInvite('team')}>
                Reclutar para mi Equipo (Permanente)
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
