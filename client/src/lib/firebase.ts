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
  if (database) {
    return true; // Already initialized
  }
  
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
    
    // Get existing app instance or create new one
    try {
      const existingApps = (window as any).firebase?.apps;
      if (existingApps && existingApps.length > 0) {
        app = existingApps[0];
      } else {
        app = initializeApp(firebaseConfig);
      }
    } catch (e) {
      // If we get an error about duplicate app, try to handle it gracefully
      if (e instanceof Error && e.message.includes('duplicate app')) {
        try {
          // Using any since Firebase v9 doesn't expose a getApp() method easily in modular API
          const firebaseInstance = (window as any).firebase;
          if (firebaseInstance && typeof firebaseInstance.app === 'function') {
            app = firebaseInstance.app();
          } else {
            throw new Error('Could not access existing Firebase app instance');
          }
        } catch (innerError) {
          console.error('Error accessing existing Firebase app:', innerError);
          return false;
        }
      } else {
        throw e; // Re-throw if it's not a duplicate app error
      }
    }
    
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

export interface SensorData {
  temperature: number;
  humidity: number;
  light?: number;
  timestamp: number;
}

export interface SensorHistory {
  [timestamp: number]: {
    temperature: number;
    humidity: number;
    light?: number;
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
    
    // In your database structure, temperature and humidity are direct children of sensorData/current
    if (snapshot.exists()) {
      const sensorValues = snapshot.val();
      console.log('Raw sensor data:', sensorValues);
      
      // Extract values according to your database structure
      // If they're direct fields, they'll be in the snapshot value
      const temperature = sensorValues.temperature;
      const humidity = sensorValues.humidity;
      const light = sensorValues.light;
      
      // Construct a SensorData object with the current time as timestamp
      const data: SensorData = {
        temperature: typeof temperature === 'number' ? temperature : 0,
        humidity: typeof humidity === 'number' ? humidity : 0,
        timestamp: Date.now()
      };
      
      // Add light if it exists
      if (typeof light === 'number') {
        data.light = light;
      }
      
      console.log('Processed sensor data:', data);
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
    
    if (snapshot.exists()) {
      const historyData = snapshot.val();
      console.log('Raw history data:', typeof historyData);
      
      // Process the data according to the database structure
      const processedData: SensorHistory = {};
      
      // If historyData is an object with timestamp keys
      if (typeof historyData === 'object' && historyData !== null) {
        const entries = Object.entries(historyData);
        console.log(`Found ${entries.length} history entries to process`);
        
        for (const [key, value] of entries) {
          // Try to parse the key as a timestamp
          const timestamp = parseInt(key);
          
          // Skip invalid timestamps and entries outside the time range
          if (isNaN(timestamp) || timestamp < startTime || timestamp > endTime) {
            continue;
          }
          
          // Extract data based on structure (might be nested or flat)
          const entry = value as any;
          let temperature, humidity, light;
          
          if (entry.temperature !== undefined) {
            // Direct properties on the entry
            temperature = entry.temperature;
            humidity = entry.humidity;
            light = entry.light;
          } else if (entry.data && typeof entry.data === 'object') {
            // Nested under a 'data' property
            temperature = entry.data.temperature;
            humidity = entry.data.humidity;
            light = entry.data.light;
          }
          
          // Only add valid entries
          if (typeof temperature === 'number' || typeof humidity === 'number') {
            processedData[timestamp] = {
              temperature: typeof temperature === 'number' ? temperature : 0,
              humidity: typeof humidity === 'number' ? humidity : 0,
            };
            
            // Add light if available
            if (typeof light === 'number') {
              processedData[timestamp].light = light;
            }
          }
        }
      }
      
      console.log('Processed history data with', Object.keys(processedData).length, 'valid entries');
      callback(processedData);
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
