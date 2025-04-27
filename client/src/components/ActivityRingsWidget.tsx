import React from 'react';
import { motion } from 'framer-motion';
import { CircularProgress } from './CircularProgress';

interface ActivityRingsWidgetProps {
  title?: string;
  data: {
    temperature: { value: number, min: number, max: number };
    humidity: { value: number, min: number, max: number };
    light: { value: number, min: number, max: number };
    soilMoisture: { value: number, min: number, max: number };
  }
}

export function ActivityRingsWidget({
  title = 'Plant Vitals',
  data
}: ActivityRingsWidgetProps) {
  // Calculate the percentage for each metric
  const calculatePercentage = (value: number, min: number, max: number) => {
    // Return the percentage of value within the range
    // For fitness rings, we want to show how close to optimal the value is
    const range = max - min;
    const middle = min + (range / 2);
    
    // Calculate distance from middle (optimal value)
    const distanceFromMiddle = Math.abs(value - middle);
    const maxDistance = range / 2;
    
    // Calculate percentage - 100% means perfect middle value, 0% means at min or max
    return Math.max(0, 100 - ((distanceFromMiddle / maxDistance) * 100));
  };

  // Status text based on percentage
  const getStatusText = (percentage: number) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 70) return 'Good';
    if (percentage >= 50) return 'Average';
    if (percentage >= 30) return 'Fair';
    return 'Poor';
  };

  // Calculate values for the rings
  const temperaturePercentage = calculatePercentage(
    data.temperature.value, 
    data.temperature.min, 
    data.temperature.max
  );
  
  const humidityPercentage = calculatePercentage(
    data.humidity.value, 
    data.humidity.min, 
    data.humidity.max
  );
  
  const soilMoisturePercentage = calculatePercentage(
    data.soilMoisture.value, 
    data.soilMoisture.min, 
    data.soilMoisture.max
  );

  const lightPercentage = calculatePercentage(
    data.light.value, 
    data.light.min, 
    data.light.max
  );

  // Calculate overall health percentage
  const metrics = 4; // All 4 metrics are always present
  const overallHealth = Math.round(
    (temperaturePercentage + humidityPercentage + soilMoisturePercentage + lightPercentage) / metrics
  );

  return (
    <motion.div 
      className="widget-medium apple-widget p-4"
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-lg">{title}</h3>
        <div 
          className={`px-2 py-0.5 text-xs rounded-full font-medium
            ${overallHealth >= 70 ? 'bg-green-500/20 text-green-500' : 
              overallHealth >= 40 ? 'bg-yellow-500/20 text-yellow-500' : 
              'bg-red-500/20 text-red-500'}`}
        >
          {getStatusText(overallHealth)}
        </div>
      </div>

      <div className="flex items-center justify-center mb-2">
        <div className="text-center">
          <CircularProgress 
            value={overallHealth} 
            max={100} 
            size={100} 
            thickness={10}
            color="#AF52DE" // Apple Fitness purple
            label="Health"
          />
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <div className="text-center">
          <CircularProgress 
            value={temperaturePercentage} 
            max={100} 
            size={70} 
            thickness={7}
            color="#FF2D55" // Apple Fitness red
            showValue={false}
          />
          <div className="mt-2 text-sm font-medium">Temp</div>
          <div className="text-xs text-gray-500">{data.temperature.value}°C</div>
        </div>

        <div className="text-center">
          <CircularProgress 
            value={humidityPercentage} 
            max={100} 
            size={70} 
            thickness={7}
            color="#5AC8FA" // Apple Fitness blue
            showValue={false}
          />
          <div className="mt-2 text-sm font-medium">Humidity</div>
          <div className="text-xs text-gray-500">{data.humidity.value}%</div>
        </div>

        <div className="text-center">
          <CircularProgress 
            value={soilMoisturePercentage} 
            max={100} 
            size={70} 
            thickness={7}
            color="#34C759" // Apple Fitness green
            showValue={false}
          />
          <div className="mt-2 text-sm font-medium">Soil</div>
          <div className="text-xs text-gray-500">{data.soilMoisture.value}%</div>
        </div>

        <div className="text-center">
          <CircularProgress 
            value={lightPercentage} 
            max={100} 
            size={70} 
            thickness={7}
            color="#FFCC00" // Apple Fitness yellow
            showValue={false}
          />
          <div className="mt-2 text-sm font-medium">Light</div>
          <div className="text-xs text-gray-500">{data.light.value}%</div>
        </div>
      </div>
    </motion.div>
  );
}