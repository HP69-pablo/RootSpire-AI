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
export let database: any;
let storage: any;
let firebaseInitialized = false;

// Initialize Firebase immediately to prevent multiple initialization attempts
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  database = getDatabase(app);
  storage = getStorage(app);
  firebaseInitialized = true;
  console.log('Firebase initialized on module load');
  console.log('Firebase Storage initialized successfully');
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
    
    // Initialize Firebase Storage if not already initialized
    if (!storage) {
      storage = getStorage(app);
    }
    
    console.log('Firebase initialized successfully, database reference:', !!database);
    
    // If successful, try to generate sample data
    try {
      generateSampleData();
    } catch (e) {
      console.error('Error generating sample data:', e);
    }
    
    // Try to cache plant images in Firebase Storage (will run in background)
    try {
      downloadPlantTypesImages().catch(error => {
        console.warn('Plant image caching completed with some errors:', error);
      });
    } catch (cacheError) {
      console.warn('Error starting plant image cache process:', cacheError);
      // Non-critical error, don't let it prevent app initialization
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
  soilMoisture?: number;
  timestamp: number;
}

export interface SensorHistory {
  [timestamp: number]: {
    temperature: number;
    humidity: number;
    light?: number;
    soilMoisture?: number;
  };
}

export interface MetricHistoryPoint {
  timestamp: number;
  value: number;
}

export interface PlantHistoryData {
  timestamp: number;
  temperature?: number;
  humidity?: number;
  light?: number;
  soilMoisture?: number;
}

// Get historical data for a specific metric
export async function getMetricHistory(
  metric: 'temperature' | 'humidity' | 'light' | 'soilMoisture',
  days: number = 1,
  plantId: string = 'default'
): Promise<MetricHistoryPoint[]> {
  if (!database) {
    console.error('Firebase database not initialized when trying to get metric history');
    return [];
  }
  
  try {
    // Get reference to history data
    const historyRef = ref(database, 'sensorData/history');
    
    // Get snapshot of history data
    const snapshot = await get(historyRef);
    
    if (!snapshot.exists()) {
      console.warn('No history data found for metric:', metric);
      await generateSensorHistory();
      return [];
    }
    
    const historyData = snapshot.val();
    
    // Calculate time range
    const endTime = Date.now();
    const startTime = endTime - (days * 24 * 60 * 60 * 1000);
    
    // Process and filter data
    const result: MetricHistoryPoint[] = [];
    
    // Convert to array and sort
    Object.keys(historyData)
      .map(ts => parseInt(ts))
      .filter(ts => ts >= startTime && ts <= endTime)
      .sort((a, b) => a - b)
      .forEach(ts => {
        const entry = historyData[ts];
        if (entry && typeof entry[metric] === 'number') {
          result.push({
            timestamp: ts,
            value: entry[metric]
          });
        }
      });
    
    return result;
  } catch (error) {
    console.error(`Error getting ${metric} history:`, error);
    return [];
  }
}

