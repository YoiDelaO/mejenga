import React, { useState } from 'react';
import { Card } from '../../components/Card/Card';
import { Avatar } from '../../components/Avatar/Avatar';
import { mockTeams, mockUsers } from '../../../data/mockData';
import { Trophy, Users, User } from 'lucide-react';
import { RankIcon } from '../../components/RankIcon/RankIcon';
import { useAuth } from '../../../core/contexts/AuthContext';
import './Ranking.css';

export const Ranking: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'equipos' | 'solo'>('equipos');
  const [regionScope, setRegionScope] = useState<'Mundial' | 'Nacional' | 'Regional' | 'Local'>('Mundial');

  // Equipos activos filtrados y ordenados
  const filteredTeams = [...mockTeams].filter(team => {
    if (team.players.length === 0) return false;
    if (regionScope === 'Mundial') return true;
    
    const captain = mockUsers.find(u => u.id === team.captainId);
    const teamLocation = captain?.location;
    if (!user?.location || !teamLocation) return false;

    if (regionScope === 'Nacional') return teamLocation.countryId === user.location.countryId;
    if (regionScope === 'Regional') return teamLocation.regionId === user.location.regionId;
    if (regionScope === 'Local') return teamLocation.localityId === user.location.localityId;
    return true;
  });

  const sortedTeams = filteredTeams.sort((a, b) => b.points - a.points);

  // Función para calcular un puntaje numérico basado en el rango
  const getRankScore = (rank?: typeof mockUsers[0]['rank']) => {
    if (!rank) return 0;
    const TIER_VALUES: Record<string, number> = {
      'Bronce': 1000,
      'Plata': 2000,
      'Oro': 3000,
      'Platino': 4000,
      'Diamante': 5000,
      'Elite': 6000,
      'Leyenda': 7000
    };
    return (TIER_VALUES[rank.tier] || 0) + ((4 - rank.division) * 100) + rank.points;
  };

  // Usuarios filtrados y ordenados para Ranked Solo
  const filteredUsers = [...mockUsers].filter(u => {
    if (regionScope === 'Mundial') return true;
    if (!user?.location || !u.location) return false;
    
    if (regionScope === 'Nacional') return u.location.countryId === user.location.countryId;
    if (regionScope === 'Regional') return u.location.regionId === user.location.regionId;
    if (regionScope === 'Local') return u.location.localityId === user.location.localityId;
    return true;
  });

  const sortedUsers = filteredUsers.sort((a, b) => getRankScore(b.rank) - getRankScore(a.rank));

  return (
    <div className="mj-ranking">
      <div className="mj-ranking__header">
        <Trophy size={48} className="mj-ranking__icon" />
        <h2>Ranking {regionScope}</h2>
        <p className="text-muted" style={{ marginBottom: '16px' }}>
          {activeTab === 'equipos' ? 'Los mejores equipos' : 'Los mejores jugadores'} 
          {regionScope === 'Nacional' && user?.location?.countryName ? ` de ${user.location.countryName}` : ''}
          {regionScope === 'Regional' && user?.location?.regionName ? ` de ${user.location.regionName}` : ''}
          {regionScope === 'Local' && user?.location?.localityName ? ` de ${user.location.localityName}` : ''}
        </p>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', width: '100%', justifyContent: 'center' }} className="mj-scrollbar-hide">
          {(['Mundial', 'Nacional', 'Regional', 'Local'] as const).map(scope => (
            <button
              key={scope}
              onClick={() => setRegionScope(scope)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: '1px solid var(--color-border)',
                background: regionScope === scope ? 'var(--color-primary)' : 'transparent',
                color: regionScope === scope ? '#000' : 'var(--color-text)',
                fontSize: '0.85rem',
                fontWeight: regionScope === scope ? 'bold' : 'normal',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {scope}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'var(--color-surface)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
        <button
          onClick={() => setActiveTab('equipos')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            background: activeTab === 'equipos' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'equipos' ? '#000' : 'var(--color-text)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <Users size={18} /> Equipos
        </button>
        <button
          onClick={() => setActiveTab('solo')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            background: activeTab === 'solo' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'solo' ? '#000' : 'var(--color-text)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <User size={18} /> Ranked Solo
        </button>
      </div>

      <div className="mj-ranking__list">
        {activeTab === 'equipos' ? (
          <>
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
          </>
        ) : (
          <>
            <div className="mj-ranking__list-header">
              <span>Pos</span>
              <span>Jugador</span>
              <span>Rango</span>
            </div>
            
            {sortedUsers.map((user, index) => (
              <Card key={user.id} className="mj-ranking__item" hoverable>
                <div className="mj-ranking__pos">
                  {index + 1}
                </div>
                <div className="mj-ranking__team" style={{ flex: 1 }}>
                  <Avatar src={user.avatarUrl} size="sm" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="mj-ranking__team-name">{user.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      ★ {user.rating.toFixed(1)} Reputación
                    </div>
                  </div>
                </div>
                <div className="mj-ranking__points" style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                  {user.rank && <RankIcon tier={user.rank.tier} size={18} />}
                  <span>{user.rank?.tier} {user.rank?.division}</span>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
