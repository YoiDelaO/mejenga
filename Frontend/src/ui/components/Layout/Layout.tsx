import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../BottomNav/BottomNav';
import './Layout.css';

export const Layout: React.FC = () => {
  return (
    <div className="mj-layout">
      <header className="mj-header">
        <h1 className="mj-header__title">Mejengas</h1>
      </header>
      
      <main className="mj-main-content">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};
