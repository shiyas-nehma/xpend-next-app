import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/useToast';
import ProfileHeader from '@/components/common/ProfileHeader';
import { 
  SettingsIcon, 
  LogoutIcon, 
  AccountsIcon, 
  BellIcon,
  CreditCardIcon
} from '@/components/icons/NavIcons';

interface QuickSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSettings: (tab?: string) => void;
}

const QuickSettingsModal: React.FC<QuickSettingsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSettings
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      addToast('Successfully logged out', 'success');
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
      addToast('Failed to logout', 'error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const menuItems = [
    {
      icon: <AccountsIcon className="w-4 h-4" />,
      label: 'Profile Settings',
      description: 'Update your personal information',
      onClick: () => {
        onNavigateToSettings('Profile');
        onClose();
      }
    },
    {
      icon: <BellIcon className="w-4 h-4" />,
      label: 'Notifications',
      description: 'Manage your notification preferences',
      onClick: () => {
        onNavigateToSettings('Notifications');
        onClose();
      }
    },
    {
      icon: <CreditCardIcon className="w-4 h-4" />,
      label: 'Billing & Plans',
      description: 'Manage your subscription',
      onClick: () => {
        onNavigateToSettings('Billing & Plans');
        onClose();
      }
    },
    {
      icon: <SettingsIcon className="w-4 h-4" />,
      label: 'Security',
      description: 'Password and security settings',
      onClick: () => {
        onNavigateToSettings('Security');
        onClose();
      }
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed top-20 right-8 w-80 bg-brand-surface border border-brand-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-brand-border">
            <ProfileHeader size="lg" />
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-brand-surface-2 transition-colors text-left"
              >
                <div className="text-brand-text-secondary">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-brand-text-primary">
                    {item.label}
                  </div>
                  <div className="text-xs text-brand-text-secondary">
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-brand-border">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-500/10 transition-colors text-left disabled:opacity-50"
            >
              <div className="text-red-400">
                {isLoggingOut ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                ) : (
                  <LogoutIcon className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-red-400">
                  {isLoggingOut ? 'Logging out...' : 'Sign out'}
                </div>
                <div className="text-xs text-red-400/70">
                  Sign out of your account
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickSettingsModal;