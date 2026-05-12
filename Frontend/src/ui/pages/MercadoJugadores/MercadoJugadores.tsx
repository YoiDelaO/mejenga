import React from 'react';
import { Card } from '../../components/Card/Card';
import { Avatar } from '../../components/Avatar/Avatar';
import { Button } from '../../components/Button/Button';
import { mockUsers } from '../../../data/mockData';
import { Star, Filter } from 'lucide-react';
import './MercadoJugadores.css';

export const MercadoJugadores: React.FC = () => {
  const freeAgents = mockUsers.filter(u => u.isFreeAgent);

  return (
    <div className="mj-mercado">
      <div className="mj-mercado__header">
        <h2>Mercado de Jugadores</h2>
        <p className="text-muted">Ficha talento para tu equipo</p>
      </div>

      <div className="mj-mercado__filters">
        <Button variant="secondary" size="sm" leftIcon={<Filter size={16} />}>Posición</Button>
        <Button variant="ghost" size="sm">Cerca de mí</Button>
      </div>

      <div className="mj-mercado__list">
        {freeAgents.map(player => (
          <Card key={player.id} className="mj-mercado-card" hoverable glass>
            <div className="mj-mercado-card__header">
              <Avatar src={player.avatarUrl} size="lg" />
              <div className="mj-mercado-card__info">
                <h3>{player.name}</h3>
                <span className="mj-badge">{player.position}</span>
                <div className="mj-mercado-card__rating">
                  <Star size={14} className="icon-star" fill="currentColor" />
                  <span>{player.rating} / 5</span>
                </div>
              </div>
            </div>
            <div className="mj-mercado-card__actions">
              <Button size="sm" fullWidth>Ofrecer Contrato</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