// Get all metrics history data as an array of data points
export async function getAllMetricsHistory(
  days: number = 1,
  plantId: string = 'default'
): Promise<PlantHistoryData[]> {
  if (!database) {
    console.error('Firebase database not initialized when trying to get all metrics history');
    return [];
  }
  
  try {
    // First, try to get data from the timestamps folder
    const timestampsRef = ref(database, 'timestamps');
    
    // Get snapshot of timestamps data
    const timestampsSnapshot = await get(timestampsRef);
    
    if (timestampsSnapshot.exists()) {
      console.log('Found data in timestamps folder, using that for metrics history');
      const timestampsData = timestampsSnapshot.val();
      
      // Calculate time range
      const endTime = Date.now();
      const startTime = endTime - (days * 24 * 60 * 60 * 1000);
      
      // Process and filter data
      const result: PlantHistoryData[] = [];
      
      // Convert to array and sort
      Object.keys(timestampsData)
        .map(ts => parseInt(ts))
        .filter(ts => ts >= startTime && ts <= endTime)
        .sort((a, b) => a - b)
        .forEach(ts => {
          const entry = timestampsData[ts];
          if (entry) {
            result.push({
              timestamp: ts,
              temperature: entry.temperature,
              humidity: entry.humidity,
              light: entry.light,
              soilMoisture: entry.soilMoisture
            });
          }
        });
      
      console.log(`Retrieved ${result.length} data points from timestamps folder`);
      return result;
    }
    
    // If no timestamps data found, fallback to the old history data
    console.log('No data found in timestamps folder, falling back to history data');
    
    // Get reference to history data
    const historyRef = ref(database, 'sensorData/history');
    
    // Get snapshot of history data
    const snapshot = await get(historyRef);
    
    if (!snapshot.exists()) {
      console.warn('No history data found');
      await generateSensorHistory();
      return [];
    }
    
    const historyData = snapshot.val();
    
    // Calculate time range
    const endTime = Date.now();
    const startTime = endTime - (days * 24 * 60 * 60 * 1000);
    
    // Process and filter data
    const result: PlantHistoryData[] = [];
    
    // Convert to array and sort
    Object.keys(historyData)
      .map(ts => parseInt(ts))
      .filter(ts => ts >= startTime && ts <= endTime)
      .sort((a, b) => a - b)
      .forEach(ts => {
        const entry = historyData[ts];
        if (entry) {
          result.push({
            timestamp: ts,
            temperature: entry.temperature,
            humidity: entry.humidity,
            light: entry.light,
            soilMoisture: entry.soilMoisture
          });
        }
      });
    
    return result;
  } catch (error) {
    console.error('Error getting all metrics history:', error);
    return [];
  }
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
  
  // Individual references for temperature, humidity, light and soil moisture
  const temperatureRef = ref(database, 'sensorData/current/temperature');
  const humidityRef = ref(database, 'sensorData/current/humidity');
  const lightRef = ref(database, 'sensorData/current/Light'); // Note: "Light" with capital L as specified
  const soilMoistureRef = ref(database, 'sensorData/current/soilMoister'); // Note: "soilMoister" as specified
  
  // Initialize the data object
  let sensorData: SensorData = {
    temperature: 0,
    humidity: 0,
    timestamp: Date.now()
  };
  
  // Subscribe to temperature updates
  const tempUnsubscribe = onValue(temperatureRef, (snapshot: DataSnapshot) => {
    console.log('Got temperature update, snapshot exists:', snapshot.exists());
    
    if (snapshot.exists()) {
      const temperature = snapshot.val();
      if (typeof temperature === 'number') {
        sensorData.temperature = temperature;
        console.log('Updated temperature value:', temperature);
        
        // Call callback immediately with updated data for real-time updates
        sensorData.timestamp = Date.now();
        callback({...sensorData}); // Create a new object to trigger state update
      }
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
        
        // Call callback immediately with updated data for real-time updates
        sensorData.timestamp = Date.now();
        callback({...sensorData}); // Create a new object to trigger state update
      }
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
        
        // Call callback immediately with updated data for real-time updates
        sensorData.timestamp = Date.now();
        callback({...sensorData}); // Create a new object to trigger state update
      }
    }
  }, (error) => {
    console.error('Error subscribing to light data:', error);
  });
  
  // Subscribe to soil moisture updates
  const soilMoistureUnsubscribe = onValue(soilMoistureRef, (snapshot: DataSnapshot) => {
    console.log('Got soil moisture update, snapshot exists:', snapshot.exists());
    
    if (snapshot.exists()) {
      const soilMoisture = snapshot.val();
      if (typeof soilMoisture === 'number') {
        sensorData.soilMoisture = soilMoisture;
        console.log('Updated soil moisture value:', soilMoisture);
        
        // Call callback immediately with updated data for real-time updates
        sensorData.timestamp = Date.now();
        callback({...sensorData}); // Create a new object to trigger state update
      }
    }
  }, (error) => {
    console.error('Error subscribing to soil moisture data:', error);
  });

  // Return a combined unsubscribe function
  return () => {
    tempUnsubscribe();
    humidityUnsubscribe();
    lightUnsubscribe();
    soilMoistureUnsubscribe();
  };
}

