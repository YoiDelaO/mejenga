export type RankTier = 'Bronce' | 'Plata' | 'Oro' | 'Platino' | 'Diamante' | 'Elite' | 'Leyenda';
export type RankDivision = 4 | 3 | 2 | 1;

export interface Rank {
  tier: RankTier;
  division: RankDivision;
  points: number; // 0 a 100 para subir de división
}

export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  avatarUrl?: string;
  position: string;
  secondaryPosition?: string;
  location?: {
    countryId: string;
    countryName: string;
    regionId: string;
    regionName: string;
    localityId: string;
    localityName: string;
  };
  modality?: 'Fútbol 5' | 'Fútbol 7' | 'Ambas';
  matchesPlayed: number;
  goals?: number;
  assists?: number;
  advancedStats?: {
    shotsOnTarget?: number;
    effectivePasses?: number;
    recoveries?: number;
    interceptions?: number;
    clearances?: number;
    duelsWon?: number;
    saves?: number;
    goalsConceded?: number;
    cleanSheets?: number;
  };
  recentHistory?: {
    modality: string;
    userScore: number;
    rivalScore: number;
    isMvp: boolean;
  }[];
  rating: number;
  rank?: Rank; // El nuevo sistema de rangos
  isFreeAgent: boolean; // Para el 'Mercado de jugadores'
  teamId?: string | null; // El ID del equipo al que pertenece (solo 1)
}

export interface Team {
  id: string;
  name: string;
  description: string;
  modality: 'Fútbol 5' | 'Fútbol 7' | 'Ambas';
  shieldUrl?: string;
  captainId: string;
  subcaptainIds?: string[]; // IDs de los subcapitanes
  players: User[];
  maxPlayers: number; // Max 15
  joinRequests: User[]; // Usuarios que quieren unirse
  wins: number;
  losses: number;
  draws: number;
  points: number; // Para el 'Ranking'
}

export type MatchStatus = 'pending' | 'confirmed' | 'completed' | 'disputed';

export interface Match {
  id: string;
  title: string;
  date: string; // ISO string
  location: {
    countryId: string;
    countryName: string;
    regionId: string;
    regionName: string;
    localityId: string;
    localityName: string;
    address?: string;
  };
  homeTeamId: string;
  awayTeamId?: string; // Si es null, está buscando equipo (Buscar reto)
  homeScore?: number;
  awayScore?: number;
  status: MatchStatus;
  pricePerTeam?: number;
  description?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  type?: 'text' | 'proposal';
  proposalData?: {
    modality: 'Fútbol 5' | 'Fútbol 7' | 'Ambas';
    joinedUsers: string[]; // User IDs
    requiredPlayers: number;
    status: 'open' | 'searching' | 'closed';
  };
}

export interface Chat {
  id: string;
  type: 'reto' | 'reclutamiento' | 'equipo';
  participants: User[]; // The other users in the chat (usually just 1 for captain-to-captain, or team for 'equipo')
  teamId?: string; // If type is 'equipo'
  messages: Message[];
  lastMessageAt: string;
  unreadCount: number;
  matchId?: string; // Optional reference to the match this chat is for
}
