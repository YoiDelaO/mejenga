import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './core/contexts/AuthContext';
import { ProtectedRoute } from './ui/components/ProtectedRoute/ProtectedRoute';
import { Layout } from './ui/components/Layout/Layout';
import { Login } from './ui/pages/Login/Login';
import { Register } from './ui/pages/Register/Register';
import { MatchmakingLobby } from './ui/pages/Matchmaking/MatchmakingLobby';
import { PerfilJugador } from './ui/pages/PerfilJugador/PerfilJugador';
import { Ranking } from './ui/pages/Ranking/Ranking';

import { PerfilEquipo } from './ui/pages/PerfilEquipo/PerfilEquipo';
import { ConfirmarResultado } from './ui/pages/ConfirmarResultado/ConfirmarResultado';
import { Mercado } from './ui/pages/Mercado/Mercado';
import { EquiposList } from './ui/pages/Mercado/EquiposList';
import { ChatList } from './ui/pages/ChatList/ChatList';
import { ChatRoom } from './ui/pages/ChatRoom/ChatRoom';
import { MiEquipo } from './ui/pages/MiEquipo/MiEquipo';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          
          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<MatchmakingLobby />} />
              <Route path="buscar" element={<MatchmakingLobby />} />
              <Route path="perfil" element={<PerfilJugador />} />
              <Route path="perfil/:id" element={<PerfilJugador />} />
              <Route path="ranking" element={<Ranking />} />
              
              <Route path="mercado" element={<Mercado />} />
              <Route path="mercado/equipos" element={<EquiposList />} />
              <Route path="equipo/:id" element={<PerfilEquipo />} />
              <Route path="confirmar/:matchId" element={<ConfirmarResultado />} />
              <Route path="mi-equipo" element={<MiEquipo />} />
              
              <Route path="chats" element={<ChatList />} />
              <Route path="chats/:id" element={<ChatRoom />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
