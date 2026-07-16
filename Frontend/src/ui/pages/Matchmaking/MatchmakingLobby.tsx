import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/contexts/AuthContext';
import {
  analyzeMulticameraMatch,
  analyzeMatchVideo,
  sendReviewDecision,
  type AnalyzeMatchResponse,
  type FrontendMatchSummary,
  type ReviewDecisionResponse,
} from '../../../core/services/aiService';
import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { Modal } from '../../components/Modal/Modal';
import { RankIcon } from '../../components/RankIcon/RankIcon';
import { Swords, MapPin, CheckCircle2, Video, Camera, Trophy, Star } from 'lucide-react';
import { Avatar } from '../../components/Avatar/Avatar';
import './MatchmakingLobby.css';

// ── SISTEMA DE HONOR ──
interface RivalPlayer {
  id: string;
  name: string;
  avatar?: string;
}

const HONOR_TAGS = ['Fair Play', 'Buen líder', 'Respetuoso', 'Competitivo', 'Buena actitud'];

const FRONTEND_STATUS_LABELS: Record<string, string> = {
  no_review_needed: 'No requiere revisión',
  review_ready: 'Clips listos para revisar',
  human_review_required: 'Requiere revisión humana',
  camera_setup_required: 'Configuración de cámaras incompleta',
  analysis_ready: 'Análisis listo',
};

const PRIMARY_ACTION_LABELS: Record<string, string> = {
  none: 'Sin acción requerida',
  review_clips: 'Revisar clips',
  review_multicamera_event: 'Revisar jugada multicámara',
  fix_camera_setup: 'Corregir configuración de cámaras',
};

const AI_MAIN_MESSAGE_LABELS: Record<string, string> = {
  'Match analysis completed. No review is required.': 'Análisis completado. No se requiere revisión.',
  'Match review clips are ready.': 'Los clips de revisión están listos.',
  'A multicamera event requires human review.': 'Una jugada multicámara requiere revisión humana.',
  'Camera setup must be completed before validating the match.': 'Debes completar la configuración de cámaras antes de validar el partido.',
};

const AI_WARNING_LABELS: Record<string, string> = {
  'Player detection quality is poor.': 'La calidad de detección de jugadores fue baja.',
  'Low number of players detected.': 'Se detectaron pocos jugadores.',
  'Video is very short for match analysis.': 'El video es muy corto para el análisis del partido.',
  'Video may not show enough players for a ranked match.': 'El video puede no mostrar suficientes jugadores para un partido ranked.',
  'No usable camera videos were found.': 'No se encontraron videos de cámara utilizables.',
  'Multicamera correlation assumes all videos start at approximately the same time.': 'La correlación multicámara asume que todos los videos empiezan aproximadamente al mismo tiempo.',
  'At least two cameras are required to correlate multicamera events.': 'Se requieren al menos dos cámaras para correlacionar eventos multicámara.',
  'No shot or goal candidate events with timestamps were available.': 'No se encontraron tiros o candidatos a gol con marcas de tiempo.',
};

const REVIEW_DECISION_OPTION_LABELS: Record<string, string> = {
  'Confirm goal': 'Confirmar gol',
  'Reject goal': 'Rechazar gol',
  'Mark as uncertain': 'Marcar como incierto',
  'Confirm shot': 'Confirmar tiro',
  'Reject shot': 'Rechazar tiro',
};

const REVIEW_DECISION_VALUE_LABELS: Record<string, string> = {
  confirm_goal: 'Gol confirmado',
  reject_goal: 'Gol rechazado',
  mark_uncertain: 'Marcado como incierto',
  confirm_shot: 'Tiro confirmado',
  reject_shot: 'Tiro rechazado',
};

const REVIEW_DECISION_STATUS_LABELS: Record<string, string> = {
  confirmed_by_human: 'Confirmado manualmente',
  rejected_by_human: 'Rechazado manualmente',
  uncertain_by_human: 'Incierto',
  not_applicable: 'No aplica',
  not_implemented: 'No implementada todavía',
};

