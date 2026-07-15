import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/contexts/AuthContext';
import { analyzeMatchVideo, type AnalyzeMatchResponse, type FrontendMatchSummary } from '../../../core/services/aiService';
import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { Modal } from '../../components/Modal/Modal';
import { RankIcon } from '../../components/RankIcon/RankIcon';
import { Swords, Users, User, MapPin, CheckCircle2, Video, Camera, Trophy, Star } from 'lucide-react';
import { Avatar } from '../../components/Avatar/Avatar';
import './MatchmakingLobby.css';

// ── SISTEMA DE HONOR ──
interface RivalPlayer {
  id: string;
  name: string;
  avatar?: string;
}

const HONOR_TAGS = ['Fair Play', 'Buen líder', 'Respetuoso', 'Competitivo', 'Buena actitud'];

const HonorScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [ratings, setRatings] = useState<Record<string, { stars: number; tags: string[] }>>({});
  const [isFinished, setIsFinished] = useState(false);

  const rivalPlayers: RivalPlayer[] = [
    { id: 'r1', name: 'Carlos "El Muro"', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos' },
    { id: 'r2', name: 'Dani_7', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dani' },
    { id: 'r3', name: 'Santi Crack', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Santi' }
  ];

  const handleRate = (playerId: string, stars: number) => {
    setRatings(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], stars, tags: prev[playerId]?.tags || [] }
    }));
  };

  const toggleTag = (playerId: string, tag: string) => {
    setRatings(prev => {
      const current = prev[playerId] || { stars: 0, tags: [] };
      const newTags = current.tags.includes(tag)
        ? current.tags.filter(t => t !== tag)
        : [...current.tags, tag];
      return { ...prev, [playerId]: { ...current, tags: newTags } };
    });
  };

  const handleConfirmHonor = () => {
    const existingStats = JSON.parse(localStorage.getItem('mejengas_honor_stats') || '{}');
    Object.entries(ratings).forEach(([pid, data]) => {
      if (!existingStats[pid]) existingStats[pid] = { totalStars: 0, count: 0, tags: {} };
      existingStats[pid].totalStars += data.stars;
      existingStats[pid].count += 1;
      data.tags.forEach(t => {
        existingStats[pid].tags[t] = (existingStats[pid].tags[t] || 0) + 1;
      });
    });
    localStorage.setItem('mejengas_honor_stats', JSON.stringify(existingStats));
    setIsFinished(true);
  };

  if (isFinished) {
    return (
      <div className="mj-honor-finished">
        <div className="mj-honor-finished-icon">⚽</div>
        <h2>¡Gracias por tu feedback!</h2>
        <p className="text-muted">
          “Gracias por mejorar la comunidad ⚽”
        </p>
        <Button size="lg" fullWidth onClick={onFinish}>Volver al Lobby</Button>
      </div>
    );
  }

  return (
    <div className="mj-honor-screen">
      <header className="mj-honor-header">
        <h2>Valorar Rivales</h2>
        <p>Reconoce el buen juego y la actitud positiva</p>
      </header>

      <div className="mj-honor-players-list">
        {rivalPlayers.map(player => (
          <Card key={player.id} glass style={{ padding: 'var(--spacing-md)' }}>
            <div className="mj-honor-player-info">
              <Avatar src={player.avatar} size="sm" />
              <div className="mj-honor-player-name">
                <h4>{player.name}</h4>
                <div className="mj-honor-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={20}
                      fill={(ratings[player.id]?.stars || 0) >= star ? 'var(--color-primary)' : 'none'}
                      color={(ratings[player.id]?.stars || 0) >= star ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                      className="mj-honor-star"
                      onClick={() => handleRate(player.id, star)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mj-honor-tags">
              {HONOR_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(player.id, tag)}
                  className={`mj-honor-tag-btn ${ratings[player.id]?.tags.includes(tag) ? 'active' : ''}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Button size="lg" fullWidth onClick={handleConfirmHonor} disabled={Object.keys(ratings).length === 0}>
        Enviar Valoraciones
      </Button>
    </div>
  );
};

export const MatchmakingLobby: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [selectedModality, setSelectedModality] = useState<'Fútbol 5' | 'Fútbol 7'>('Fútbol 5');
  const [searchScope, setSearchScope] = useState<'locality' | 'region' | 'country'>('locality');
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const getScopeLabel = () => {
    switch (searchScope) {
      case 'locality': return user?.location?.localityName || 'Mi Localidad';
      case 'region': return user?.location?.regionName || 'Mi Región';
      case 'country': return user?.location?.countryName || 'Todo el País';
    }
  };
  const ACTIVE_RETO_KEY = 'mejengas_active_reto';
  const RETO_PHASE_KEY  = 'mejengas_reto_phase';

  const [activeRetoChat, setActiveRetoChat] = useState<string | null>(() => localStorage.getItem(ACTIVE_RETO_KEY));
  const [retoPhase, setRetoPhase] = useState<string | null>(() => localStorage.getItem(RETO_PHASE_KEY));

  // States para la cámara
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<string | null>(null);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [aiAnalysisResponse, setAiAnalysisResponse] = useState<AnalyzeMatchResponse | null>(null);
  const [aiFrontendSummary, setAiFrontendSummary] = useState<FrontendMatchSummary | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => setRecordingTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  const handleConfirmReto = (chatId: string) => {
    localStorage.setItem(ACTIVE_RETO_KEY, chatId);
    localStorage.setItem(RETO_PHASE_KEY, 'acordando');
    setActiveRetoChat(chatId);
    setRetoPhase('acordando');
    navigate(`/chats/${chatId}`);
  };

  const handleMiConfirmacion = () => {
    localStorage.setItem(RETO_PHASE_KEY, 'esperando_rival');
    setRetoPhase('esperando_rival');
    setTimeout(() => {
      localStorage.setItem(RETO_PHASE_KEY, 'confirmado');
      setRetoPhase('confirmado');
    }, 3000);
  };

  const handleCancelReto = () => {
    if (window.confirm('¿Cancelar el reto en curso?')) {
      localStorage.removeItem(ACTIVE_RETO_KEY);
      localStorage.removeItem(RETO_PHASE_KEY);
      setActiveRetoChat(null);
      setRetoPhase(null);
    }
  };

  const handleFinalizarPartido = () => {
    setRetoPhase('dar_honor');
    localStorage.setItem(RETO_PHASE_KEY, 'dar_honor');
  };

  const handleCerrarLobby = () => {
    localStorage.removeItem(ACTIVE_RETO_KEY);
    localStorage.removeItem(RETO_PHASE_KEY);
    setActiveRetoChat(null);
    setRetoPhase(null);
    setRecordedBlob(null);
    setRecordedVideoBlob(null);
    setAiAnalysisResponse(null);
    setAiFrontendSummary(null);
    setAiError(null);
    stopRecording(true); 
  };

  const handleEnviarIA = async () => {
    if (!recordedVideoBlob) {
      setAiError('No hay video grabado para enviar a la IA.');
      return;
    }

    const videoFile = new File([recordedVideoBlob], 'match-recording.webm', { type: 'video/webm' });

    setAiError(null);
    setAiAnalysisResponse(null);
    setAiFrontendSummary(null);
    setRetoPhase('procesando');
    localStorage.setItem(RETO_PHASE_KEY, 'procesando');

    try {
      const response = await analyzeMatchVideo({
        videoFile,
        matchMode: 'casual',
        cameraAngle: 'side_left',
        runDetection: true,
        runTracking: false,
        runBallDetection: true,
      });

      setAiAnalysisResponse(response);
      setAiFrontendSummary(response.frontend_match_summary);
      setRetoPhase('resultados');
      localStorage.setItem(RETO_PHASE_KEY, 'resultados');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo enviar el video a la IA.';
      setAiError(message);
      setRetoPhase('confirmado');
      localStorage.setItem(RETO_PHASE_KEY, 'confirmado');
    }
  };

  const openCamera = async () => {
    setCameraError(null);
    setAiError(null);
    setAiAnalysisResponse(null);
    setAiFrontendSummary(null);
    setRecordedBlob(null);
    setRecordedVideoBlob(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Tu navegador no soporta el acceso a la cámara o estás usando una conexión no segura.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: true 
      });
      if (stream) setupVideoStream(stream);
    } catch (err) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        if (stream) setupVideoStream(stream);
      } catch (finalErr) {
        setCameraError('No se pudo acceder a la cámara.');
      }
    }
  };

  const setupVideoStream = (stream: MediaStream) => {
    setCameraOpen(true);
    setTimeout(() => {
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }
    }, 150);
  };

  const startRecording = () => {
    const stream = videoPreviewRef.current?.srcObject as MediaStream;
    if (!stream) return;
    chunksRef.current = [];
    setAiError(null);
    setAiAnalysisResponse(null);
    setAiFrontendSummary(null);
    setRecordedVideoBlob(null);
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(URL.createObjectURL(blob));
      setRecordedVideoBlob(blob);
      setIsRecording(false);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = (closeCamera = false) => {
    mediaRecorderRef.current?.stop();
    const stream = videoPreviewRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    if (closeCamera) {
      setCameraOpen(false);
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const handleShareInvite = async () => {
    const inviteLink = `https://mejengas.app/invite/${user?.id || 'demo'}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Únete a mi equipo', text: '¡Ven a jugar!', url: inviteLink });
      } else {
        await navigator.clipboard.writeText(inviteLink);
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    let interval: any;
    if (isSearching && !matchFound) {
      interval = setInterval(() => setSearchTime(prev => prev + 1), 1000);
      const timeout = setTimeout(() => setMatchFound(true), 6000);
      return () => { clearInterval(interval); clearTimeout(timeout); };
    }
  }, [isSearching, matchFound]);

  const handleStartSearch = () => { setIsSearching(true); setSearchTime(0); setMatchFound(false); };
  const handleCancelSearch = () => { setIsSearching(false); setSearchTime(0); };
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const userTier = user?.rank?.tier || 'Bronce';
  const userDivision = user?.rank?.division || 4;
  const maxPlayers = selectedModality === 'Fútbol 5' ? 5 : 7;

  if (matchFound) {
    return (
      <div className="mj-matchmaking mj-matchmaking--found">
        <div className="mj-match-found-alert">
          <h2>¡PARTIDA ENCONTRADA!</h2>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'center' }}>
            <div className="mj-badge mj-badge--primary">{selectedModality}</div>
            <div className="mj-badge" style={{ border: '1px solid var(--color-border)' }}>📍 {getScopeLabel()}</div>
          </div>
        </div>
        <div className="mj-versus-container">
          <Card className="mj-team-card mj-team-card--ally" glass>
            <h3>Tu Equipo</h3>
            <div className="mj-team-rank"><RankIcon tier={userTier} size={20} /><span>{userTier} {userDivision}</span></div>
          </Card>
          <div className="mj-versus-badge"><Swords size={32} /><span>VS</span></div>
          <Card className="mj-team-card mj-team-card--enemy" glass>
            <h3>Rival</h3>
            <div className="mj-team-rank"><RankIcon tier={userTier} size={20} /><span>{userTier} {userDivision}</span></div>
          </Card>
        </div>
        <Button size="lg" fullWidth onClick={() => handleConfirmReto('chat1')}>Confirmar Reto</Button>
      </div>
    );
  }

  return (
    <div className="mj-matchmaking">
      <div className="mj-matchmaking-header" style={{ position: 'relative' }}>
        <h1>Lobby Competitivo</h1>
        <p>Encuentra rivales de tu mismo nivel</p>
        <button onClick={() => navigate(`/perfil/${user?.id}`)} style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', cursor: 'pointer' }}>
          <Avatar src={user?.avatarUrl} size="sm" />
        </button>
      </div>

      <Card className="mj-current-rank-card">
        <div className="mj-rank-display">
          <RankIcon tier={userTier} size={48} />
          <div className="mj-rank-info">
            <h2>{userTier} {userDivision}</h2>
            <p>{user?.rank?.points || 0} / 100 Puntos</p>
          </div>
        </div>
        <div className="mj-rank-progress">
          <div className="mj-rank-progress-bar" style={{ width: `${user?.rank?.points || 0}%` }} />
        </div>
      </Card>

      {!isSearching && !activeRetoChat && (
        <>
          <div className="mj-party-container">
            <h3>Tu Escuadra</h3>
            <div className={`mj-party-slots ${selectedModality === 'Fútbol 5' ? 'mj-party-slots--fut5' : 'mj-party-slots--fut7'}`}>
              <div className="mj-party-slot mj-party-slot--filled">
                <Avatar src={user?.avatarUrl} size="sm" />
                <span>Tú</span>
              </div>
              {Array.from({ length: maxPlayers - 1 }).map((_, i) => (
                <div key={i} className="mj-party-slot mj-party-slot--empty" onClick={() => setIsInviteModalOpen(true)}>
                  <span className="mj-slot-plus">+</span>
                  <span>Invitar</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mj-matchmaking-preferences">
            <div className="mj-preference-item" onClick={() => setIsCityModalOpen(true)} style={{ cursor: 'pointer' }}>
              <label style={{ cursor: 'pointer' }}><MapPin size={16} /> Búsqueda</label>
              <div className="mj-preference-value" style={{ textTransform: 'capitalize', textAlign: 'right' }}>
                {searchScope === 'country' ? 'Todo el País' : searchScope === 'region' ? 'Mi Región' : 'Mi Localidad'}
                <div style={{ fontSize: '0.8em', color: 'var(--color-text-muted)' }}>{getScopeLabel()}</div>
              </div>
            </div>
            <div className="mj-modality-selector">
              <button className={`mj-modality-btn ${selectedModality === 'Fútbol 5' ? 'active' : ''}`} onClick={() => setSelectedModality('Fútbol 5')}>⚽ 5v5</button>
              <button className={`mj-modality-btn ${selectedModality === 'Fútbol 7' ? 'active' : ''}`} onClick={() => setSelectedModality('Fútbol 7')}>⚽ 7v7</button>
            </div>
          </div>
        </>
      )}

      <div className="mj-matchmaking-actions">
        {isSearching ? (
          <div className="mj-searching-state">
            <div className="mj-searching-pulse"><div className="mj-pulse-ring"></div><Swords size={32} /></div>
            <div className="mj-timer">{formatTime(searchTime)}</div>
            <Button variant="danger" onClick={handleCancelSearch}>Cancelar Búsqueda</Button>
          </div>
        ) : activeRetoChat ? (
          <div style={{ width: '100%' }}>
            {retoPhase === 'procesando' ? (
              <div className="mj-processing-container">
                <div className="mj-searching-pulse">
                  <div className="mj-pulse-ring"></div>
                  <Video size={42} />
                </div>
                <h3>Analizando Partido...</h3>
                <div className="mj-processing-bar-wrapper">
                  <div className="mj-processing-bar-progress" />
                </div>
              </div>
            ) : retoPhase === 'resultados' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {aiFrontendSummary && (
                  <Card glass className="mj-match-results-card">
                    <span className="mj-match-results-header">Analisis IA</span>
                    <h3>{aiFrontendSummary.main_message}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', marginTop: 'var(--spacing-md)' }}>
                      <div><strong>Estado:</strong> {aiFrontendSummary.frontend_status}</div>
                      <div><strong>Accion:</strong> {aiFrontendSummary.primary_action}</div>
                      <div><strong>Camara:</strong> {aiFrontendSummary.primary_camera_id || 'Sin camara recomendada'}</div>
                      <div><strong>Angulo:</strong> {aiFrontendSummary.primary_camera_angle || 'Sin angulo recomendado'}</div>
                      <div><strong>Requiere revision:</strong> {aiAnalysisResponse?.needs_review ? 'Si' : 'No'}</div>
                      {aiFrontendSummary.warnings.length > 0 && (
                        <div>
                          <strong>Alertas:</strong>
                          <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                            {aiFrontendSummary.warnings.map((warning, index) => (
                              <li key={`${warning}-${index}`}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {aiFrontendSummary.primary_video_url && (
                      <video
                        src={aiFrontendSummary.primary_video_url}
                        controls
                        className="mj-video-playback"
                        style={{ marginTop: 'var(--spacing-md)' }}
                      />
                    )}
                  </Card>
                )}
                {aiError && (
                  <div style={{ padding: 'var(--spacing-md)', background: 'rgba(255,59,48,0.1)', color: 'var(--color-danger)', borderRadius: '12px', fontSize: 'var(--font-size-sm)', textAlign: 'center' }}>
                    {aiError}
                  </div>
                )}
                <Card glass className="mj-match-results-card">
                  <span className="mj-match-results-header">Reto Finalizado</span>
                  <div className="mj-match-results-score">
                    <div><h4>Tú</h4><span className="mj-score-num">3</span></div>
                    <div className="mj-score-vs">VS</div>
                    <div><h4>Rival</h4><span className="mj-score-num">2</span></div>
                  </div>
                  <div className="mj-match-victory-badge">
                    <Trophy size={16} /> ¡VICTORIA!
                  </div>
                </Card>
                <Button size="lg" fullWidth onClick={handleFinalizarPartido}>Dar Honor a Rivales</Button>
              </div>
            ) : retoPhase === 'dar_honor' ? (
              <HonorScreen onFinish={handleCerrarLobby} />
            ) : retoPhase === 'confirmado' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div className="mj-match-confirmed-banner">
                  <Trophy size={36} style={{ marginBottom: '8px' }} />
                  <h3>¡Partido Confirmado!</h3>
                </div>
                <Card glass className="mj-recording-instructions">
                  <h4><Video size={18} className="mj-recording-icon-primary" /> Instrucciones de Grabación</h4>
                  <div className="mj-recording-list">
                    <div className="mj-recording-item"><Camera size={14} /> <span>Ángulo fijo y elevado</span></div>
                    <div className="mj-recording-item"><CheckCircle2 size={14} /> <span>La IA analizará goles y stats</span></div>
                  </div>
                </Card>
                {cameraError && (
                  <div style={{ padding: 'var(--spacing-md)', background: 'rgba(255,59,48,0.1)', color: 'var(--color-danger)', borderRadius: '12px', fontSize: 'var(--font-size-sm)', textAlign: 'center' }}>
                    {cameraError}
                  </div>
                )}
                {aiError && (
                  <div style={{ padding: 'var(--spacing-md)', background: 'rgba(255,59,48,0.1)', color: 'var(--color-danger)', borderRadius: '12px', fontSize: 'var(--font-size-sm)', textAlign: 'center' }}>
                    {aiError}
                  </div>
                )}
                {cameraOpen ? (
                  <div className="mj-camera-container">
                    <div className="mj-video-wrapper">
                      <video ref={videoPreviewRef} autoPlay muted playsInline className="mj-video-preview" />
                      {isRecording && <div className="mj-recording-indicator">🔴 {formatTime(recordingTime)}</div>}
                    </div>
                    {recordedBlob ? (
                      <>
                        <video src={recordedBlob} controls className="mj-video-playback" />
                        <Button size="lg" fullWidth onClick={handleEnviarIA}>Enviar a la IA</Button>
                        <Button variant="outline" fullWidth onClick={() => {
                          setRecordedBlob(null);
                          setRecordedVideoBlob(null);
                          setAiError(null);
                          setAiAnalysisResponse(null);
                          setAiFrontendSummary(null);
                        }}>Reintentar</Button>
                      </>
                    ) : (
                      <>
                        <Button size="lg" fullWidth onClick={isRecording ? () => stopRecording(false) : startRecording} variant={isRecording ? 'danger' : 'primary'}>
                          {isRecording ? 'Detener Grabación' : 'Iniciar Grabación'}
                        </Button>
                        <Button variant="outline" fullWidth onClick={() => stopRecording(true)}>Cancelar</Button>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <Button size="lg" fullWidth onClick={openCamera} disabled={!!cameraError}><Camera size={18} style={{ marginRight: '8px' }} /> Abrir Cámara</Button>
                    <Button variant="outline" fullWidth onClick={handleFinalizarPartido}>Finalizar sin Grabar</Button>
                  </>
                )}
              </div>
            ) : retoPhase === 'esperando_rival' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <div className="mj-searching-pulse"><div className="mj-pulse-ring"></div><CheckCircle2 size={32} /></div>
                <h3>Esperando confirmación rival...</h3>
                <Button variant="danger" fullWidth onClick={handleCancelReto}>Cancelar Reto</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                <Button size="lg" fullWidth variant="outline" onClick={() => navigate(`/chats/${activeRetoChat}`)}>🤝 Acordando Reto</Button>
                <Button size="lg" fullWidth className="mj-btn-play" onClick={handleMiConfirmacion}>Confirmar Reto</Button>
                <Button variant="danger" fullWidth onClick={handleCancelReto}>Cancelar</Button>
              </div>
            )}
          </div>
        ) : <Button size="lg" fullWidth onClick={handleStartSearch} className="mj-btn-play" disabled={!user?.location}>Buscar Reto</Button>}
      </div>

      <Modal isOpen={isCityModalOpen} onClose={() => setIsCityModalOpen(false)} title="Alcance de Búsqueda">
        <p className="text-muted" style={{ marginBottom: 'var(--spacing-md)', fontSize: '0.9rem' }}>
          El matchmaking buscará automáticamente rivales dentro de tu país ({user?.location?.countryName}).
        </p>
        <div className="mj-pill-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className={`mj-pill-btn ${searchScope === 'locality' ? 'active' : ''}`} onClick={() => setSearchScope('locality')}>
            Solo mi Localidad ({user?.location?.localityName})
          </button>
          <button className={`mj-pill-btn ${searchScope === 'region' ? 'active' : ''}`} onClick={() => setSearchScope('region')}>
            Mi Región ({user?.location?.regionName})
          </button>
          <button className={`mj-pill-btn ${searchScope === 'country' ? 'active' : ''}`} onClick={() => setSearchScope('country')}>
            Todo el País ({user?.location?.countryName})
          </button>
        </div>
      </Modal>
      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invitar Jugador">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Button 
            fullWidth 
            onClick={() => {
              setIsInviteModalOpen(false);
              navigate('/mercado');
            }}
          >
            Buscar en el Mercado
          </Button>
          <Button fullWidth onClick={handleShareInvite}>
            {isLinkCopied ? '¡Enlace copiado!' : 'Copiar Enlace de Invitación'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
