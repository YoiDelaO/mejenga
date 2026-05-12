import React from 'react';
import { Shield, Medal, Trophy, Award, Gem, Flame, Crown } from 'lucide-react';
import type { RankTier } from '../../../core/types';

interface RankIconProps {
  tier: RankTier;
  size?: number;
  className?: string;
}

export const RankIcon: React.FC<RankIconProps> = ({ tier, size = 24, className = '' }) => {
  switch (tier) {
    case 'Bronce':
      return <Shield size={size} className={className} />;
    case 'Plata':
      return <Medal size={size} className={className} />;
    case 'Oro':
      return <Trophy size={size} className={className} />;
    case 'Platino':
      return <Award size={size} className={className} />;
    case 'Diamante':
      return <Gem size={size} className={className} />;
    case 'Elite':
      return <Flame size={size} className={className} />;
    case 'Leyenda':
      return <Crown size={size} className={className} />;
    default:
      return <Shield size={size} className={className} />;
  }
};
