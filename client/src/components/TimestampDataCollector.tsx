import { useEffect } from 'react';
import { TimestampLogger } from '@/lib/timestampLogger';
import { initializeFirebase } from '@/lib/firebase';

/**
 * This component is responsible for collecting timestamp data every 5 seconds
 * It doesn't render any UI - it just starts and manages the timestamp data collection
 */
export function TimestampDataCollector() {
  useEffect(() => {
    // Make sure Firebase is initialized
    const isInitialized = initializeFirebase();
    
    if (isInitialized) {
      // Get singleton instance of TimestampLogger
      const timestampLogger = TimestampLogger.getInstance();
      
      // Log timestamp data every 5 seconds
      timestampLogger.startLogging(5000);
      
      // Log initial data point
      timestampLogger.logOnce();
      
      console.log('Timestamp collector started - logging data every 5 seconds to timestamps folder');
      
      // Clean up on unmount
      return () => {
        timestampLogger.stopLogging();
        console.log('Timestamp collector stopped');
      };
    } else {
      console.error('Firebase could not be initialized - timestamp collection disabled');
    }
  }, []);
  
  // This component doesn't render anything
  return null;
}