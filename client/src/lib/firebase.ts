import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, DataSnapshot, set, get } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL?.replace('firebaseddatabase', 'firebasedatabase'), // Fix typo in URL if present
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Log any missing configurations
const missingConfigs = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingConfigs.length > 0) {
  console.error('Missing Firebase configuration:', missingConfigs.join(', '));
}

// Initialize Firebase app and database at module level
let app: any;
let database: any;

// Generate sample data for testing
function generateSampleData() {
  if (!database) {
    console.error('Cannot generate sample data: database not initialized');
    return;
  }
  
  console.log('Checking if sample data needs to be generated...');
  
  // Check if data already exists
  const currentRef = ref(database, 'sensorData/current');
  get(currentRef).then((snapshot: any) => {
    console.log('Current sensor data check result:', snapshot.exists() ? 'Data exists' : 'No data exists');
    
    if (!snapshot.exists()) {
      // Create current sensor data
      const currentData: SensorData = {
        temperature: 23.5,
        humidity: 48,
        timestamp: Date.now()
      };
      console.log('Attempting to create sample current data:', currentData);
      
      set(currentRef, currentData)
        .then(() => console.log('Successfully created sample current sensor data'))
        .catch((err: Error) => console.error('Error creating current data:', err));
      
      // Create history data (last 24 hours)
      const historyData: SensorHistory = {};
      const now = Date.now();
      const hourMs = 60 * 60 * 1000;
      
      // Generate 24 data points, one for each hour
      for (let i = 0; i < 24; i++) {
        const time = now - (i * hourMs);
        historyData[time] = {
          temperature: 20 + Math.random() * 8, // 20-28°C
          humidity: 40 + Math.random() * 20    // 40-60%
        };
      }
      
      console.log('Attempting to create sample history data with', Object.keys(historyData).length, 'data points');
      
      const historyRef = ref(database, 'sensorData/history');
      set(historyRef, historyData)
        .then(() => console.log('Successfully created sample history data'))
        .catch((err: Error) => console.error('Error creating history data:', err));
    }
  }).catch((error: Error) => {
    console.error('Error checking/creating sample data:', error);
  });
  
  // Initialize control values if they don't exist
  const controlsRef = ref(database, 'plantControls');
  get(controlsRef).then((snapshot: any) => {
    if (!snapshot.exists()) {
      const initialControls = {
        uvLight: false,
        wateringActive: false
      };
      
      set(controlsRef, initialControls)
        .then(() => console.log('Successfully initialized plant controls'))
        .catch((err: Error) => console.error('Error initializing controls:', err));
    }
  }).catch((error: Error) => {
    console.error('Error checking/creating control data:', error);
  });
}

