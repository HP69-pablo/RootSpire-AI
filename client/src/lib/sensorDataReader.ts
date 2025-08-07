// Sensor Data Reader for AI Chat Integration
import { database } from './firebase';
import { ref, get } from 'firebase/database';

export interface CurrentSensorData {
  temperature: number;
  humidity: number;
  light: number;
  soilMoisture: number;
  timestamp: number;
}

export async function getCurrentSensorData(): Promise<CurrentSensorData | null> {
  try {
    if (!database) {
      console.error('Firebase database not initialized');
      return null;
    }

    // Read current sensor data from Firebase
    const sensorRef = ref(database, 'sensorData/current');
    const snapshot = await get(sensorRef);
    
    if (!snapshot.exists()) {
      console.warn('No current sensor data available');
      return null;
    }

    const data = snapshot.val();
    
    // Validate that all required sensor readings are present
    if (typeof data.temperature === 'number' && 
        typeof data.humidity === 'number' && 
        typeof data.light === 'number' && 
        typeof data.soilMoisture === 'number') {
      
      return {
        temperature: data.temperature,
        humidity: data.humidity,
        light: data.light,
        soilMoisture: data.soilMoisture,
        timestamp: data.timestamp || Date.now()
      };
    } else {
      console.warn('Incomplete sensor data:', data);
      return null;
    }
  } catch (error) {
    console.error('Error reading current sensor data:', error);
    return null;
  }
}

export function formatSensorDataForAI(sensorData: CurrentSensorData): string {
  return `Current Plant Environmental Conditions:
- Temperature: ${sensorData.temperature}°C
- Humidity: ${sensorData.humidity}%
- Light Level: ${sensorData.light}%
- Soil Moisture: ${sensorData.soilMoisture}%
- Reading Time: ${new Date(sensorData.timestamp).toLocaleString()}

Please use this current sensor data to provide specific, actionable advice for the plant's immediate care needs.`;
}