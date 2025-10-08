import React from 'react';
import SurfaceCard from './SurfaceCard';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeTone?: 'up' | 'down' | 'neutral';
  small?: boolean;
}

const toneColors: Record<string, string> = {
  up: 'text-green-400',
  down: 'text-red-400',
  neutral: 'text-brand-text-secondary'
};

const MetricCard: React.FC<MetricCardProps> = ({ label, value, change, changeTone = 'neutral', small }) => {
  return (
    <SurfaceCard className={small ? 'p-4' : ''}>
      <p className="text-xs uppercase tracking-wide text-brand-text-secondary font-medium">{label}</p>
      <div className="mt-2 flex items-end gap-2">
        <p className={`font-semibold ${small ? 'text-xl' : 'text-2xl'}`}>{value}</p>
        {change && <span className={`text-[11px] font-medium ${toneColors[changeTone]}`}>{change}</span>}
      </div>
    </SurfaceCard>
  );
};

export default MetricCard;
