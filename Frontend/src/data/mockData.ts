import type { User, Team, Match, Chat } from '../core/types';

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Carlos Ruiz',
    email: 'carlos@example.com',
    age: 24,
    position: 'Delantero',
    modality: 'Fútbol 5',
    matchesPlayed: 45,
    goals: 38,
    assists: 12,
    advancedStats: {
      shotsOnTarget: 85,
      effectivePasses: 120,
      recoveries: 15,
      interceptions: 8,
      clearances: 2,
      duelsWon: 45,
      saves: 0,
      goalsConceded: 0,
      cleanSheets: 0,
    },
    recentHistory: [
      { modality: 'Fútbol 5', userScore: 5, rivalScore: 3, isMvp: true },
      { modality: 'Fútbol 7', userScore: 2, rivalScore: 4, isMvp: false },
      { modality: 'Fútbol 5', userScore: 3, rivalScore: 3, isMvp: true },
      { modality: 'Fútbol 5', userScore: 6, rivalScore: 1, isMvp: true },
    ],
    rating: 4.8,
    rank: { tier: 'Bronce', division: 4, points: 0 },
    isFreeAgent: false,
    avatarUrl: 'https://i.pravatar.cc/150?img=11',
    location: { countryId: 'CR', countryName: 'Costa Rica', regionId: 'CR-r1', regionName: 'Provincia/Estado 1 de Costa Rica', localityId: 'CR-r1-l1', localityName: 'Ciudad/Localidad 1 (CR-r1)' }
  },
  {
    id: 'u2',
    name: 'Andrés Gómez',
    email: 'andres@example.com',
    age: 28,
    position: 'Defensa',
    modality: 'Ambas',
    matchesPlayed: 32,
    goals: 4,
    assists: 15,
    advancedStats: {
      shotsOnTarget: 12,
      effectivePasses: 340,
      recoveries: 110,
      interceptions: 85,
      clearances: 145,
      duelsWon: 98,
      saves: 2,
      goalsConceded: 0,
      cleanSheets: 0,
    },
    recentHistory: [
      { modality: 'Fútbol 7', userScore: 1, rivalScore: 0, isMvp: true },
      { modality: 'Fútbol 5', userScore: 2, rivalScore: 2, isMvp: false },
    ],
    rating: 4.5,
    rank: { tier: 'Bronce', division: 4, points: 0 },
    isFreeAgent: true,
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    location: { countryId: 'CR', countryName: 'Costa Rica', regionId: 'CR-r2', regionName: 'Provincia/Estado 2 de Costa Rica', localityId: 'CR-r2-l1', localityName: 'Ciudad/Localidad 1 (CR-r2)' }
  },
  {
    id: 'u3',
    name: 'Luis Mora',
    email: 'luis@example.com',
    age: 22,
    position: 'Portero',
    modality: 'Fútbol 7',
    matchesPlayed: 60,
    goals: 1,
    assists: 8,
    advancedStats: {
      shotsOnTarget: 3,
      effectivePasses: 210,
      recoveries: 25,
      interceptions: 5,
      clearances: 40,
      duelsWon: 15,
      saves: 215,
      goalsConceded: 42,
      cleanSheets: 18,
    },
    recentHistory: [
      { modality: 'Fútbol 5', userScore: 0, rivalScore: 3, isMvp: false },
      { modality: 'Fútbol 7', userScore: 1, rivalScore: 1, isMvp: true },
      { modality: 'Fútbol 5', userScore: 4, rivalScore: 2, isMvp: false },
    ],
    rating: 4.9,
    rank: { tier: 'Bronce', division: 4, points: 0 },
    isFreeAgent: true,
    avatarUrl: 'https://i.pravatar.cc/150?img=13',
    location: { countryId: 'CR', countryName: 'Costa Rica', regionId: 'CR-r3', regionName: 'Provincia/Estado 3 de Costa Rica', localityId: 'CR-r3-l1', localityName: 'Ciudad/Localidad 1 (CR-r3)' }
  }
];

// Add team IDs to mock users manually since they are const arrays
mockUsers[0].teamId = 't1';

