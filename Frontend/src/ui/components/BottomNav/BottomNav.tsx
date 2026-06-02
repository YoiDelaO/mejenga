import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Swords, Trophy, MessageSquare, Shield } from 'lucide-react';
import './BottomNav.css';

export const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/', icon: <Swords size={24} />, label: 'Buscar Reto' },
    { to: '/ranking', icon: <Trophy size={24} />, label: 'Ranking' },
    { to: '/mi-equipo', icon: <Shield size={24} />, label: 'Equipo' },
    { to: '/mercado', icon: <Search size={24} />, label: 'Mercado' },
    { to: '/chats', icon: <MessageSquare size={24} />, label: 'Chats' },
  ];

  return (
    <nav className="mj-bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => 
            `mj-bottom-nav__item ${isActive ? 'mj-bottom-nav__item--active' : ''}`
          }
        >
          <div className="mj-bottom-nav__icon-wrapper">
            {item.icon}
          </div>
          <span className="mj-bottom-nav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