// Generate and store sensor history data
export async function generateSensorHistory(): Promise<void> {
  if (!database) {
    console.error('Firebase database not initialized when trying to generate history data');
    return;
  }

  try {
    // Get current sensor data as a base
    const tempRef = ref(database, 'sensorData/current/temperature');
    const humidityRef = ref(database, 'sensorData/current/humidity');
    const lightRef = ref(database, 'sensorData/current/Light');
    const soilMoistureRef = ref(database, 'sensorData/current/soilMoister');
    
    const tempSnapshot = await get(tempRef);
    const humiditySnapshot = await get(humidityRef);
    const lightSnapshot = await get(lightRef);
    const soilMoistureSnapshot = await get(soilMoistureRef);
    
    const baseTemp = tempSnapshot.exists() ? tempSnapshot.val() : 22;
    const baseHumidity = humiditySnapshot.exists() ? humiditySnapshot.val() : 50;
    const baseLight = lightSnapshot.exists() ? lightSnapshot.val() : 70;
    const baseSoilMoisture = soilMoistureSnapshot.exists() ? soilMoistureSnapshot.val() : 60;
    
    // Generate 24 hours of data with slight variations
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const historyData: SensorHistory = {};
    
    // Clear existing history first
    const historyRef = ref(database, 'sensorData/history');
    await set(historyRef, null);
    
    // Generate data points for the last 24 hours
    for (let i = 0; i < 24; i++) {
      const timestamp = now - (i * hourMs);
      
      // Create variations based on time of day
      // Morning (6-12): increasing temp and light
      // Afternoon (12-18): high temp and light
      // Evening (18-24): decreasing temp and light
      // Night (0-6): low temp and light
      const hour = new Date(timestamp).getHours();
      
      let tempVariation = 0;
      let lightVariation = 0;
      
      if (hour >= 6 && hour < 12) {
        // Morning - rising
        tempVariation = ((hour - 6) / 6) * 8;  // 0 to 8 degree increase
        lightVariation = ((hour - 6) / 6) * 40;  // 0 to 40% increase
      } else if (hour >= 12 && hour < 18) {
        // Afternoon - steady high
        tempVariation = 8 - ((hour - 12) / 6) * 2;  // 8 to 6 degree increase
        lightVariation = 40 - ((hour - 12) / 6) * 10;  // 40 to 30% increase
      } else if (hour >= 18 && hour < 24) {
        // Evening - falling
        tempVariation = 6 - ((hour - 18) / 6) * 6;  // 6 to 0 degree increase
        lightVariation = 30 - ((hour - 18) / 6) * 30;  // 30 to 0% increase
      } else {
        // Night - low
        tempVariation = -3 + ((hour) / 6) * 3;  // -3 to 0 degree change
        lightVariation = -30;  // 30% decrease
      }
      
      // Apply random noise
      const tempNoise = Math.random() * 4 - 2;  // -2 to +2
      const humidityNoise = Math.random() * 10 - 5;  // -5 to +5
      const lightNoise = Math.random() * 10 - 5;  // -5 to +5
      const soilMoistureNoise = Math.random() * 8 - 4;  // -4 to +4
      
      // Calculate final values with bounds
      const finalTemp = Math.max(10, Math.min(35, baseTemp + tempVariation + tempNoise));
      const finalHumidity = Math.max(20, Math.min(90, baseHumidity + humidityNoise));
      const finalLight = Math.max(5, Math.min(100, baseLight + lightVariation + lightNoise));
      const finalSoilMoisture = Math.max(10, Math.min(95, baseSoilMoisture + soilMoistureNoise));
      
      // Save to history object
      historyData[timestamp] = {
        temperature: Math.round(finalTemp),
        humidity: Math.round(finalHumidity),
        light: Math.round(finalLight),
        soilMoisture: Math.round(finalSoilMoisture)
      };
    }
    
    // Save to Firebase
    await set(historyRef, historyData);
    console.log('Successfully generated and stored 24 hours of sensor history data');
    
  } catch (error) {
    console.error('Error generating sensor history:', error);
  }
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
  
  // Set up real-time listener for sensor data in the timestamps folder
  console.log(`Setting up subscription to timestamps data for the last ${days} days`);
  const timestampsRef = ref(database, 'timestamps');
  
  const unsubscribe = onValue(timestampsRef, (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      // Process timestamp data
      const timestampsData = snapshot.val();
      console.log('Found timestamp data, using for visualization');
      
      // Process the data according to the database structure
      const processedData: SensorHistory = {};
      
      // If timestampsData is an object with timestamp keys
      if (typeof timestampsData === 'object' && timestampsData !== null) {
        const entries = Object.entries(timestampsData);
        console.log(`Found ${entries.length} timestamp entries to process`);
        
        // Process each timestamp entry
        for (const [key, value] of entries) {
          // Try to parse the key as a timestamp
          const timestamp = parseInt(key);
          
          // Skip invalid timestamps and entries outside the time range
          if (isNaN(timestamp) || timestamp < startTime || timestamp > endTime) {
            continue;
          }
          
          // Extract data from entry
          const entry = value as any;
          
          // Only add valid entries with at least temperature or humidity
          if (typeof entry.temperature === 'number' || typeof entry.humidity === 'number') {
            processedData[timestamp] = {
              temperature: typeof entry.temperature === 'number' ? entry.temperature : 0,
              humidity: typeof entry.humidity === 'number' ? entry.humidity : 0,
            };
            
            // Add light if available
            if (typeof entry.light === 'number') {
              processedData[timestamp].light = entry.light;
            }
            
            // Add soil moisture if available
            if (typeof entry.soilMoisture === 'number') {
              processedData[timestamp].soilMoisture = entry.soilMoisture;
            }
          }
        }
        
        console.log(`Processed timestamps data with ${Object.keys(processedData).length} valid entries`);
        callback(processedData);
      } else {
        console.warn('Timestamps data has unexpected format');
        callback({});
      }
    } else {
      // Fallback to checking history data
      console.log('No timestamps data found, falling back to history data');
      const historyRef = ref(database, 'sensorData/history');
      
      // Check if history data exists
      get(historyRef).then(historySnapshot => {
        if (!historySnapshot.exists() || Object.keys(historySnapshot.val()).length === 0) {
          console.log('No history data found, generating sample data...');
          generateSensorHistory()
            .then(() => console.log('History data generation completed'))
            .catch(err => console.error('Failed to generate history data:', err));
        }
        
        // Get history data
        onValue(historyRef, (historySnap: DataSnapshot) => {
          if (historySnap.exists()) {
            const historyData = historySnap.val();
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
                
                // Extract data based on structure
                const entry = value as any;
                
                // Only add valid entries with at least temperature or humidity
                if (typeof entry.temperature === 'number' || typeof entry.humidity === 'number') {
                  processedData[timestamp] = {
                    temperature: typeof entry.temperature === 'number' ? entry.temperature : 0,
                    humidity: typeof entry.humidity === 'number' ? entry.humidity : 0,
                  };
                  
                  // Add light if available
                  if (typeof entry.light === 'number') {
                    processedData[timestamp].light = entry.light;
                  }
                  
                  // Add soil moisture if available
                  if (typeof entry.soilMoisture === 'number') {
                    processedData[timestamp].soilMoisture = entry.soilMoisture;
                  }
                }
              }
              
              console.log(`Processed history data with ${Object.keys(processedData).length} valid entries`);
              callback(processedData);
            } else {
              console.log('History data has unexpected format');
              callback({});
            }
          } else {
            console.log('No history data available');
            callback({});
          }
        });
      }).catch(error => {
        console.error('Error checking history data:', error);
        callback({});
      });
    }
  }, (error) => {
    console.error('Error getting sensor history:', error);
    callback({});
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

// Initialize storage if not already done
try {
  if (!storage) {
    storage = getStorage(app);
  }
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

// Download an image from a URL and upload it to Firebase Storage
export async function downloadAndUploadImage(
  imageUrl: string,
  storagePath: string
): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    console.log(`Downloading image from URL: ${imageUrl}`);
    
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    // Convert to blob
    const blob = await response.blob();
    
    // Create a reference to store the file in Firebase
    const fileRef = storageRef(storage, storagePath);
    
    // Upload to Firebase Storage
    const snapshot = await uploadBytes(fileRef, blob);
    console.log('Image uploaded successfully:', snapshot.metadata.fullPath);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(fileRef);
    console.log('Image download URL:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error downloading and uploading image:', error);
    throw error;
  }
}

