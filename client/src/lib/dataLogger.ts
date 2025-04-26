import { ref, set, push, serverTimestamp } from 'firebase/database';
import { database } from './firebase';
import { SensorData } from './firebase';

/**
 * Service that logs sensor data periodically to the Firebase database
 * for historical tracking and graphing purposes
 */
export class DataLogger {
  private static instance: DataLogger;
  private timerId: NodeJS.Timeout | null = null;
  private isLogging: boolean = false;
  private intervalMs: number = 5000; // 5 seconds by default
  private plantId: string = 'default'; // Default plant ID
  
  // Singleton pattern
  private constructor() {}
  
  public static getInstance(): DataLogger {
    if (!DataLogger.instance) {
      DataLogger.instance = new DataLogger();
    }
    return DataLogger.instance;
  }
  
  /**
   * Start logging sensor data at set intervals
   * @param plantId - The ID of the plant to log data for
   * @param intervalMs - Optional interval in milliseconds (defaults to 5000ms)
   */
  public startLogging(plantId: string = 'default', intervalMs: number = 5000): void {
    if (this.isLogging) {
      console.log('Data logger is already running');
      return;
    }
    
    this.plantId = plantId;
    this.intervalMs = intervalMs;
    this.isLogging = true;
    
    console.log(`Starting data logger for plant ${plantId} with ${intervalMs}ms interval`);
    
    // Schedule the recurring log function
    this.timerId = setInterval(() => this.logCurrentData(), this.intervalMs);
    
    // Log immediately on start
    this.logCurrentData();
  }
  
  /**
   * Stop the data logging service
   */
  public stopLogging(): void {
    if (!this.isLogging || !this.timerId) {
      console.log('Data logger is not running');
      return;
    }
    
    clearInterval(this.timerId);
    this.timerId = null;
    this.isLogging = false;
    console.log('Data logger stopped');
  }
  
  /**
   * Log the current sensor data to the history collection
   */
  private async logCurrentData(): Promise<void> {
    try {
      // Get reference to the current data
      const currentDataRef = ref(database, 'sensorData/current');
      
      // Get reference to the history data
      const historyRef = ref(database, `sensorData/history/${this.plantId}`);
      
      // Create a new entry in the history with an auto-generated ID
      const newHistoryRef = push(historyRef);
      
      // Get the current timestamp
      const timestamp = Date.now();
      
      // Define the data to be logged
      const currentSensorData: SensorData = {
        temperature: 0, // Will be fetched from Firebase
        humidity: 0,    // Will be fetched from Firebase
        timestamp: timestamp
      };
      
      // Fetch the current temperature from Firebase
      const temperatureRef = ref(database, 'sensorData/current/temperature');
      const humidityRef = ref(database, 'sensorData/current/humidity');
      const lightRef = ref(database, 'sensorData/current/Light'); // Capital L as in the API
      const soilMoistureRef = ref(database, 'sensorData/current/soilMoister'); // 'soilMoister' as in the API
      
      // Use dynamic imports to avoid circular dependencies
      const { onValue } = await import('firebase/database');
      
      // Get temperature
      onValue(temperatureRef, (snapshot) => {
        if (snapshot.exists()) {
          currentSensorData.temperature = snapshot.val();
        }
      }, { onlyOnce: true });
      
      // Get humidity
      onValue(humidityRef, (snapshot) => {
        if (snapshot.exists()) {
          currentSensorData.humidity = snapshot.val();
        }
      }, { onlyOnce: true });
      
      // Get light if available
      onValue(lightRef, (snapshot) => {
        if (snapshot.exists()) {
          currentSensorData.light = snapshot.val();
        }
      }, { onlyOnce: true });
      
      // Get soil moisture if available
      onValue(soilMoistureRef, (snapshot) => {
        if (snapshot.exists()) {
          currentSensorData.soilMoisture = snapshot.val();
        }
      }, { onlyOnce: true });
      
      // Wait a short time to make sure all data is fetched
      setTimeout(() => {
        // Set the data in the history node
        set(newHistoryRef, currentSensorData)
          .then(() => {
            console.log(`Logged sensor data at ${new Date(timestamp).toLocaleTimeString()}:`, currentSensorData);
          })
          .catch((error) => {
            console.error('Error logging sensor data:', error);
          });
      }, 200);
      
    } catch (error) {
      console.error('Error in data logger:', error);
    }
  }
  
  /**
   * Manually log data once without starting the scheduled logging
   */
  public logOnce(plantId: string = 'default'): void {
    this.plantId = plantId;
    this.logCurrentData();
  }
  
  /**
   * Check if the logger is currently running
   */
  public isRunning(): boolean {
    return this.isLogging;
  }
  
  /**
   * Get the current logging interval
   */
  public getInterval(): number {
    return this.intervalMs;
  }
  
  /**
   * Change the logging interval
   * @param intervalMs - New interval in milliseconds
   */
  public setInterval(intervalMs: number): void {
    if (intervalMs < 1000) {
      console.warn('Logging interval should be at least 1000ms to avoid overloading the database');
      intervalMs = 1000;
    }
    
    this.intervalMs = intervalMs;
    
    // Restart the timer if already running
    if (this.isLogging && this.timerId) {
      clearInterval(this.timerId);
      this.timerId = setInterval(() => this.logCurrentData(), this.intervalMs);
      console.log(`Updated logging interval to ${intervalMs}ms`);
    }
  }
}