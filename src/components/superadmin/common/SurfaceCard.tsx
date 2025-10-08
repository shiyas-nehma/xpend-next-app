import React from 'react';

interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: string;
}

const SurfaceCard: React.FC<SurfaceCardProps> = ({ className = '', children, hover = true, padding = 'p-5', ...rest }) => {
  return (
    <div
      className={`relative rounded-xl bg-brand-surface border border-brand-border ${padding} ${hover ? 'transition-colors hover:bg-brand-surface-2' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default SurfaceCard;
