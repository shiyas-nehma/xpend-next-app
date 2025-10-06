import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: React.ReactNode;
  primaryAction: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, primaryAction, secondaryAction }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 h-full relative inset-0">
       <div className="absolute bottom-0 left-0 right-0 h-48 w-full overflow-hidden z-0">
         <svg className="absolute bottom-0 w-full h-auto text-brand-border" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" fillOpacity="0.1" d="M0,224L48,208C96,192,192,160,288,170.7C384,181,480,235,576,250.7C672,267,768,245,864,213.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
         </svg>
       </div>
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-6">{icon}</div>
        <h3 className="text-2xl font-bold text-brand-text-primary mb-2">{title}</h3>
        <div className="text-brand-text-secondary max-w-sm mb-8">{message}</div>
        <div className="flex items-center space-x-4">
          {secondaryAction}
          {primaryAction}
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
