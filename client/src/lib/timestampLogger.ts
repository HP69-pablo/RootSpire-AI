import { ref, set, push, serverTimestamp, onValue } from 'firebase/database';
import { database } from './firebase';
import { SensorData } from './firebase';

/**
 * Service that logs sensor data to timestamps folder in Firebase database
 * every 5 seconds for graph visualization
 */
export class TimestampLogger {
  private static instance: TimestampLogger;
  private timerId: NodeJS.Timeout | null = null;
  private isLogging: boolean = false;
  private intervalMs: number = 5000; // 5 seconds by default
  
  // Singleton pattern
  private constructor() {}
  
  public static getInstance(): TimestampLogger {
    if (!TimestampLogger.instance) {
      TimestampLogger.instance = new TimestampLogger();
    }
    return TimestampLogger.instance;
  }
  
  /**
   * Start logging sensor data to timestamps folder at set intervals
   * @param intervalMs - Optional interval in milliseconds (defaults to 5000ms)
   */
  public startLogging(intervalMs: number = 5000): void {
    if (this.isLogging) {
      console.log('Timestamp logger is already running');
      return;
    }
    
    this.intervalMs = intervalMs;
    this.isLogging = true;
    
    console.log(`Starting timestamp logger with ${intervalMs}ms interval`);
    
    // Schedule the recurring log function
    this.timerId = setInterval(() => this.logCurrentTimestamp(), this.intervalMs);
    
    // Log immediately on start
    this.logCurrentTimestamp();
  }
  
  /**
   * Stop the timestamp logging service
   */
  public stopLogging(): void {
    if (!this.isLogging || !this.timerId) {
      console.log('Timestamp logger is not running');
      return;
    }
    
    clearInterval(this.timerId);
    this.timerId = null;
    this.isLogging = false;
    console.log('Timestamp logger stopped');
  }
  
  /**
   * Log the current sensor data to the timestamps folder
   */
  private async logCurrentTimestamp(): Promise<void> {
    try {
      // Get current timestamp
      const timestamp = Date.now();
      
      // Create a new timestamp entry with timestamp as key
      const timestampRef = ref(database, `timestamps/${timestamp}`);
      
      // Define the data to be logged
      const sensorData: SensorData = {
        temperature: 0, // Will be fetched from Firebase
        humidity: 0,    // Will be fetched from Firebase
        timestamp: timestamp
      };
      
      // Fetch the current sensor data from Firebase
      const temperatureRef = ref(database, 'sensorData/current/temperature');
      const humidityRef = ref(database, 'sensorData/current/humidity');
      const lightRef = ref(database, 'sensorData/current/Light'); // Capital L as in the API
      const soilMoistureRef = ref(database, 'sensorData/current/soilMoister'); // 'soilMoister' as in the API
      
      // Get temperature
      onValue(temperatureRef, (snapshot) => {
        if (snapshot.exists()) {
          sensorData.temperature = snapshot.val();
        }
      }, { onlyOnce: true });
      
      // Get humidity
      onValue(humidityRef, (snapshot) => {
        if (snapshot.exists()) {
          sensorData.humidity = snapshot.val();
        }
      }, { onlyOnce: true });
      
      // Get light if available
      onValue(lightRef, (snapshot) => {
        if (snapshot.exists()) {
          sensorData.light = snapshot.val();
        }
      }, { onlyOnce: true });
      
      // Get soil moisture if available
      onValue(soilMoistureRef, (snapshot) => {
        if (snapshot.exists()) {
          sensorData.soilMoisture = snapshot.val();
        }
      }, { onlyOnce: true });
      
      // Wait a short time to make sure all data is fetched
      setTimeout(() => {
        // Set the data in the timestamps node
        set(timestampRef, sensorData)
          .then(() => {
            console.log(`Logged timestamp data at ${new Date(timestamp).toLocaleTimeString()}:`, sensorData);
          })
          .catch((error) => {
            console.error('Error logging timestamp data:', error);
          });
      }, 200);
      
    } catch (error) {
      console.error('Error in timestamp logger:', error);
    }
  }
  
  /**
   * Manually log timestamp once without starting the scheduled logging
   */
  public logOnce(): void {
    this.logCurrentTimestamp();
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
      this.timerId = setInterval(() => this.logCurrentTimestamp(), this.intervalMs);
      console.log(`Updated timestamp logging interval to ${intervalMs}ms`);
    }
  }
}