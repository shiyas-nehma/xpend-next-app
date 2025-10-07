import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  User
} from 'firebase/auth';
import { auth } from './config';
import { LoginFormData, SignupFormData } from '@/lib/validations/auth';

// Sign up with email and password
export const signUp = async ({ email, password, fullName }: Omit<SignupFormData, 'confirmPassword'>): Promise<User> => {
  try {
    console.log('Attempting to create user with:', { email, fullName }); // Debug log
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User created successfully:', user.uid); // Debug log
    
    // Update user profile with full name
    await updateProfile(user, {
      displayName: fullName
    });
    
    console.log('Profile updated successfully'); // Debug log
    return user;
  } catch (error: unknown) {
    console.error('Sign up error:', error); // Debug log
    const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
    throw new Error(errorMessage);
  }
};

// Sign in with email and password
export const signIn = async ({ email, password }: LoginFormData): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
    throw new Error(errorMessage);
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
    throw new Error(errorMessage);
  }
};

// Sign out
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
    throw new Error(errorMessage);
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Auth error messages helper
export const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    default:
      return 'An error occurred. Please try again.';
  }
};