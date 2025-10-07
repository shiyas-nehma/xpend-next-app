import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/lib/firebase/auth';

interface ProfileHeaderProps {
  showFullName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  showFullName = true, 
  size = 'md',
  className = ''
}) => {
  const { user, loading } = useAuth();
  const profile = getUserProfile();

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className={`${sizeClasses[size]} bg-brand-surface-2 rounded-full animate-pulse`} />
        {showFullName && (
          <div className="h-4 bg-brand-surface-2 rounded w-24 animate-pulse" />
        )}
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const displayName = profile.displayName || 'User';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="relative">
        {profile.photoURL ? (
          <img 
            src={profile.photoURL}
            alt={displayName}
            className={`${sizeClasses[size]} rounded-full object-cover`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`${sizeClasses[size]} bg-brand-blue text-white rounded-full flex items-center justify-center font-semibold ${profile.photoURL ? 'hidden' : 'flex'}`}
          style={{ display: profile.photoURL ? 'none' : 'flex' }}
        >
          {initials}
        </div>
      </div>
      {showFullName && (
        <div className="flex flex-col">
          <span className="text-brand-text-primary font-medium">
            {displayName}
          </span>
          <span className="text-brand-text-secondary text-sm">
            {profile.email}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;