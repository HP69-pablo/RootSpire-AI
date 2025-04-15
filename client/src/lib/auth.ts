import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { 
  getAuth,
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { getDatabase, ref, set, get } from "firebase/database";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// Initialize Firebase only if it hasn't been initialized yet
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const database = getDatabase(app);

// Google auth provider
const googleProvider = new GoogleAuthProvider();

// Expertise levels
export const EXPERTISE_LEVELS = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'I\'m new to plant care and learning the basics'
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'I have some experience with common house plants'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'I\'m experienced with a variety of plants and growing techniques'
  },
  {
    id: 'expert',
    name: 'Expert',
    description: 'I have professional or extensive knowledge of horticulture'
  }
];

// User profile interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  expertiseLevel?: string;
  plants?: UserPlant[];
  createdAt: number;
}

// User plant interface
export interface UserPlant {
  id: string;
  name: string;
  species: string;
  addedAt: number;
  imageUrl?: string;
  lastWatered?: number;
  notes?: string;
  health?: 'excellent' | 'good' | 'fair' | 'poor';
}

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserProfile | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user profile exists, create if not
    const userProfile = await getUserProfile(user.uid);
    
    if (!userProfile) {
      // Create new user profile
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: Date.now(),
      };
      
      await saveUserProfile(newProfile);
      return newProfile;
    }
    
    return userProfile;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    return null;
  }
};

// Get user profile from database
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

// Save user profile to database
export const saveUserProfile = async (profile: UserProfile): Promise<boolean> => {
  try {
    const userRef = ref(database, `users/${profile.uid}`);
    await set(userRef, profile);
    return true;
  } catch (error) {
    console.error("Error saving user profile:", error);
    return false;
  }
};

// Update user expertise level
export const updateExpertiseLevel = async (uid: string, level: string): Promise<boolean> => {
  try {
    const userRef = ref(database, `users/${uid}/expertiseLevel`);
    await set(userRef, level);
    return true;
  } catch (error) {
    console.error("Error updating expertise level:", error);
    return false;
  }
};

// Add a plant to user's collection
export const addUserPlant = async (uid: string, plant: UserPlant): Promise<boolean> => {
  try {
    const userPlantsRef = ref(database, `users/${uid}/plants/${plant.id}`);
    await set(userPlantsRef, plant);
    return true;
  } catch (error) {
    console.error("Error adding user plant:", error);
    return false;
  }
};

// Sign out user
export const userSignOut = async (): Promise<boolean> => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Error signing out:", error);
    return false;
  }
};

// Auth state change subscription
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Email registration
export const registerWithEmail = async (
  email: string, 
  password: string, 
  displayName: string
): Promise<UserProfile | null> => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user's display name
    await updateProfile(user, { displayName });
    
    // Create and save user profile
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: displayName,
      photoURL: user.photoURL || '',
      createdAt: Date.now(),
    };
    
    await saveUserProfile(newProfile);
    return newProfile;
  } catch (error) {
    console.error("Error registering with email:", error);
    throw error;
  }
};

// Email login
export const loginWithEmail = async (
  email: string, 
  password: string
): Promise<UserProfile | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user profile or create if it doesn't exist
    let userProfile = await getUserProfile(user.uid);
    
    if (!userProfile) {
      // Create profile if it doesn't exist (rare case)
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: Date.now(),
      };
      
      await saveUserProfile(newProfile);
      return newProfile;
    }
    
    return userProfile;
  } catch (error) {
    console.error("Error logging in with email:", error);
    throw error;
  }
};

// Password reset
export const resetPassword = async (email: string): Promise<boolean> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};