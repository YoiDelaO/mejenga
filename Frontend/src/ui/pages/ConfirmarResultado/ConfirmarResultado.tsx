import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { Avatar } from '../../components/Avatar/Avatar';
import { mockMatches, mockTeams } from '../../../data/mockData';
import './ConfirmarResultado.css';

export const ConfirmarResultado: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Fallback to first match if not found
  const match = mockMatches.find(m => m.id === matchId) || mockMatches[0];
  const homeTeam = mockTeams.find(t => t.id === match.homeTeamId) || mockTeams[0];
  const awayTeam = mockTeams.find(t => t.id === match.awayTeamId) || mockTeams[1];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/');
    }, 1500);
  };

  return (
    <div className="mj-confirmar">
      <div className="mj-confirmar__header">
        <h2>Reportar Marcador</h2>
        <p className="text-muted">El capitán rival deberá confirmar este resultado.</p>
      </div>

      <form onSubmit={handleSubmit} className="mj-confirmar__form">
        <div className="mj-confirmar__matchup">
          <div className="mj-confirmar__team">
            <Avatar src={homeTeam.shieldUrl} size="lg" isTeam />
            <span>{homeTeam.name}</span>
            <Input type="number" min={0} defaultValue={0} className="mj-score-input" required />
          </div>
          
          <div className="mj-confirmar__vs">VS</div>
          
          <div className="mj-confirmar__team">
            <Avatar src={awayTeam?.shieldUrl} size="lg" isTeam />
            <span>{awayTeam?.name || 'Rival'}</span>
            <Input type="number" min={0} defaultValue={0} className="mj-score-input" required />
          </div>
        </div>

        <div className="mj-input-wrapper" style={{marginTop: '1rem'}}>
          <label className="mj-input-label">Jugador del Partido (MVP)</label>
          <select className="mj-select" required>
            <option value="">Selecciona un jugador...</option>
            <option value="u1">Carlos Ruiz</option>
            <option value="u2">Andrés Gómez</option>
          </select>
        </div>

        <div className="mj-confirmar__actions">
          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            Enviar Resultado
          </Button>
        </div>
      </form>
    </div>
  );
};
