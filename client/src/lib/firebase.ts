import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, DataSnapshot, set, get } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firebase configuration with hardcoded values as requested
const firebaseConfig = {
  apiKey: "AIzaSyBwe24dNvuyeso79qoK-fuKpW4V14lYR9c",
  authDomain: "smart-plant-12444.firebaseapp.com",
  databaseURL: "https://smart-plant-12444-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "smart-plant-12444",
  storageBucket: "smart-plant-12444.firebasestorage.app",
  messagingSenderId: "940454794399",
  appId: "1:940454794399:web:8fa46e73bc987479c6feaa"
};

// Log any missing configurations
const missingConfigs = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingConfigs.length > 0) {
  console.error('Missing Firebase configuration:', missingConfigs.join(', '));
}

// Initialize Firebase app and database at module level 
import { getApp, getApps } from 'firebase/app';

// Use these variables to store our Firebase instances
let app: any;
let database: any;

// Initialize Firebase immediately to prevent multiple initialization attempts
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  database = getDatabase(app);
  console.log('Firebase initialized on module load');
} catch (error) {
  console.error('Error initializing Firebase on module load:', error);
}

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

// Subscribe to real-time sensor data using the specific paths provided:
// /sensorData/current/temperature
// /sensorData/current/humidity
// /sensorData/current/Light
export function subscribeSensorData(callback: (data: SensorData) => void) {
  if (!database) {
    console.error('Firebase database not initialized when trying to subscribe to sensor data');
    return () => {};
  }

  console.log('Setting up subscription to real-time sensor data according to specific paths');
  
  // Individual references for temperature, humidity, and light
  const temperatureRef = ref(database, 'sensorData/current/temperature');
  const humidityRef = ref(database, 'sensorData/current/humidity');
  const lightRef = ref(database, 'sensorData/current/Light'); // Note: "Light" with capital L as specified
  
  // Initialize the data object
  let sensorData: SensorData = {
    temperature: 0,
    humidity: 0,
    timestamp: Date.now()
  };
  
  // Track how many sensors have reported so we can send the complete data
  let sensorsReported = 0;
  
  // Subscribe to temperature updates
  const tempUnsubscribe = onValue(temperatureRef, (snapshot: DataSnapshot) => {
    console.log('Got temperature update, snapshot exists:', snapshot.exists());
    
    if (snapshot.exists()) {
      const temperature = snapshot.val();
      if (typeof temperature === 'number') {
        sensorData.temperature = temperature;
        console.log('Updated temperature value:', temperature);
      }
    }
    
    sensorsReported++;
    if (sensorsReported >= 3) {
      sensorData.timestamp = Date.now();
      callback(sensorData);
      sensorsReported = 0;
    }
  }, (error) => {
    console.error('Error subscribing to temperature data:', error);
  });
  
  // Subscribe to humidity updates
  const humidityUnsubscribe = onValue(humidityRef, (snapshot: DataSnapshot) => {
    console.log('Got humidity update, snapshot exists:', snapshot.exists());
    
    if (snapshot.exists()) {
      const humidity = snapshot.val();
      if (typeof humidity === 'number') {
        sensorData.humidity = humidity;
        console.log('Updated humidity value:', humidity);
      }
    }
    
    sensorsReported++;
    if (sensorsReported >= 3) {
      sensorData.timestamp = Date.now();
      callback(sensorData);
      sensorsReported = 0;
    }
  }, (error) => {
    console.error('Error subscribing to humidity data:', error);
  });
  
  // Subscribe to light updates
  const lightUnsubscribe = onValue(lightRef, (snapshot: DataSnapshot) => {
    console.log('Got light update, snapshot exists:', snapshot.exists());
    
    if (snapshot.exists()) {
      const light = snapshot.val();
      if (typeof light === 'number') {
        sensorData.light = light;
        console.log('Updated light value:', light);
      }
    }
    
    sensorsReported++;
    if (sensorsReported >= 3) {
      sensorData.timestamp = Date.now();
      callback(sensorData);
      sensorsReported = 0;
    }
  }, (error) => {
    console.error('Error subscribing to light data:', error);
  });

  // Return a combined unsubscribe function
  return () => {
    tempUnsubscribe();
    humidityUnsubscribe();
    lightUnsubscribe();
  };
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

// Initialize storage
let storage: any;
try {
  storage = getStorage(app);
  console.log('Firebase Storage initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Storage:', error);
}

// Upload plant photo to Firebase Storage and get download URL
export async function uploadPlantPhoto(
  userId: string, 
  plantId: string, 
  file: File
): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    // Create a reference to the file in Firebase Storage
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const path = `users/${userId}/plants/${plantId}/${timestamp}.${fileExtension}`;
    const fileRef = storageRef(storage, path);
    
    console.log(`Uploading plant photo to path: ${path}`);
    
    // Upload the file to Firebase Storage
    const snapshot = await uploadBytes(fileRef, file);
    console.log('Photo uploaded successfully:', snapshot.metadata.fullPath);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(fileRef);
    console.log('Photo download URL:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading plant photo:', error);
    throw error;
  }
}

// Update plant data in Firebase including image URL and AI analysis results
export async function updatePlantData(
  userId: string, 
  plantId: string, 
  data: { imageUrl?: string; species?: string; notes?: string; health?: string }
): Promise<void> {
  if (!database) {
    throw new Error('Database not initialized');
  }

  try {
    const plantRef = ref(database, `users/${userId}/plants/${plantId}`);
    
    // Get current plant data
    const snapshot = await get(plantRef);
    const currentData = snapshot.exists() ? snapshot.val() : {};
    
    // Merge with new data
    const updatedData = { ...currentData, ...data };
    
    console.log(`Updating plant data for plant ${plantId}:`, updatedData);
    await set(plantRef, updatedData);
    console.log('Plant data updated successfully');
  } catch (error) {
    console.error('Error updating plant data:', error);
    throw error;
  }
}