// Utility function to download plant images from the database and store them in Firebase
export async function downloadPlantTypesImages(): Promise<void> {
  try {
    // Import the plant database dynamically to avoid circular dependencies
    const { plantTypes } = await import('./plantDatabase');
    const results = [];
    
    console.log(`Processing ${plantTypes.length} plants for image caching`);
    
    for (const plant of plantTypes) {
      if (plant.imageUrl && plant.imageUrl.startsWith('http')) {
        try {
          // Only process external URLs (not Firebase URLs)
          if (!plant.imageUrl.includes('firebasestorage')) {
            const path = `plant-types/${plant.id}.jpg`;
            const newUrl = await downloadAndUploadImage(plant.imageUrl, path);
            results.push({ id: plant.id, success: true, url: newUrl });
            console.log(`Successfully cached image for ${plant.name}`);
          }
        } catch (error) {
          console.error(`Failed to process image for ${plant.name}:`, error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.push({ id: plant.id, success: false, error: errorMessage });
        }
      }
    }
    
    console.log('Plant image caching completed:', results);
    return;
  } catch (error) {
    console.error('Error in bulk plant image download:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(String(error));
    }
  }
}

// Update plant data in Firebase including image URL and AI analysis results
export async function updatePlantData(
  userId: string, 
  plantId: string, 
  data: { imageUrl?: string; species?: string; notes?: string; health?: string; lastWatered?: number }
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