const defaultTeams: Team[] = [
  {
    id: 't1',
    name: 'Los Galácticos FC',
    description: 'Buscamos jugar bonito y ganar todo. Solo gente seria para los miércoles y sábados.',
    modality: 'Fútbol 5',
    captainId: 'u1',
    subcaptainIds: [],
    players: [mockUsers[0]],
    maxPlayers: 15,
    joinRequests: [],
    wins: 15,
    losses: 4,
    draws: 2,
    points: 47,
    shieldUrl: 'https://ui-avatars.com/api/?name=LG&background=00f260&color=fff&size=150'
  },
  {
    id: 't2',
    name: 'Barrio Sur',
    description: 'Amigos de toda la vida. Entramos a torneos los fines de semana.',
    modality: 'Ambas',
    captainId: 'u2',
    subcaptainIds: [],
    players: [],
    maxPlayers: 15,
    joinRequests: [mockUsers[2]],
    wins: 10,
    losses: 8,
    draws: 5,
    points: 35,
    shieldUrl: 'https://ui-avatars.com/api/?name=BS&background=ff4b1f&color=fff&size=150'
  }
];

const localTeamsStr = localStorage.getItem('mejengas_db_teams');

const loadAndPruneTeams = (): Team[] => {
  if (!localTeamsStr) return defaultTeams;
  const parsed: Team[] = JSON.parse(localTeamsStr);
  // Eliminar equipos vacíos que pudieron quedar de sesiones anteriores
  const active = parsed.filter(team => team.players.length > 0);
  if (active.length !== parsed.length) {
    localStorage.setItem('mejengas_db_teams', JSON.stringify(active));
  }
  return active;
};

export const mockTeams: Team[] = loadAndPruneTeams();

export const mockMatches: Match[] = [
  {
    id: 'm1',
    title: 'Mejenga Nocturna',
    date: new Date(Date.now() + 86400000 * 2).toISOString(), // in 2 days
    location: { countryId: 'CR', countryName: 'Costa Rica', regionId: 'CR-r1', regionName: 'Provincia/Estado 1 de Costa Rica', localityId: 'CR-r1-l1', localityName: 'Ciudad/Localidad 1 (CR-r1)', address: 'Canchas La Sabana' },
    homeTeamId: 't1',
    status: 'pending',
    pricePerTeam: 15000,
    description: 'Buscamos equipo nivel intermedio para mejenga amistosa de 5 vs 5.'
  },
  {
    id: 'm2',
    title: 'Torneo Relámpago - Final',
    date: new Date(Date.now() - 86400000 * 1).toISOString(), // yesterday
    location: { countryId: 'CR', countryName: 'Costa Rica', regionId: 'CR-r2', regionName: 'Provincia/Estado 2 de Costa Rica', localityId: 'CR-r2-l1', localityName: 'Ciudad/Localidad 1 (CR-r2)', address: 'Polideportivo' },
    homeTeamId: 't1',
    awayTeamId: 't2',
    homeScore: 3,
    awayScore: 2,
    status: 'completed'
  }
];

export const mockChats: Chat[] = [
  {
    id: 'chat1',
    type: 'reto',
    participants: [mockUsers[1]], // Andrés Gómez
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    unreadCount: 1,
    messages: [
      {
        id: 'm1',
        senderId: 'u2', // Andrés
        text: '¡Pura vida! Ya aceptamos el reto. ¿Dónde tienen pensado jugar?',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      }
    ]
  },
  {
    id: 'chat2',
    type: 'reto',
    participants: [mockUsers[2]], // Luis Mora
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    unreadCount: 0,
    messages: [
      {
        id: 'm2',
        senderId: 'currentUser', 
        text: 'Nos vemos a las 8 entonces en La 5.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString()
      },
      {
        id: 'm3',
        senderId: 'u3', // Luis
        text: 'Dele, ahí estaremos listos.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      }
    ]
  },
  {
    id: 'chat3',
    type: 'reclutamiento',
    participants: [mockUsers[0]], // Carlos Ruiz
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    unreadCount: 0,
    messages: [
      {
        id: 'm4',
        senderId: 'currentUser', 
        text: 'Mae Carlos, vimos tus stats de Fútbol 5 y nos cuadran. ¿Estás buscando equipo fijo para los jueves?',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      }
    ]
  },
  {
    id: 'chat_team_t1',
    type: 'equipo',
    teamId: 't1',
    participants: [mockUsers[0]], // Team members
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    messages: [
      {
        id: 'm5',
        senderId: 'u1',
        text: '¿Quién se apunta para una mejenga este sábado?',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString()
      },
      {
        id: 'm6',
        senderId: 'u1',
        text: 'Propuesta de Reto',
        type: 'proposal',
        timestamp: new Date().toISOString(),
        proposalData: {
          modality: 'Fútbol 5',
          joinedUsers: ['u1'], // Carlos Ruiz is already joined
          requiredPlayers: 5,
          status: 'open'
        }
      }
    ]
  }
];
