import { useEffect } from 'react';
import { DataLogger } from '@/lib/dataLogger';
import { initializeFirebase } from '@/lib/firebase';

/**
 * This component is responsible for collecting sensor data at regular intervals
 * It doesn't render any UI - it just starts and manages the data collection process
 */
export function DataCollector() {
  useEffect(() => {
    // Make sure Firebase is initialized
    const isInitialized = initializeFirebase();
    
    if (isInitialized) {
      // Get singleton instance of DataLogger
      const dataLogger = DataLogger.getInstance();
      
      // Configure to collect data every 5 minutes (300000ms)
      dataLogger.startLogging('default', 300000);
      
      // Log initial data point
      dataLogger.logOnce('default');
      
      console.log('Data collector started - logging data every 5 minutes');
      
      // Clean up on unmount
      return () => {
        dataLogger.stopLogging();
        console.log('Data collector stopped');
      };
    } else {
      console.error('Firebase could not be initialized - data collection disabled');
    }
  }, []);
  
  // This component doesn't render anything
  return null;
}