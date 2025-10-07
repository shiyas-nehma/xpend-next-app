import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { updateUserProfile, getUserProfile } from '@/lib/firebase/auth';

export interface UserProfileData {
  fullName: string;
  username: string;
  email: string;
  bio: string;
  photoURL: string;
}

export const useUserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData>({
    fullName: '',
    username: '',
    email: '',
    bio: '',
    photoURL: ''
  });

  // Initialize profile data when user loads
  useEffect(() => {
    if (user && !authLoading) {
      const profile = getUserProfile();
      if (profile) {
        setProfileData({
          fullName: profile.displayName || '',
          username: `@${profile.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
          email: profile.email || '',
          bio: '', // We'll add bio support later if needed
          photoURL: profile.photoURL || ''
        });
      }
    }
  }, [user, authLoading]);

  const updateProfile = async (newData: Partial<UserProfileData>) => {
    if (!user) {
      addToast('No user logged in', 'error');
      return false;
    }

    const updatedData = { ...profileData, ...newData };

    // Validate required fields
    if (!updatedData.fullName.trim()) {
      addToast('Full name is required', 'error');
      return false;
    }

    if (!updatedData.email.trim()) {
      addToast('Email is required', 'error');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updatedData.email)) {
      addToast('Please enter a valid email address', 'error');
      return false;
    }

    setLoading(true);
    try {
      await updateUserProfile({
        displayName: updatedData.fullName,
        email: updatedData.email,
        photoURL: updatedData.photoURL
      });
      
      setProfileData(updatedData);
      addToast('Profile updated successfully!', 'success');
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      addToast(
        error instanceof Error ? error.message : 'Failed to update profile', 
        'error'
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetProfile = () => {
    const profile = getUserProfile();
    if (profile) {
      setProfileData({
        fullName: profile.displayName || '',
        username: `@${profile.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
        email: profile.email || '',
        bio: '',
        photoURL: profile.photoURL || ''
      });
    }
  };

  return {
    profileData,
    setProfileData,
    updateProfile,
    resetProfile,
    loading,
    authLoading
  };
};

export default useUserProfile;