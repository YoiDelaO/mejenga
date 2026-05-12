import React from 'react';
import './Avatar.css';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isTeam?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  className = '',
  isTeam = false
}) => {
  const classes = [
    'mj-avatar',
    `mj-avatar--${size}`,
    isTeam ? 'mj-avatar--team' : 'mj-avatar--user',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {src ? (
        <img src={src} alt={alt} className="mj-avatar__image" />
      ) : (
        <div className="mj-avatar__fallback">
          <User size={size === 'xs' ? 12 : size === 'sm' ? 16 : size === 'md' ? 24 : size === 'lg' ? 32 : 48} />
        </div>
      )}
    </div>
  );
};
