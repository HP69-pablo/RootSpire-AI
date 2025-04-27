import React from 'react';
import { motion } from 'framer-motion';
import { CircularProgress } from './CircularProgress';

interface SensorWidgetProps {
  title: string;
  value: number | null;
  unit: string;
  icon: React.ReactNode;
  color: string;
  min?: number;
  max?: number;
  status?: 'Optimal' | 'High' | 'Low' | 'Critical';
}

export function SensorWidget({
  title,
  value,
  unit,
  icon,
  color,
  min,
  max,
  status = 'Optimal'
}: SensorWidgetProps) {
  // Status-based colors
  const getStatusColor = () => {
    switch (status) {
      case 'High':
        return '#FF2D55'; // Red
      case 'Low':
        return '#FF9500'; // Orange
      case 'Critical':
        return '#FF2D55'; // Red
      case 'Optimal':
      default:
        return '#34C759'; // Green
    }
  };

  // Calculated percentage for the circle
  const getPercentage = () => {
    if (value === null || min === undefined || max === undefined) {
      return 0;
    }
    
    // Calculate where the current value falls in the min-max range
    const range = max - min;
    const normalizedValue = Math.max(min, Math.min(max, value)) - min;
    return Math.round((normalizedValue / range) * 100);
  };

  return (
    <motion.div 
      className="widget-small apple-widget p-4"
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center mr-2" 
            style={{ backgroundColor: `${color}30`, color: color }}
          >
            {icon}
          </div>
          <h3 className="font-medium text-lg">{title}</h3>
        </div>
        <div 
          className={`px-2 py-0.5 text-xs rounded-full font-medium
            ${status === 'Optimal' ? 'bg-green-500/20 text-green-500' : 
              status === 'High' ? 'bg-red-500/20 text-red-500' : 
              status === 'Low' ? 'bg-yellow-500/20 text-yellow-500' : 
              'bg-red-500/20 text-red-500'}`}
        >
          {status}
        </div>
      </div>

      <div className="flex items-center justify-around mt-3">
        <div className="text-center">
          <div className="text-3xl font-bold">
            {value !== null ? value : '--'}{unit}
          </div>
          <div className="text-xs text-gray-500 mt-1">Current</div>
        </div>

        {min !== undefined && max !== undefined && (
          <CircularProgress 
            value={getPercentage()} 
            max={100} 
            size={80} 
            thickness={8}
            color={getStatusColor()}
            showValue={false}
          />
        )}
      </div>

      {min !== undefined && max !== undefined && (
        <div className="flex justify-between mt-3 text-xs text-gray-500">
          <div>Min: {min}{unit}</div>
          <div>Max: {max}{unit}</div>
        </div>
      )}
    </motion.div>
  );
}