export function initializeFirebase() {
  if (!app) {
    try {
      // Log Firebase config (without sensitive values)
      console.log('Initializing Firebase with config:', {
        databaseURL: firebaseConfig.databaseURL,
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        storageBucket: firebaseConfig.storageBucket,
        hasApiKey: !!firebaseConfig.apiKey,
        hasAppId: !!firebaseConfig.appId,
        hasMessagingSenderId: !!firebaseConfig.messagingSenderId
      });
      
      app = initializeApp(firebaseConfig);
      database = getDatabase(app);
      console.log('Firebase initialized successfully, database reference:', !!database);
      
      // If successful, try to generate sample data
      try {
        generateSampleData();
      } catch (e) {
        console.error('Error generating sample data:', e);
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      return false;
    }
  }
  return !!database;
}

export interface SensorData {
  temperature: number;
  humidity: number;
  timestamp: number;
}

export interface SensorHistory {
  [timestamp: number]: {
    temperature: number;
    humidity: number;
  };
}

// Subscribe to real-time sensor data
export function subscribeSensorData(callback: (data: SensorData) => void) {
  if (!database) {
    console.error('Firebase database not initialized when trying to subscribe to sensor data');
    return () => {};
  }

  console.log('Setting up subscription to real-time sensor data at path: sensorData/current');
  const sensorRef = ref(database, 'sensorData/current');
  
  const unsubscribe = onValue(sensorRef, (snapshot: DataSnapshot) => {
    console.log('Got sensor data update, snapshot exists:', snapshot.exists());
    
    const data = snapshot.val() as SensorData | null;
    if (data) {
      console.log('Received sensor data:', data);
      callback(data);
    } else {
      console.log('No sensor data available in snapshot');
      
      // Since we didn't get any data, let's try to create sample data
      console.log('Attempting to create initial sample data since none exists');
      generateSampleData();
    }
  }, (error) => {
    console.error('Error subscribing to sensor data:', error);
  });

  return unsubscribe;
}

// Get sensor history data
export function getSensorHistory(days: number, callback: (data: SensorHistory) => void) {
  if (!database) {
    console.error('Firebase database not initialized when trying to get history data');
    return () => {};
  }

  // Calculate time range
  const endTime = Date.now();
  const startTime = endTime - (days * 24 * 60 * 60 * 1000);
  console.log(`Setting up subscription to history data at path: sensorData/history (for ${days} days)`);
  
  const historyRef = ref(database, 'sensorData/history');
  const unsubscribe = onValue(historyRef, (snapshot: DataSnapshot) => {
    console.log('Got history data update, snapshot exists:', snapshot.exists());
    
    const allData = snapshot.val() as SensorHistory | null;
    if (allData) {
      console.log('Received history data with', Object.keys(allData).length, 'entries');
      
      // Filter data based on the time range
      const filteredData: SensorHistory = {};
      Object.keys(allData).forEach(timestamp => {
        const ts = parseInt(timestamp);
        if (ts >= startTime && ts <= endTime) {
          filteredData[ts] = allData[ts];
        }
      });
      
      console.log('Filtered history data to', Object.keys(filteredData).length, 'entries within time range');
      callback(filteredData);
    } else {
      console.log('No history data available in snapshot');
      callback({});
    }
  }, (error) => {
    console.error('Error getting sensor history:', error);
  });

  return unsubscribe;
}

// Plant controls interface
export interface PlantControls {
  uvLight: boolean;
  wateringActive: boolean;
}

// Subscribe to plant controls
export function subscribePlantControls(callback: (controls: PlantControls) => void) {
  if (!database) {
    console.error('Firebase database not initialized when trying to subscribe to plant controls');
    return () => {};
  }

  console.log('Setting up subscription to plant controls at path: plantControls');
  const controlsRef = ref(database, 'plantControls');
  
  const unsubscribe = onValue(controlsRef, (snapshot: DataSnapshot) => {
    console.log('Got plant controls update, snapshot exists:', snapshot.exists());
    
    const controls = snapshot.val() as PlantControls | null;
    if (controls) {
      console.log('Received plant controls:', controls);
      callback(controls);
    } else {
      console.log('No plant controls available in snapshot');
      
      // Initialize controls if they don't exist
      const initialControls: PlantControls = {
        uvLight: false,
        wateringActive: false
      };
      
      set(controlsRef, initialControls)
        .then(() => {
          console.log('Successfully initialized plant controls');
          callback(initialControls);
        })
        .catch((err: Error) => console.error('Error initializing controls:', err));
    }
  }, (error) => {
    console.error('Error subscribing to plant controls:', error);
  });

  return unsubscribe;
}

// Set UV light state
export function setUvLight(state: boolean): Promise<void> {
  if (!database) {
    console.error('Firebase database not initialized when trying to set UV light state');
    return Promise.reject(new Error('Database not initialized'));
  }

  console.log(`Setting UV light state to: ${state}`);
  const uvLightRef = ref(database, 'plantControls/uvLight');
  return set(uvLightRef, state);
}

// Set watering active state
export function setWateringActive(state: boolean): Promise<void> {
  if (!database) {
    console.error('Firebase database not initialized when trying to set watering state');
    return Promise.reject(new Error('Database not initialized'));
  }

  console.log(`Setting watering state to: ${state}`);
  const wateringRef = ref(database, 'plantControls/wateringActive');
  return set(wateringRef, state);
}
