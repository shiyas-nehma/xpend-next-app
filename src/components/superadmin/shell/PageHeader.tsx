import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions, className = '' }) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className}`}>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{title}</h1>
        {description && <p className="text-sm text-brand-text-secondary mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
