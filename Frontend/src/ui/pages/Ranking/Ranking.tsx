import React from 'react';
import { Card } from '../../components/Card/Card';
import { Avatar } from '../../components/Avatar/Avatar';
import { mockTeams } from '../../../data/mockData';
import { Trophy } from 'lucide-react';
import './Ranking.css';

export const Ranking: React.FC = () => {
  // Equipos activos (al menos 1 miembro) ordenados por puntos
  const sortedTeams = [...mockTeams]
    .filter(team => team.players.length > 0)
    .sort((a, b) => b.points - a.points);

  return (
    <div className="mj-ranking">
      <div className="mj-ranking__header">
        <Trophy size={48} className="mj-ranking__icon" />
        <h2>Ranking Global</h2>
        <p className="text-muted">Los mejores equipos de la liga</p>
      </div>

      <div className="mj-ranking__list">
        <div className="mj-ranking__list-header">
          <span>Pos</span>
          <span>Equipo</span>
          <span>Pts</span>
        </div>
        
        {sortedTeams.map((team, index) => (
          <Card key={team.id} className="mj-ranking__item" hoverable>
            <div className="mj-ranking__pos">
              {index + 1}
            </div>
            <div className="mj-ranking__team">
              <Avatar src={team.shieldUrl} size="sm" isTeam />
              <span className="mj-ranking__team-name">{team.name}</span>
            </div>
            <div className="mj-ranking__points">
              {team.points}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