const getFrontendStatusLabel = (status: string) => (
  FRONTEND_STATUS_LABELS[status] || status
);

const getPrimaryActionLabel = (action: string) => (
  PRIMARY_ACTION_LABELS[action] || action
);

const getAiMainMessageLabel = (message: string) => (
  AI_MAIN_MESSAGE_LABELS[message] || message
);

const getAiWarningLabel = (warning: string) => {
  const cameraPrefixMatch = warning.match(/^(cam_\d+:\s*)(.*)$/);

  if (cameraPrefixMatch) {
    const [, prefix, message] = cameraPrefixMatch;
    return `${prefix}${AI_WARNING_LABELS[message] || message}`;
  }

  return AI_WARNING_LABELS[warning] || warning;
};

const getReviewDecisionOptionLabel = (value: string, label: string) => (
  REVIEW_DECISION_OPTION_LABELS[label] || REVIEW_DECISION_VALUE_LABELS[value] || label
);

const getReviewDecisionValueLabel = (value: string) => (
  REVIEW_DECISION_VALUE_LABELS[value] || value
);

const getReviewDecisionStatusLabel = (status: string) => (
  REVIEW_DECISION_STATUS_LABELS[status] || status
);

const getReviewDecisionEventId = (response: AnalyzeMatchResponse | null) => {
  const eventId = response?.match_multicamera_events?.review_decision_event_id;

  if (typeof eventId === 'string' && eventId.trim()) {
    return eventId;
  }

  return null;
};

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
  const [reviewDecisionLoading, setReviewDecisionLoading] = useState(false);
  const [reviewDecisionResult, setReviewDecisionResult] = useState<ReviewDecisionResponse | null>(null);
  const [reviewDecisionError, setReviewDecisionError] = useState<string | null>(null);
  const [multicameraCam1File, setMulticameraCam1File] = useState<File | null>(null);
  const [multicameraCam2File, setMulticameraCam2File] = useState<File | null>(null);
  const [multicameraLoading, setMulticameraLoading] = useState(false);
  const [multicameraError, setMulticameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => setRecordingTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  const resetReviewDecisionState = () => {
    setReviewDecisionLoading(false);
    setReviewDecisionResult(null);
    setReviewDecisionError(null);
  };

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
    resetReviewDecisionState();
    setMulticameraCam1File(null);
    setMulticameraCam2File(null);
    setMulticameraLoading(false);
    setMulticameraError(null);
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
    setMulticameraLoading(false);
    resetReviewDecisionState();
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

  const handleAnalyzeMulticamera = async () => {
    if (!multicameraCam1File || !multicameraCam2File) {
      setMulticameraError('Selecciona los dos videos antes de analizar.');
      return;
    }

    setMulticameraLoading(true);
    setMulticameraError(null);
    setAiError(null);
    setAiAnalysisResponse(null);
    setAiFrontendSummary(null);
    resetReviewDecisionState();
    setRetoPhase('procesando');
    localStorage.setItem(RETO_PHASE_KEY, 'procesando');

    try {
      const response = await analyzeMulticameraMatch({
        cam1File: multicameraCam1File,
        cam2File: multicameraCam2File,
        cam1Angle: 'side_left',
        cam2Angle: 'side_right',
        matchMode: 'casual',
        runDetection: true,
        runTracking: false,
        runBallDetection: true,
      });

      setAiAnalysisResponse(response);
      setAiFrontendSummary(response.frontend_match_summary);
      setRetoPhase('resultados');
      localStorage.setItem(RETO_PHASE_KEY, 'resultados');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron analizar las dos cámaras.';
      setMulticameraError(message);
      setRetoPhase('confirmado');
      localStorage.setItem(RETO_PHASE_KEY, 'confirmado');
    } finally {
      setMulticameraLoading(false);
    }
  };

  const handleReviewDecision = async (decisionValue: string) => {
    if (!aiFrontendSummary) {
      setReviewDecisionError('No hay un análisis IA disponible para enviar la decisión.');
      return;
    }

    const selectedOption = aiFrontendSummary.review_decision_options.find(
      option => option.value === decisionValue,
    );

    if (!selectedOption) {
      setReviewDecisionError('La opción de decisión seleccionada no está disponible.');
      return;
    }

    const eventId = getReviewDecisionEventId(aiAnalysisResponse);

    if (!eventId) {
      setReviewDecisionError('No se encontró el evento de revisión para enviar la decisión.');
      return;
    }

    setReviewDecisionLoading(true);
    setReviewDecisionError(null);
    setReviewDecisionResult(null);

    try {
      const response = await sendReviewDecision({
        event_id: eventId,
        decision: selectedOption.value,
        camera_id: aiFrontendSummary.primary_camera_id,
        camera_angle: aiFrontendSummary.primary_camera_angle,
        playback_url: aiFrontendSummary.primary_video_url,
        notes: 'Decision sent from frontend demo.',
      });

      setReviewDecisionResult(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo enviar la decisión.';
      setReviewDecisionError(message);
    } finally {
      setReviewDecisionLoading(false);
    }
  };

  const openCamera = async () => {
    setCameraError(null);
    setAiError(null);
    setAiAnalysisResponse(null);
    setAiFrontendSummary(null);
    setMulticameraError(null);
    resetReviewDecisionState();
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
    setMulticameraError(null);
    resetReviewDecisionState();
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
                <h3>{multicameraLoading ? 'Analizando las dos cámaras...' : 'Analizando Partido...'}</h3>
                <div className="mj-processing-bar-wrapper">
                  <div className="mj-processing-bar-progress" />
                </div>
              </div>
            ) : retoPhase === 'resultados' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {aiFrontendSummary && (
                  <Card glass className="mj-ai-analysis-card">
                    <div className="mj-ai-analysis-header">
                      <span className="mj-match-results-header">ANÁLISIS IA</span>
                      <span className="mj-ai-status-pill">
                        {getFrontendStatusLabel(aiFrontendSummary.frontend_status)}
                      </span>
                    </div>
                    <h3>{getAiMainMessageLabel(aiFrontendSummary.main_message)}</h3>
                    <div className="mj-ai-summary-grid">
                      <div className="mj-ai-summary-item">
                        <span>Estado</span>
                        <strong>{getFrontendStatusLabel(aiFrontendSummary.frontend_status)}</strong>
                      </div>
                      <div className="mj-ai-summary-item">
                        <span>Acción sugerida</span>
                        <strong>{getPrimaryActionLabel(aiFrontendSummary.primary_action)}</strong>
                      </div>
                      <div className="mj-ai-summary-item">
                        <span>Cámara recomendada</span>
                        <strong>{aiFrontendSummary.primary_camera_id || 'Sin cámara recomendada'}</strong>
                      </div>
                      <div className="mj-ai-summary-item">
                        <span>Ángulo recomendado</span>
                        <strong>{aiFrontendSummary.primary_camera_angle || 'Sin ángulo recomendado'}</strong>
                      </div>
                      <div className="mj-ai-summary-item">
                        <span>Revisión humana</span>
                        <strong>{aiFrontendSummary.requires_human_review ? 'Requerida' : 'No requerida'}</strong>
                      </div>
                      <div className="mj-ai-summary-item">
                        <span>Revisión general</span>
                        <strong>{aiAnalysisResponse?.needs_review ? 'Sí' : 'No'}</strong>
                      </div>
                    </div>
                    {aiFrontendSummary.primary_video_url && (
                      <div className="mj-ai-video-section">
                        <h4>Video recomendado por la IA</h4>
                        <video
                          src={aiFrontendSummary.primary_video_url}
                          controls
                          className="mj-video-playback"
                        />
                      </div>
                    )}
                    {aiFrontendSummary.warnings.length > 0 && (
                      <div className="mj-ai-warnings">
                        <h4>Alertas</h4>
                        <ol>
                          {aiFrontendSummary.warnings.map((warning, index) => (
                            <li key={`${warning}-${index}`}>{getAiWarningLabel(warning)}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {aiFrontendSummary.requires_human_review ? (
                      <div className="mj-ai-decision-panel">
                        <h4>Decisión requerida</h4>
                        <p>Selecciona una decisión para registrar esta revisión en la demo.</p>
                        {reviewDecisionLoading && (
                          <p className="mj-ai-decision-status">Enviando decisión...</p>
                        )}
                        {aiFrontendSummary.review_decision_options.length === 0 && (
                          <p>No hay opciones de decisión disponibles para esta jugada.</p>
                        )}
                        <div className="mj-ai-decision-options">
                          {aiFrontendSummary.review_decision_options.map(option => (
                            <Button
                              key={option.value}
                              variant="outline"
                              size="sm"
                              disabled={reviewDecisionLoading}
                              onClick={() => handleReviewDecision(option.value)}
                            >
                              {getReviewDecisionOptionLabel(option.value, option.label)}
                            </Button>
                          ))}
                        </div>
                        {reviewDecisionResult && (
                          <div className="mj-ai-decision-result">
                            <strong>Decisión registrada para la demo.</strong>
                            <div>Decisión: {getReviewDecisionValueLabel(reviewDecisionResult.decision)}</div>
                            <div>Estado del gol: {getReviewDecisionStatusLabel(reviewDecisionResult.manual_goal_status)}</div>
                            <div>Estado del evento: {getReviewDecisionStatusLabel(reviewDecisionResult.manual_event_status)}</div>
                            <div>Persistencia: {getReviewDecisionStatusLabel(reviewDecisionResult.persistence_status)}</div>
                          </div>
                        )}
                        {reviewDecisionError && (
                          <div className="mj-ai-decision-error">
                            {reviewDecisionError}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mj-ai-decision-panel">
                        <h4>Decisión humana</h4>
                        <p>No se requiere decisión humana.</p>
                      </div>
                    )}
                  </Card>
                )}
                {aiError && (
                  <div style={{ padding: 'var(--spacing-md)', background: 'rgba(255,59,48,0.1)', color: 'var(--color-danger)', borderRadius: '12px', fontSize: 'var(--font-size-sm)', textAlign: 'center' }}>
                    {aiError}
                  </div>
                )}
                {!aiFrontendSummary && (
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
                )}
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
                <Card glass className="mj-multicamera-demo-card">
                  <div className="mj-multicamera-demo-header">
                    <h4><Video size={18} className="mj-recording-icon-primary" /> Prueba multicámara</h4>
                    <p>Selecciona dos videos sincronizados para probar la revisión de jugadas desde diferentes ángulos.</p>
                  </div>
                  <div className="mj-multicamera-demo-grid">
                    <label className="mj-multicamera-file-input">
                      <span>Cámara 1</span>
                      <small>Ángulo: side_left</small>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(event) => {
                          setMulticameraCam1File(event.target.files?.[0] ?? null);
                          setMulticameraError(null);
                        }}
                      />
                      <strong>{multicameraCam1File?.name || 'Sin video seleccionado'}</strong>
                    </label>
                    <label className="mj-multicamera-file-input">
                      <span>Cámara 2</span>
                      <small>Ángulo: side_right</small>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(event) => {
                          setMulticameraCam2File(event.target.files?.[0] ?? null);
                          setMulticameraError(null);
                        }}
                      />
                      <strong>{multicameraCam2File?.name || 'Sin video seleccionado'}</strong>
                    </label>
                  </div>
                  <p className="mj-multicamera-demo-note">
                    Para una prueba rápida puedes seleccionar el mismo video en ambas cámaras. La correlación supone que los videos empiezan aproximadamente al mismo tiempo.
                  </p>
                  {multicameraError && (
                    <div className="mj-multicamera-demo-error">
                      {multicameraError}
                    </div>
                  )}
                  <Button
                    size="lg"
                    fullWidth
                    onClick={handleAnalyzeMulticamera}
                    disabled={!multicameraCam1File || !multicameraCam2File || multicameraLoading}
                  >
                    {multicameraLoading ? 'Analizando las dos cámaras...' : 'Analizar dos cámaras'}
                  </Button>
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
                          resetReviewDecisionState();
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
