import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/Avatar/Avatar';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Modal } from '../../components/Modal/Modal';
import { Trophy, ChevronRight, Activity, Users, Settings, LogOut, ClipboardList, Link, UserPlus, QrCode, Copy, CheckCheck, X } from 'lucide-react';
import { mockTeams } from '../../../data/mockData';
import { useAuth } from '../../../core/contexts/AuthContext';
import '../PerfilJugador/PerfilJugador.css'; // Reusing some CSS
import './PerfilEquipo.css'; // New CSS for team profile specific styles

export const PerfilEquipo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, updateProfile } = useAuth();
  
  const team = mockTeams.find(t => t.id === id);
  
  const [hasRequested, setHasRequested] = useState(false);

  React.useEffect(() => {
    // Si el equipo no existe en la base de datos local pero el usuario lo tiene asignado (por error de sync)
    if (!team && currentUser && currentUser.teamId === id) {
      updateProfile({ teamId: undefined }).then(() => {
        navigate('/mi-equipo');
      });
    }
  }, [team, currentUser, id, navigate, updateProfile]);

  if (!currentUser) return null;
  
  if (!team) {
    return (
      <div className="mj-perfil" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 'var(--spacing-xl)' }}>
        <h2 style={{ textAlign: 'center' }}>Equipo no encontrado</h2>
        <p className="text-muted" style={{ textAlign: 'center', marginTop: 'var(--spacing-sm)' }}>El equipo que buscas no existe o fue eliminado.</p>
        <Button onClick={() => navigate('/mercado')} style={{ marginTop: 'var(--spacing-lg)' }}>Volver al Mercado</Button>
      </div>
    );
  }

  const isCaptain = team.captainId === currentUser.id;
  const isSubcaptain = team.subcaptainIds?.includes(currentUser.id);
  const isMember = team.players.some(p => p.id === currentUser.id);

  const [managingPlayer, setManagingPlayer] = useState<any>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [, forceUpdate] = useState(0);

  const inviteLink = `${window.location.origin}/equipo/${team.id}`;

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2500);
    } catch (err) {
      console.error('Error copying link:', err);
    }
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Únete a ${team.name} en Mejengas`, url: inviteLink });
      } else {
        handleCopyInviteLink();
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleJoinRequest = () => {
    if (!team.joinRequests.find(u => u.id === currentUser.id)) {
      team.joinRequests.push(currentUser);
      localStorage.setItem('mejengas_db_teams', JSON.stringify(mockTeams));
    }
    setHasRequested(true);
  };

  const handleApproveRequest = async (applicant: any) => {
    team.joinRequests = team.joinRequests.filter(u => u.id !== applicant.id);
    team.players.push({ ...applicant, teamId: team.id });
    localStorage.setItem('mejengas_db_teams', JSON.stringify(mockTeams));
    forceUpdate(n => n + 1);
  };

  const handleRejectRequest = (applicant: any) => {
    team.joinRequests = team.joinRequests.filter(u => u.id !== applicant.id);
    localStorage.setItem('mejengas_db_teams', JSON.stringify(mockTeams));
    forceUpdate(n => n + 1);
  };

  const handleLeaveTeam = async () => {
    if (window.confirm('¿Seguro que quieres salir de este equipo?')) {
      const playerIndex = team.players.findIndex(p => p.id === currentUser.id);
      if (playerIndex !== -1) {
        team.players.splice(playerIndex, 1);
      }

      // Si el equipo quedó sin miembros, eliminarlo del array global
      if (team.players.length === 0) {
        const teamIndex = mockTeams.findIndex(t => t.id === team.id);
        if (teamIndex !== -1) {
          mockTeams.splice(teamIndex, 1);
        }
      }

      localStorage.setItem('mejengas_db_teams', JSON.stringify(mockTeams));
      await updateProfile({ teamId: null });
      alert('Has salido del equipo.');
      navigate('/mercado');
    }
  };


  const handleToggleSubcaptain = (playerId: string) => {
    if (!team.subcaptainIds) team.subcaptainIds = [];
    
    const isSub = team.subcaptainIds.includes(playerId);
    if (isSub) {
      team.subcaptainIds = team.subcaptainIds.filter(id => id !== playerId);
    } else {
      team.subcaptainIds.push(playerId);
    }
    
    // Persistir el cambio
    localStorage.setItem('mejengas_db_teams', JSON.stringify(mockTeams));
    setManagingPlayer(null);
  };

  return (
    <>
      <div className="mj-perfil">
        <div className="mj-perfil__header" style={{ position: 'relative' }}>
          {isCaptain && (
            <button
              onClick={() => setIsRequestsModalOpen(true)}
              style={{
                position: 'absolute', top: 0, right: 0,
                background: 'var(--color-surface-hover)',
                border: `1px solid ${team.joinRequests.length > 0 ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: '12px', padding: '6px 10px',
                display: 'flex', alignItems: 'center', gap: '6px',
                cursor: 'pointer',
                color: team.joinRequests.length > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)', fontWeight: 600, transition: 'all 0.2s'
              }}
            >
              <ClipboardList size={16} />
              {team.joinRequests.length > 0 && (
                <span style={{ background: 'var(--color-primary)', color: '#000', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>
                  {team.joinRequests.length}
                </span>
              )}
            </button>
          )}
          <Avatar src={team.shieldUrl} size="xl" isTeam />
          <div className="mj-perfil__info">
            <h2>{team.name}</h2>
            <div className="mj-perfil__rating" style={{ marginBottom: '4px' }}>
              <Trophy size={16} className="icon-star" fill="currentColor" />
              <span>{team.points} Puntos</span>
            </div>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)' }}>
              {team.description}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <span className="mj-badge">
                <Activity size={12} /> {team.modality}
              </span>
              <span className="mj-badge">
                <Users size={12} /> {team.players.length}/{team.maxPlayers} Miembros
              </span>
            </div>
          </div>
        </div>

        <div className="mj-perfil__actions" style={{ flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {isCaptain ? (
            <>
              <Button fullWidth variant="outline" onClick={() => alert('Editar información del equipo')}>
                <Settings size={18} style={{ marginRight: '8px' }} /> Editar Equipo
              </Button>
              <Button fullWidth variant="outline" onClick={() => setIsInviteModalOpen(true)} leftIcon={<UserPlus size={18} />}>
                Invitar al Equipo
              </Button>
              <Button fullWidth variant="danger" onClick={handleLeaveTeam}>
                <LogOut size={18} style={{ marginRight: '8px' }} /> Salir del Equipo
              </Button>
            </>
          ) : isSubcaptain ? (
            <>
              <Button fullWidth variant="outline" onClick={() => setIsInviteModalOpen(true)} leftIcon={<UserPlus size={18} />}>
                Invitar al Equipo
              </Button>
              <Button fullWidth variant="danger" onClick={handleLeaveTeam}>
                <LogOut size={18} style={{ marginRight: '8px' }} /> Salir del Equipo
              </Button>
            </>
          ) : isMember ? (
            <Button fullWidth variant="danger" onClick={handleLeaveTeam}>
              <LogOut size={18} style={{ marginRight: '8px' }} /> Salir del Equipo
            </Button>
          ) : (
            <Button
              fullWidth
              variant={hasRequested ? "outline" : "primary"}
              onClick={hasRequested ? undefined : handleJoinRequest}
              disabled={hasRequested || team.players.length >= team.maxPlayers}
            >
              {hasRequested ? 'Solicitud Pendiente ✓' : team.players.length >= team.maxPlayers ? 'Equipo Lleno' : 'Solicitar Unirse'}
            </Button>
          )}
        </div>

        <div className="mj-perfil__stats">
          <Card className="mj-stat-card">
            <div className="mj-stat-value text-success">{team.wins}</div>
            <div className="mj-stat-label">Victorias</div>
          </Card>
          <Card className="mj-stat-card">
            <div className="mj-stat-value text-warning">{team.draws}</div>
            <div className="mj-stat-label">Empates</div>
          </Card>
          <Card className="mj-stat-card">
            <div className="mj-stat-value text-danger">{team.losses}</div>
            <div className="mj-stat-label">Derrotas</div>
          </Card>
        </div>

        <div className="mj-perfil__history">
          <h3>Plantilla ({team.players.length}/{team.maxPlayers})</h3>
          <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-sm)' }}>
            {isCaptain ? 'Toca a un jugador para gestionar su rol.' : 'Lista oficial del equipo.'}
          </p>
          <Card glass>
            {team.players.length === 0 ? (
              <div className="text-muted" style={{textAlign: 'center', padding: '1rem'}}>
                No hay jugadores visibles
              </div>
            ) : (
              team.players.map(player => (
                <div 
                  key={player.id} 
                  className="mj-history-item" 
                  style={{alignItems: 'center', cursor: 'pointer'}}
                  onClick={() => {
                    if (isCaptain && player.id !== currentUser.id) {
                      setManagingPlayer(player);
                    } else {
                      navigate(`/perfil/${player.id}`);
                    }
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <Avatar src={player.avatarUrl} size="sm" />
                    <div>
                      <span className="mj-history-item__match" style={{ display: 'block' }}>{player.name}</span>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>{player.position}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    {team.captainId === player.id ? (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-warning)', fontWeight: 'bold' }}>CAPITÁN</span>
                    ) : team.subcaptainIds?.includes(player.id) ? (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-secondary)', fontWeight: 'bold' }}>SUBCAPITÁN</span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>MIEMBRO</span>
                    )}
                    <ChevronRight size={16} className="text-muted" />
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      <Modal isOpen={isRequestsModalOpen} onClose={() => setIsRequestsModalOpen(false)} title={`Solicitudes de Ingreso (${team.joinRequests.length})`}>
        {team.joinRequests.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '1rem 0' }}>No hay solicitudes pendientes.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {team.joinRequests.map(applicant => (
              <div key={applicant.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', background: 'var(--color-surface-hover)', padding: 'var(--spacing-md)', borderRadius: '12px' }}>
                <Avatar src={applicant.avatarUrl} size="sm" />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, display: 'block' }}>{applicant.name}</span>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>{applicant.position}</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                  <Button size="sm" onClick={() => handleApproveRequest(applicant)}>✓</Button>
                  <Button size="sm" variant="danger" onClick={() => handleRejectRequest(applicant)}>✕</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!managingPlayer} onClose={() => setManagingPlayer(null)} title="Gestionar Jugador">
        {managingPlayer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', background: 'var(--color-surface-hover)', padding: 'var(--spacing-md)', borderRadius: '12px' }}>
              <Avatar src={managingPlayer.avatarUrl} size="md" />
              <div>
                <h4 style={{ margin: 0 }}>{managingPlayer.name}</h4>
                <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
                  {team.subcaptainIds?.includes(managingPlayer.id) ? 'Rol Actual: SUBCAPITÁN' : 'Rol Actual: MIEMBRO'}
                </span>
              </div>
            </div>
            <Button onClick={() => { setManagingPlayer(null); navigate(`/perfil/${managingPlayer.id}`); }}>
              Ver Perfil Completo
            </Button>
            {team.subcaptainIds?.includes(managingPlayer.id) ? (
              <Button variant="outline" onClick={() => handleToggleSubcaptain(managingPlayer.id)}>Quitar rol de Subcapitán</Button>
            ) : (
              <Button style={{ background: 'var(--color-secondary)', color: 'white' }} onClick={() => handleToggleSubcaptain(managingPlayer.id)}>Ascender a Subcapitán</Button>
            )}
          </div>
        )}
      </Modal>

      {/* ── Invite Link Modal (share sheet style) ── */}
      {isInviteModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 0 env(safe-area-inset-bottom, 16px) 0',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => { setIsInviteModalOpen(false); setIsLinkCopied(false); }}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: '20px 20px 0 0',
              padding: 'var(--spacing-lg)',
              width: '100%',
              maxWidth: '480px',
              boxSizing: 'border-box',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
              animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <div style={{ background: 'var(--color-surface-hover)', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Link size={18} style={{ color: 'var(--color-primary)' }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>Compartir vínculo</span>
              </div>
              <button
                onClick={() => { setIsInviteModalOpen(false); setIsLinkCopied(false); }}
                style={{ background: 'var(--color-surface-hover)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Link Preview Card */}
            <div
              style={{
                background: 'var(--color-surface-hover)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: 'var(--spacing-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)'
              }}
            >
              <div
                style={{
                  background: 'var(--color-bg)',
                  borderRadius: '10px',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Link size={20} style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Únete a {team.name} en Mejengas
                </p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {inviteLink}
                </p>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexShrink: 0 }}>
                {/* QR placeholder (decorative) */}
                <button
                  title="Código QR (próximamente)"
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    width: '40px', height: '40px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--color-text-muted)'
                  }}
                >
                  <QrCode size={18} />
                </button>

                {/* Copy link */}
                <button
                  onClick={handleCopyInviteLink}
                  title="Copiar enlace"
                  style={{
                    background: isLinkCopied ? 'var(--color-success, #22c55e)' : 'var(--color-primary)',
                    border: 'none',
                    borderRadius: '10px',
                    width: '40px', height: '40px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    color: isLinkCopied ? '#fff' : 'var(--color-bg)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isLinkCopied ? <CheckCheck size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {/* Native share button */}
            <button
              onClick={handleNativeShare}
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                background: 'var(--color-primary)',
                color: 'var(--color-bg)',
                border: 'none',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: 'var(--font-size-base)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'opacity 0.2s'
              }}
            >
              <UserPlus size={18} />
              Compartir invitación
            </button>
          </div>
        </div>
      )}
    </>
  );
};
