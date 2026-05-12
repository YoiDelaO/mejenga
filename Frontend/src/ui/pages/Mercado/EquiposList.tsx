import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockTeams } from '../../../data/mockData';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Avatar } from '../../components/Avatar/Avatar';
import { Search, Users, Activity, ChevronLeft } from 'lucide-react';
import './Mercado.css';

export const EquiposList: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Solo mostrar equipos con al menos 1 miembro activo
  const filteredTeams = mockTeams.filter(team =>
    team.players.length > 0 &&
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mj-equipos-list">
      {/* Header con botón volver */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'var(--color-surface-hover)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            color: 'var(--color-text)',
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Explorar Equipos</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Encuentra tu equipo ideal</p>
        </div>
      </div>

      <div className="mj-input-container" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <Search className="mj-input-icon mj-input-icon--left" size={18} />
        <input 
          type="text" 
          className="mj-input-field mj-input-field--with-left-icon" 
          placeholder="Buscar equipo por nombre..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="mj-agents-grid">
        {filteredTeams.length === 0 ? (
          <div className="mj-empty-state">
            <Search size={48} />
            <h3>Sin resultados</h3>
            <p>No se encontraron equipos con ese nombre.</p>
          </div>
        ) : (
          filteredTeams.map(team => (
            <div key={team.id} className="mj-agent-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--spacing-md)' }}>
              <div className="mj-agent-info-wrapper">
                <Avatar src={team.shieldUrl} size="lg" isTeam />
                <div className="mj-agent-details">
                  <h3>{team.name}</h3>
                  <div className="mj-agent-meta">
                    <span className="mj-badge">
                      <Activity size={12} /> {team.modality}
                    </span>
                    <span className="mj-badge">
                      <Users size={12} /> {team.players.length}/{team.maxPlayers}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
                {team.description}
              </p>
              
              <div className="mj-agent-actions" style={{ flexDirection: 'row', gap: 'var(--spacing-sm)' }}>
                <Button size="sm" variant="outline" fullWidth onClick={() => navigate(`/equipo/${team.id}`)}>
                  Ver Equipo
                </Button>
                <Button size="sm" fullWidth onClick={() => alert(`Solicitud enviada a ${team.name}`)}>
                  Solicitar Unirse
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
