import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://uqljjsymzfuwymkbcnia.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxbGpqc3ltemZ1d3lta2JjbmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NzczNjYsImV4cCI6MjA1ODM1MzM2Nn0.Ryxg7NGZClhZx9PcjiTfAcfe5MZqAKc2UCevGE0-IEs';

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Interface for sensor data
export interface SensorData {
  temperature: number;
  humidity: number;
  timestamp: number;
}

// Interface for plant controls
export interface PlantControls {
  uvLight: boolean;
  wateringActive: boolean;
}

// Get current sensor data from Supabase
export async function getCurrentSensorData(): Promise<SensorData | null> {
  try {
    // Query the second row from Sensors table
    const { data, error } = await supabase
      .from('Sensors')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error fetching sensor data:', error);
      return null;
    }
    
    if (!data) {
      console.log('No sensor data found');
      return null;
    }
    
    // Extract temperature and humidity from columns 3 and 4
    return {
      temperature: data[2], // 3rd column
      humidity: data[3],    // 4th column
      timestamp: Date.now() // Use current timestamp
    };
  } catch (error) {
    console.error('Error accessing Supabase:', error);
    return null;
  }
}

// Get plant controls status
export async function getPlantControls(): Promise<PlantControls | null> {
  try {
    // Query the second row from Sensors table
    const { data, error } = await supabase
      .from('Sensors')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error fetching plant controls:', error);
      return null;
    }
    
    if (!data) {
      console.log('No plant control data found');
      return null;
    }
    
    // Extract uvLight and wateringActive from columns 5 and 6
    return {
      uvLight: Boolean(data[4]),      // 5th column
      wateringActive: Boolean(data[5]) // 6th column
    };
  } catch (error) {
    console.error('Error accessing Supabase:', error);
    return null;
  }
}

// Set UV light state
export async function setUvLight(state: boolean): Promise<boolean> {
  try {
    // Update the 5th column (uvLight) in the second row
    const { error } = await supabase
      .from('Sensors')
      .update({ [4]: state }) // Use bracket notation to update column by index
      .eq('id', 2); // Assuming the second row has id=2
    
    if (error) {
      console.error('Error updating UV light state:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error accessing Supabase:', error);
    return false;
  }
}

// Set watering active state (turns on for 10 seconds, then off)
export async function setWateringActive(state: boolean): Promise<boolean> {
  try {
    if (!state) {
      // If state is false, simply update to false
      const { error } = await supabase
        .from('Sensors')
        .update({ [5]: false }) // 6th column
        .eq('id', 2);
      
      if (error) {
        console.error('Error updating watering state:', error);
        return false;
      }
      
      return true;
    } else {
      // If state is true, update to true
      const { error } = await supabase
        .from('Sensors')
        .update({ [5]: true }) // 6th column
        .eq('id', 2);
      
      if (error) {
        console.error('Error updating watering state:', error);
        return false;
      }
      
      // Set a timeout to turn it off after 10 seconds
      setTimeout(async () => {
        const { error } = await supabase
          .from('Sensors')
          .update({ [5]: false }) // 6th column
          .eq('id', 2);
        
        if (error) {
          console.error('Error turning off watering after timeout:', error);
        }
      }, 10000); // 10 seconds
      
      return true;
    }
  } catch (error) {
    console.error('Error accessing Supabase:', error);
    return false;
  }
}

// Set up real-time subscription for sensor data
export function subscribeSensorData(callback: (data: SensorData) => void): (() => void) {
  // Initial fetch
  getCurrentSensorData().then(data => {
    if (data) callback(data);
  });
  
  // Set up polling (since Supabase doesn't support real-time for specific cells)
  const interval = setInterval(async () => {
    const data = await getCurrentSensorData();
    if (data) callback(data);
  }, 2000); // Poll every 2 seconds
  
  // Return a cleanup function
  return () => clearInterval(interval);
}

// Set up subscription for plant controls
export function subscribePlantControls(callback: (controls: PlantControls) => void): (() => void) {
  // Initial fetch
  getPlantControls().then(controls => {
    if (controls) callback(controls);
  });
  
  // Set up polling
  const interval = setInterval(async () => {
    const controls = await getPlantControls();
    if (controls) callback(controls);
  }, 2000); // Poll every 2 seconds
  
  // Return a cleanup function
  return () => clearInterval(interval);
}

// Mock history data (since we're focusing on current values from Supabase)
export interface SensorHistory {
  [timestamp: number]: {
    temperature: number;
    humidity: number;
  };
}

// Get sensor history data
export function getSensorHistory(days: number, callback: (data: SensorHistory) => void): (() => void) {
  // Create some representative data based on current values
  const generateHistoryData = async () => {
    const currentData = await getCurrentSensorData();
    if (!currentData) return;
    
    const history: SensorHistory = {};
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    // Generate data points for the requested number of days
    for (let i = 0; i < days; i++) {
      // Create 24 data points per day (one per hour)
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = now - (i * dayInMs) - (hour * 60 * 60 * 1000);
        
        // Vary the values slightly around the current values
        const tempVariation = Math.random() * 2 - 1; // -1 to +1
        const humidityVariation = Math.random() * 4 - 2; // -2 to +2
        
        history[timestamp] = {
          temperature: Math.round((currentData.temperature + tempVariation) * 10) / 10,
          humidity: Math.round(currentData.humidity + humidityVariation)
        };
      }
    }
    
    callback(history);
  };
  
  // Generate initial data
  generateHistoryData();
  
  // No need for real-time updates for historical data
  return () => {}; // Empty cleanup function
}