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
    // First try normal Firebase authentication
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
    } catch (authError) {
      console.log("Standard auth failed, checking for temp password...");
      
      // If normal auth fails, check if there's a temp password set for this user
      // Find the user by email first
      const usersRef = ref(database, 'users');
      const usersSnapshot = await get(usersRef);
      
      if (!usersSnapshot.exists()) {
        throw new Error("No users found");
      }
      
      let userId = '';
      
      // Find the user by email
      usersSnapshot.forEach((childSnapshot) => {
        const userProfile = childSnapshot.val() as UserProfile;
        if (userProfile.email === email) {
          userId = userProfile.uid;
        }
      });
      
      if (!userId) {
        throw new Error("Email not found");
      }
      
      // Check if there's a temporary password
      const tempPasswordRef = ref(database, `tempPasswords/${userId}`);
      const tempSnapshot = await get(tempPasswordRef);
      
      if (!tempSnapshot.exists()) {
        // No temp password found, throw the original error
        throw authError;
      }
      
      const tempData = tempSnapshot.val();
      
      if (tempData.password !== password) {
        // Password doesn't match
        throw new Error("Invalid temp password");
      }
      
      // Password matches, now we'll update the real password in Firebase
      try {
        // Create custom auth token (this would require Firebase Admin SDK in a real app)
        // For this demo, we'll reuse the same Firebase auth object but with updated credentials
        
        // Get user and update in database
        const userProfile = await getUserProfile(userId);
        
        if (!userProfile) {
          throw new Error("User profile not found");
        }
        
        // Clear the temp password as it's been used
        await set(tempPasswordRef, null);
        
        // For users logging in with a reset password, make sure they have an expertise level
        // This will skip the expertise selection screen
        try {
          // Set a default expertise level if needed
          if (!userProfile.expertiseLevel) {
            const defaultExpertiseLevel = 'beginner';
            await updateExpertiseLevel(userId, defaultExpertiseLevel);
            
            // Update the local profile
            userProfile.expertiseLevel = defaultExpertiseLevel;
          }
        } catch (err) {
          console.log("Could not set expertise level:", err);
          // Continue anyway
        }
        
        // Since we can't directly reset the password without user being authenticated,
        // we'll need to rely on the temp password mechanism for logging in
        return userProfile;
      } catch (resetError) {
        console.error("Error updating password:", resetError);
        throw resetError;
      }
    }
  } catch (error) {
    console.error("Error logging in with email:", error);
    throw error;
  }
};

// Password reset
export const resetPassword = async (email: string): Promise<string> => {
  try {
    // Check if user exists with this email first
    const userRef = ref(database, 'users');
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error("User not found");
    }
    
    let userId = '';
    let userData: UserProfile | null = null;
    
    // Find the user by email
    snapshot.forEach((childSnapshot) => {
      const userProfile = childSnapshot.val();
      if (userProfile && userProfile.email === email) {
        userId = userProfile.uid;
        userData = userProfile as UserProfile;
      }
    });
    
    if (!userId || !userData) {
      throw new Error("Email not found");
    }
    
    // Generate a new random password (not very secure but simple for this demo)
    const newPassword = generateRandomPassword();
    
    // Sign in with custom token or admin SDK would be needed for a real solution
    // For this demo, we'll just update the database password
    
    try {
      // Since Firebase Auth doesn't let us directly update passwords without auth,
      // for this demo we'll create a special entry in the database for temp passwords
      const tempPasswordRef = ref(database, `tempPasswords/${userId}`);
      await set(tempPasswordRef, {
        email: email,
        password: newPassword,
        timestamp: Date.now()
      });
      
      // Make sure the user has an expertise level to skip that screen after login
      try {
        // Try to set a default expertise level to skip the expertise selection screen
        const defaultExpertiseLevel = 'beginner';
        await updateExpertiseLevel(userId, defaultExpertiseLevel);
      } catch (error) {
        console.log("Could not set default expertise level:", error);
        // Continue anyway, not critical
      }
      
      return newPassword;
    } catch (resetError) {
      console.error("Failed to reset password:", resetError);
      throw resetError;
    }
  } catch (error) {
    console.error("Error in password reset process:", error);
    throw error;
  }
};

// Generate a random password
function generateRandomPassword(): string {
  const length = 8;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};