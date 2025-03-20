import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, DataSnapshot } from 'firebase/database';

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

let app: any;
let database: any;

export function initializeFirebase() {
  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
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
