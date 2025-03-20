import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, DataSnapshot, set, get } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase app and database at module level
let app: any;
let database: any;

// Generate sample data for testing
function generateSampleData() {
  if (!database) return;
  
  // Check if data already exists
  const currentRef = ref(database, 'sensorData/current');
  get(currentRef).then((snapshot: any) => {
    if (!snapshot.exists()) {
      // Create current sensor data
      const currentData: SensorData = {
        temperature: 23.5,
        humidity: 48,
        soilMoisture: 35,
        timestamp: Date.now()
      };
      set(currentRef, currentData)
        .then(() => console.log('Created sample current sensor data'))
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
          humidity: 40 + Math.random() * 20,   // 40-60%
          soilMoisture: 25 + Math.random() * 30 // 25-55%
        };
      }
      
      const historyRef = ref(database, 'sensorData/history');
      set(historyRef, historyData)
        .then(() => console.log('Created sample history data'))
        .catch((err: Error) => console.error('Error creating history data:', err));
    }
  }).catch((error: Error) => {
    console.error('Error checking/creating sample data:', error);
  });
}

export function initializeFirebase() {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      database = getDatabase(app);
      console.log('Firebase initialized successfully');
      
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
  soilMoisture: number;
  timestamp: number;
}

export interface SensorHistory {
  [timestamp: number]: {
    temperature: number;
    humidity: number;
    soilMoisture: number;
  };
}

// Subscribe to real-time sensor data
export function subscribeSensorData(callback: (data: SensorData) => void) {
  if (!database) {
    console.error('Firebase database not initialized');
    return () => {};
  }

  const sensorRef = ref(database, 'sensorData/current');
  const unsubscribe = onValue(sensorRef, (snapshot: DataSnapshot) => {
    const data = snapshot.val() as SensorData | null;
    if (data) {
      callback(data);
    } else {
      console.log('No sensor data available');
    }
  }, (error) => {
    console.error('Error subscribing to sensor data:', error);
  });

  return unsubscribe;
}

// Get sensor history data
export function getSensorHistory(days: number, callback: (data: SensorHistory) => void) {
  if (!database) {
    console.error('Firebase database not initialized');
    return () => {};
  }

  // Calculate time range
  const endTime = Date.now();
  const startTime = endTime - (days * 24 * 60 * 60 * 1000);
  
  const historyRef = ref(database, 'sensorData/history');
  const unsubscribe = onValue(historyRef, (snapshot: DataSnapshot) => {
    const allData = snapshot.val() as SensorHistory | null;
    if (allData) {
      // Filter data based on the time range
      const filteredData: SensorHistory = {};
      Object.keys(allData).forEach(timestamp => {
        const ts = parseInt(timestamp);
        if (ts >= startTime && ts <= endTime) {
          filteredData[ts] = allData[ts];
        }
      });
      callback(filteredData);
    } else {
      console.log('No history data available');
      callback({});
    }
  }, (error) => {
    console.error('Error getting sensor history:', error);
  });

  return unsubscribe;
}
