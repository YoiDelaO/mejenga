import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../core/contexts/AuthContext';
import './Auth.css';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mj-auth-page">
      <div className="mj-auth-container">
        <div className="mj-auth-header">
          <h1 className="mj-auth-title">Mejengas</h1>
          <p className="mj-auth-subtitle">Inicia sesión para jugar</p>
        </div>

        {error && (
          <div className="mj-auth-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="mj-auth-form">
          <Input 
            label="Correo Electrónico" 
            type="email" 
            placeholder="jugador@ejemplo.com"
            leftIcon={<Mail size={18} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Contraseña" 
            type="password" 
            placeholder="••••••••"
            leftIcon={<Lock size={18} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            Entrar a la Cancha
          </Button>
        </form>

        <p className="mj-auth-footer">
          ¿No tienes cuenta? <Link to="/registro" className="mj-auth-link">Regístrate</Link>
        </p>
      </div>
    </div>
  );
};
