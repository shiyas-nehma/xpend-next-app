import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  updateEmail,
  updatePassword,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config.js';

// Types for auth functions
export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  displayName?: string;
  photoURL?: string;
}

export interface UpdateUserData {
  displayName?: string;
  email?: string;
  photoURL?: string;
}

export interface SuperAdminData {
  email: string;
  password: string;
}

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  userType: number; // 1 = superadmin, 2 = regular user
  createdAt: string;
  lastSignIn: string;
}

// Sign up with email and password
export const signUp = async ({ email, password, fullName }: SignUpData): Promise<User> => {
  try {
    // Check if full name contains "superadmin" (case-insensitive)
    if (fullName.toLowerCase().includes('superadmin')) {
      throw new Error('The name "superadmin" is restricted and not allowed for registration');
    }
    
    // Check if email contains "superadmin" (case-insensitive)
    if (email.toLowerCase().includes('superadmin')) {
      throw new Error('Email addresses containing "superadmin" are restricted and not allowed for registration');
    }
    
    console.log('Attempting to create user with:', { email, fullName }); // Debug log
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User created successfully:', user.uid); // Debug log
    
    // Update user profile with full name
    await updateProfile(user, {
      displayName: fullName
    });
    
    // Create user profile document in Firestore with userType: 2 (regular user)
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: fullName,
      userType: 2, // 2 = regular user
      createdAt: new Date().toISOString(),
      lastSignIn: new Date().toISOString(),
      photoURL: '',
      role: 'user'
    });
    
    console.log('User profile created successfully in Firestore'); // Debug log
    return user;
  } catch (error: any) {
    console.error('Sign up error:', error); // Debug log
    throw new Error(error.message || 'Failed to create account');
  }
};

// Sign in with email and password
export const signIn = async ({ email, password }: LoginData): Promise<{ user: User; userData: any }> => {
  try {
    console.log('Attempting regular user login...', { email });
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data from Firestore to check userType
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Sign out the user and throw error
      await signOut(auth);
      throw new Error('User data not found. Please contact support.');
    }
    
    const userData = userDoc.data();
    
    // Check if user is a regular user (userType: 2)
    if (userData.userType !== 2) {
      // Sign out the user since they shouldn't be logging in here
      await signOut(auth);
      throw new Error('Access denied: Please use the appropriate login portal');
    }
    
    // Update last sign in
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      lastSignIn: new Date().toISOString()
    }, { merge: true });
    
    console.log('Regular user login successful:', user.uid);
    return { user, userData };
  } catch (error: any) {
    console.error('Regular user login error:', error);
    // Ensure we always throw an error to be caught by the UI
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<{ user: User; userData: any }> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    // Check if display name contains "superadmin" (case-insensitive)
    if (user.displayName && user.displayName.toLowerCase().includes('superadmin')) {
      // Sign out the user immediately
      await signOut(auth);
      throw new Error('The name "superadmin" is restricted and not allowed for registration');
    }
    
    // Check if email contains "superadmin" (case-insensitive)
    if (user.email && user.email.toLowerCase().includes('superadmin')) {
      // Sign out the user immediately
      await signOut(auth);
      throw new Error('Email addresses containing "superadmin" are restricted and not allowed for registration');
    }
    
    // Check if user document exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    let userData;
    
    if (!userDoc.exists()) {
      // Create new user document for Google sign-in users with userType: 2
      userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        userType: 2, // 2 = regular user
        createdAt: new Date().toISOString(),
        lastSignIn: new Date().toISOString(),
        photoURL: user.photoURL || '',
        role: 'user'
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log('New Google user profile created');
    } else {
      userData = userDoc.data();
      
      // Check if user is a regular user (userType: 2)
      if (userData.userType !== 2) {
        // Sign out the user since they shouldn't be logging in here
        await signOut(auth);
        throw new Error('Access denied: Please use the appropriate login portal');
      }
      
      // Update last sign in
      userData = {
        ...userData,
        lastSignIn: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
      console.log('Existing Google user login successful');
    }
    
    return { user, userData };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    // Ensure we always throw an error to be caught by the UI
    throw error;
  }
};

// Sign out
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Update user profile
export const updateUserProfile = async (data: UpdateUserData): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('No user is currently logged in');
    }

    // Update profile (displayName and photoURL)
    if (data.displayName !== undefined || data.photoURL !== undefined) {
      const profileData: UpdateProfileData = {};
      if (data.displayName !== undefined) profileData.displayName = data.displayName;
      if (data.photoURL !== undefined) profileData.photoURL = data.photoURL;
      
      await updateProfile(user, profileData);
    }

    // Update email if provided
    if (data.email && data.email !== user.email) {
      await updateEmail(user, data.email);
    }
  } catch (error: any) {
    console.error('Update profile error:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};

// Get user profile data
export const getUserProfile = () => {
  const user = getCurrentUser();
  if (!user) return null;
  
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    emailVerified: user.emailVerified,
    createdAt: user.metadata.creationTime,
    lastSignIn: user.metadata.lastSignInTime
  };
};

// Create superadmin user in Firebase
export const createSuperAdmin = async ({ email, password }: SuperAdminData): Promise<User> => {
  try {
    console.log('Creating superadmin user...', { email });
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with superadmin role
    await updateProfile(user, {
      displayName: 'Super Administrator'
    });
    
    // Store user data in Firestore with userType = 1
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: 'Super Administrator',
      userType: 1, // 1 = superadmin
      createdAt: new Date().toISOString(),
      lastSignIn: new Date().toISOString(),
      photoURL: '',
      role: 'superadmin'
    });
    
    console.log('Superadmin created successfully:', user.uid);
    return user;
  } catch (error: any) {
    console.error('Superadmin creation error:', error);
    throw new Error(error.message || 'Failed to create superadmin account');
  }
};

// Superadmin login
export const signInSuperAdmin = async ({ email, password }: SuperAdminData): Promise<{ user: User; userData: any }> => {
  try {
    console.log('Attempting superadmin login...', { email });
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data from Firestore to check userType
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }
    
    const userData = userDoc.data();
    
    // Check if user is superadmin
    if (userData.userType !== 1) {
      throw new Error('Access denied: Not a superadmin account');
    }
    
    // Update last sign in
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      lastSignIn: new Date().toISOString()
    }, { merge: true });
    
    console.log('Superadmin login successful:', user.uid);
    return { user, userData };
  } catch (error: any) {
    console.error('Superadmin login error:', error);
    throw new Error(error.message || 'Failed to authenticate superadmin');
  }
};

// Check if current user is superadmin
export const isSuperAdmin = async (): Promise<boolean> => {
  try {
    // Wait for auth state to be ready
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe(); // Clean up listener
        
        if (!user) {
          resolve(false);
          return;
        }
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            resolve(false);
            return;
          }
          
          const userData = userDoc.data();
          resolve(userData.userType === 1);
        } catch (error) {
          console.error('Error fetching user data:', error);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('Error checking superadmin status:', error);
    return false;
  }
};

// Auth error messages helper
export const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/invalid-login-credentials':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 8 characters with uppercase, number, and special character.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return 'An error occurred. Please try again.';
  }
};