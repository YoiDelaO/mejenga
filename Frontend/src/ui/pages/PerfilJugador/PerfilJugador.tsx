import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar/Avatar';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Star, Shield, Award, MapPin, LogOut, Activity, Camera, Settings, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import { mockUsers, mockTeams } from '../../../data/mockData';
import { useAuth } from '../../../core/contexts/AuthContext';
import { ImageCropperModal } from '../../components/ImageCropper/ImageCropperModal';
import { EditProfileModal } from '../../components/EditProfileModal/EditProfileModal';
import { RankIcon } from '../../components/RankIcon/RankIcon';
import { CrearEquipoModal } from '../../components/CrearEquipoModal/CrearEquipoModal';
import { Modal } from '../../components/Modal/Modal';
import type { User } from '../../../core/types';
import './PerfilJugador.css';

export const PerfilJugador: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: authUser, logout, updateProfile } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdvancedStatsOpen, setIsAdvancedStatsOpen] = useState(false);
  const [isCrearEquipoOpen, setIsCrearEquipoOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviteSuccess, setIsInviteSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImageForCrop(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBase64: string) => {
    setSelectedImageForCrop(null);
    setIsUpdatingAvatar(true);
    if (authUser?.id === user?.id) {
      await updateProfile({ avatarUrl: croppedBase64 });
    }
    setIsUpdatingAvatar(false);
  };

  const handleEditProfileSave = async (updates: Partial<User>) => {
    if (authUser?.id === user?.id) {
      await updateProfile(updates);
    }
  };

  useEffect(() => {
    if (id && authUser && id === authUser.id) {
      setUser(authUser);
      return;
    }

    if (id) {
      const localUsersStr = localStorage.getItem('mejengas_db_users');
      const localUsers: User[] = localUsersStr ? JSON.parse(localUsersStr) : [];
      const found = localUsers.find(u => u.id === id) || mockUsers.find(u => u.id === id);
      
      if (found) {
        setUser(found);
        return;
      }
    }
    
    setUser(authUser || mockUsers[0]);
  }, [id, authUser]);

  if (!user) return null;

  const userHistory = user.recentHistory || [];
  const totalMvps = userHistory.filter(match => match.isMvp).length;
  
  let wins = 0;
  let draws = 0;
  let losses = 0;
  userHistory.forEach(match => {
    if (match.userScore > match.rivalScore) wins++;
    else if (match.userScore === match.rivalScore) draws++;
    else losses++;
  });

  // ── Lógica de Honor ──
  const honorStats = JSON.parse(localStorage.getItem('mejengas_honor_stats') || '{}')[user.id] || { totalStars: 0, count: 0, tags: {} };
  const avgStars = honorStats.count > 0 ? (honorStats.totalStars / honorStats.count).toFixed(1) : '0.0';
  const totalHonors = honorStats.count;
  
  const honorLevelData = (count: number) => {
    if (count >= 100) return { level: 5, label: 'Leyenda Fair Play', color: '#ff00ff' };
    if (count >= 50)  return { level: 4, label: 'Ejemplar', color: '#00ccff' };
    if (count >= 25)  return { level: 3, label: 'Respetado', color: 'var(--color-primary)' };
    if (count >= 10)  return { level: 2, label: 'Buen Rival', color: '#ffcc00' };
    return { level: 1, label: 'Neutral', color: 'var(--color-text-muted)' };
  };
  const hLevel = honorLevelData(totalHonors);

  // Obtener top tags
  const tagsEntry = honorStats.tags || {};
  const topTags = Object.entries(tagsEntry)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 3);

  return (
    <>
      <div className="mj-perfil">
        <div className="mj-perfil__header">
          {authUser?.id === user.id && (
            <button className="mj-perfil__edit-top-btn" onClick={() => setIsEditModalOpen(true)}>
              <Settings size={24} />
            </button>
          )}
          
          <div className="mj-perfil__avatar-wrapper">
            <Avatar src={user.avatarUrl} size="xl" />
            {authUser?.id === user.id && (
              <label className={`mj-perfil__avatar-edit ${isUpdatingAvatar ? 'loading' : ''}`}>
                <Camera size={16} />
                <input type="file" accept="image/*" onChange={handleFileSelect} hidden disabled={isUpdatingAvatar} />
              </label>
            )}
          </div>
          <div className="mj-perfil__info">
            <h2>{user.name}{user.age ? `, ${user.age}` : ''}</h2>
            
            <div className="mj-perfil__tags">
              <span className="mj-badge mj-badge--gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Star size={12} fill="currentColor" /> {user.position}
              </span>
              {user.secondaryPosition && (
                <span className="mj-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Sec: {user.secondaryPosition}
                </span>
              )}
            </div>
            
            {user.modality && (
              <p className="mj-perfil__modality text-muted">
                Modalidad: <strong>{user.modality}</strong>
              </p>
            )}

            {user.location && (
              <p className="mj-perfil__location text-muted">
                <MapPin size={14} /> 
                {user.location.city}, {user.location.country}
              </p>
            )}

            <div className="mj-perfil__rating" style={{ color: 'var(--color-warning)' }}>
              <RankIcon tier={user.rank?.tier || 'Bronce'} size={18} className="icon-star" />
              <span>{user.rank ? `${user.rank.tier} ${user.rank.division}` : 'Bronce 4'}</span>
            </div>
          </div>
        </div>

        <div className="mj-perfil__actions">
          {authUser?.id === user.id ? (
            <>
              {!user.teamId ? (
                <Button fullWidth onClick={() => setIsCrearEquipoOpen(true)}>
                  Fundar Equipo
                </Button>
              ) : (
                <Button fullWidth variant="outline" onClick={() => window.location.href = `/equipo/${user.teamId}`}>
                  Mi Equipo
                </Button>
              )}
              <Button fullWidth variant="danger" onClick={logout} leftIcon={<LogOut size={18} />}>
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <Button fullWidth onClick={() => setIsInviteModalOpen(true)}>Invitar al Equipo</Button>
          )}
        </div>

        <div className="mj-perfil__stats">
          <Card className="mj-stat-card">
            <Activity size={24} className="mj-stat-icon text-primary" />
            <div className="mj-stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '8px', fontSize: '1.2rem' }}>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}><span style={{fontSize: '0.6em', color: 'var(--color-text-muted)'}}>5v5:</span> {user.matchesPlayed}</span>
              <span style={{ color: 'var(--color-border)' }}>|</span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}><span style={{fontSize: '0.6em', color: 'var(--color-text-muted)'}}>7v7:</span> 0</span>
            </div>
            <div className="mj-stat-label">Mejengas</div>
          </Card>
          
          <Card className="mj-stat-card">
            <ClipboardList size={24} className="mj-stat-icon text-muted" />
            <div className="mj-stat-value" style={{ display: 'flex', gap: '6px', fontSize: '1.1rem' }}>
              <span className="text-success">{wins}V</span>
              <span className="text-muted">{draws}E</span>
              <span className="text-danger">{losses}D</span>
            </div>
            <div className="mj-stat-label">Récord</div>
          </Card>

          <Card className="mj-stat-card">
            <Award size={24} className="mj-stat-icon text-secondary" />
            <div className="mj-stat-value">{totalMvps}</div>
            <div className="mj-stat-label">MVP</div>
          </Card>
          
          <Card className="mj-stat-card">
            <Shield size={24} className="mj-stat-icon text-warning" />
            <div className="mj-stat-value" style={{ fontSize: '1.1rem' }}>{user.isFreeAgent ? 'Libre' : 'Fichado'}</div>
            <div className="mj-stat-label">Estado</div>
          </Card>
        </div>

        <Button 
          variant="outline" 
          fullWidth 
          onClick={() => setIsAdvancedStatsOpen(!isAdvancedStatsOpen)}
          rightIcon={isAdvancedStatsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        >
          {isAdvancedStatsOpen ? 'Ocultar Estadísticas Detalladas' : 'Ver Estadísticas Detalladas'}
        </Button>

        {isAdvancedStatsOpen && (
          <Card glass className="mj-perfil__advanced-stats">
            <div className="mj-advanced-stat-row">
              <span>Goles</span>
              <strong>{user.goals || 0}</strong>
            </div>
            <div className="mj-advanced-stat-row">
              <span>Asistencias</span>
              <strong>{user.assists || 0}</strong>
            </div>
            <div className="mj-advanced-stat-row">
              <span>Tiros al arco</span>
              <strong>{user.advancedStats?.shotsOnTarget || 0}</strong>
            </div>
            <div className="mj-advanced-stat-row">
              <span>Pases efectivos</span>
              <strong>{user.advancedStats?.effectivePasses || 0}</strong>
            </div>
            <div className="mj-advanced-stat-row">
              <span>Recuperaciones</span>
              <strong>{user.advancedStats?.recoveries || 0}</strong>
            </div>
            <div className="mj-advanced-stat-row">
              <span>Intercepciones</span>
              <strong>{user.advancedStats?.interceptions || 0}</strong>
            </div>
            <div className="mj-advanced-stat-row">
              <span>Despejes</span>
              <strong>{user.advancedStats?.clearances || 0}</strong>
            </div>
            <div className="mj-advanced-stat-row">
              <span>Duelos ganados</span>
              <strong>{user.advancedStats?.duelsWon || 0}</strong>
            </div>
            <div className="mj-advanced-stat-row">
              <span>Atajadas</span>
              <strong>{user.advancedStats?.saves || 0}</strong>
            </div>
            <div className="mj-advanced-stat-row">
              <span>Goles recibidos</span>
              <strong>{user.advancedStats?.goalsConceded || 0}</strong>
            </div>
            <div className="mj-advanced-stat-row">
              <span>Porterías en cero</span>
              <strong>{user.advancedStats?.cleanSheets || 0}</strong>
            </div>
          </Card>
        )}

        {/* ── SECCIÓN DE HONOR ── */}
        <div className="mj-perfil__honor" style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
            <h3 style={{ margin: 0 }}>Reputación y Honor</h3>
            <span style={{ color: hLevel.color, fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {hLevel.label}
            </span>
          </div>
          
          <Card glass style={{ padding: 'var(--spacing-md)', border: `1px solid ${hLevel.color}44`, background: `linear-gradient(135deg, ${hLevel.color}08 0%, rgba(0,0,0,0) 100%)` }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', minWidth: '80px', borderRight: '1px solid var(--color-border)', paddingRight: 'var(--spacing-md)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-primary)' }}>{avgStars}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginBottom: '4px' }}>
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={10} fill={Number(avgStars) >= s ? 'var(--color-primary)' : 'none'} color="var(--color-primary)" />
                  ))}
                </div>
                <div className="text-muted" style={{ fontSize: '0.65rem' }}>{totalHonors} valoraciones</div>
              </div>

              <div style={{ flex: 1 }}>
                <label className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '8px' }}>Atributos Destacados</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {topTags.length > 0 ? topTags.map(([tag, count]: any) => (
                    <span key={tag} className="mj-badge" style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(0,255,135,0.05)', borderColor: 'var(--color-primary)' }}>
                      {tag} <span style={{ opacity: 0.6, marginLeft: '4px' }}>x{count}</span>
                    </span>
                  )) : <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>Aún no hay tags destacados</p>}
                </div>
              </div>
            </div>
            
            {/* Nivel de Honor Progress */}
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
                <span className="text-muted">Nivel de Honor {hLevel.level}</span>
                <span style={{ color: hLevel.color }}>{totalHonors} / {hLevel.level === 5 ? '∞' : [10, 25, 50, 100][hLevel.level - 1]}</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  background: hLevel.color, 
                  width: `${Math.min(100, (totalHonors / (hLevel.level === 5 ? totalHonors : [10, 25, 50, 100][hLevel.level - 1])) * 100)}%`,
                  transition: 'width 1s ease'
                }} />
              </div>
            </div>
          </Card>
        </div>

        <div className="mj-perfil__history">
          <h3>Historial Reciente</h3>
          <Card glass>
            {userHistory.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', margin: 'var(--spacing-md) 0' }}>No hay partidos recientes</p>
            ) : (
              userHistory.map((match, i) => {
                const isWin = match.userScore > match.rivalScore;
                const isDraw = match.userScore === match.rivalScore;
                const resultText = isWin ? 'Victoria' : isDraw ? 'Empate' : 'Derrota';
                const resultColor = isWin ? 'text-success' : isDraw ? 'text-muted' : 'text-danger';

                return (
                  <div key={i} className="mj-history-item" style={{ alignItems: 'center' }}>
                    <div className="mj-history-item__match" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {match.modality}
                      {match.isMvp && <span title="MVP del Partido" style={{ display: 'inline-flex' }}><Award size={16} className="text-secondary" /></span>}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
                      <div style={{ fontWeight: '800', letterSpacing: '2px', fontSize: '1.1rem' }}>
                        {match.userScore} - {match.rivalScore}
                      </div>
                      <div className={`mj-history-item__result ${resultColor}`} style={{ minWidth: '65px', textAlign: 'right', fontWeight: 'bold' }}>
                        {resultText}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </div>
      </div>

      {selectedImageForCrop && (
        <ImageCropperModal
          isOpen={!!selectedImageForCrop}
          onClose={() => setSelectedImageForCrop(null)}
          imageSrc={selectedImageForCrop}
          onCropComplete={handleCropComplete}
        />
      )}

      {user && authUser?.id === user.id && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
          onSave={handleEditProfileSave}
        />
      )}

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
          window.location.href = `/equipo/${newTeamId}`;
        }} 
      />
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInviteMessage('');
          setIsInviteSuccess(false);
        }}
        title={`Invitar a ${user.name}`}
      >
        {isInviteSuccess ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>¡Invitación Enviada!</h3>
            <p className="text-muted">La solicitud de reclutamiento fue enviada a <strong>{user.name}</strong>.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', background: 'var(--color-surface-hover)', padding: 'var(--spacing-md)', borderRadius: '12px' }}>
              <Avatar src={user.avatarUrl} size="md" />
              <div>
                <h4 style={{ margin: 0 }}>{user.name}</h4>
                <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>{user.position}</span>
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

            <Button
              fullWidth
              onClick={() => {
                const myTeam = mockTeams.find(t => t.id === authUser?.teamId);
                if (!myTeam) {
                  alert('Debes pertenecer a un equipo para reclutar jugadores.');
                  return;
                }
                const isCaptain = myTeam.captainId === authUser?.id;
                const isSubcaptain = myTeam.subcaptainIds?.includes(authUser?.id || '');
                if (!isCaptain && !isSubcaptain) {
                  alert('Solo el Capitán y los Subcapitanes pueden reclutar jugadores.');
                  return;
                }
                setIsInviteSuccess(true);
                setTimeout(() => {
                  setIsInviteModalOpen(false);
                  setIsInviteSuccess(false);
                  setInviteMessage('');
                }, 2000);
              }}
            >
              Reclutar para mi Equipo (Permanente)
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
};
