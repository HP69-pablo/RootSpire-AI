import { useState, useEffect } from 'react';
import { SensorCard } from './SensorCard';
import { SensorData } from '@/lib/firebase';
import { PlantConfigValues } from './PlantConfig';

interface StatusOverviewProps {
  sensorData: SensorData;
  config: PlantConfigValues;
}

export function StatusOverview({ sensorData, config }: StatusOverviewProps) {
  const [lastUpdated, setLastUpdated] = useState<string>('Updated just now');
  const [prevSensorData, setPrevSensorData] = useState<SensorData | null>(null);
  
  useEffect(() => {
    // Update the "last updated" text
    setLastUpdated('Updated just now');
    const timer = setTimeout(() => {
      const date = new Date(sensorData.timestamp);
      setLastUpdated(`Updated ${date.toLocaleTimeString()}`);
    }, 60000);
    
    // Store previous sensor data for change calculation
    if (sensorData !== null) {
      setPrevSensorData(sensorData);
    }
    
    return () => clearTimeout(timer);
  }, [sensorData]);
  
  const getTemperatureStatus = () => {
    const { temperature } = sensorData;
    const { tempMin, tempMax } = config;
    
    if (temperature < tempMin) return "Low";
    if (temperature > tempMax) return "High";
    return "Optimal";
  };
  
  const getHumidityStatus = () => {
    const { humidity } = sensorData;
    const { humidityMin, humidityMax } = config;
    
    if (humidity < humidityMin) return "Low";
    if (humidity > humidityMax) return "High";
    return "Optimal";
  };
  
  const getSoilMoistureStatus = () => {
    const { soilMoisture } = sensorData;
    const { soilMoistureMin, soilMoistureMax } = config;
    
    if (soilMoisture < soilMoistureMin) {
      return soilMoisture < (soilMoistureMin * 0.8) ? "Critical" : "Low";
    }
    if (soilMoisture > soilMoistureMax) return "High";
    return "Optimal";
  };
  
  return (
    <section className="mb-8">
      <div className="flex items-center mb-4">
        <h2 className="text-lg font-medium">Plant Status Overview</h2>
        <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Live</span>
        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">{lastUpdated}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SensorCard 
          type="temperature" 
          value={sensorData.temperature} 
          previousValue={prevSensorData?.temperature} 
          status={getTemperatureStatus()} 
        />
        
        <SensorCard 
          type="humidity" 
          value={sensorData.humidity} 
          previousValue={prevSensorData?.humidity} 
          status={getHumidityStatus()} 
        />
        
        <SensorCard 
          type="soil" 
          value={sensorData.soilMoisture} 
          previousValue={prevSensorData?.soilMoisture} 
          status={getSoilMoistureStatus()} 
        />
      </div>
    </section>
  );
}
