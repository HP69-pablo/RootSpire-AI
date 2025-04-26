import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

// Interface for the component props
interface AnimatedPlantGraphProps {
  data: Array<{
    timestamp: number;
    temperature?: number;
    humidity?: number;
    light?: number;
    soilMoisture?: number;
  }>;
  dataType: 'temperature' | 'humidity' | 'light' | 'soilMoisture';
  timeRange?: string;
  title?: string;
  height?: number;
}

// Mapping for the data types, their colors, gradients and units
const typeConfig = {
  temperature: {
    color: '#FF5C5C',
    gradient: ['#FF6666', '#FFCCCC'],
    unit: '°C',
    name: 'Temperature'
  },
  humidity: {
    color: '#5C9CFF',
    gradient: ['#66A3FF', '#CCE0FF'],
    unit: '%',
    name: 'Humidity'
  },
  light: {
    color: '#FFD15C',
    gradient: ['#FFD966', '#FFECC4'],
    unit: '%',
    name: 'Light'
  },
  soilMoisture: {
    color: '#5CBF6A',
    gradient: ['#66CC72', '#CCE8D0'],
    unit: '%',
    name: 'Soil Moisture'
  }
};

export function AnimatedPlantGraph({
  data,
  dataType,
  timeRange = '24h',
  title,
  height = 250
}: AnimatedPlantGraphProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Format the data for the chart
  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    
    return sortedData.map(item => ({
      time: format(new Date(item.timestamp), 'HH:mm'),
      fullTime: new Date(item.timestamp),
      value: item[dataType] || 0
    }));
  }, [data, dataType]);
  
  // Animation effect to reveal the graph
  useEffect(() => {
    // Small delay to ensure the component has mounted
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Get configuration for the current data type
  const config = typeConfig[dataType];
  
  // Custom tooltip component with Apple-inspired design
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 p-4 rounded-xl shadow-lg border-0 sf-pro-display animate-scale-pulse"
          style={{ 
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.04)',
          }}>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {format(payload[0].payload.fullTime, 'MMM d, yyyy HH:mm')}
          </p>
          <p className="text-xl font-bold tracking-tight" style={{ color: config.color }}>
            {payload[0].value}{config.unit}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Define motion variants for the animation
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };
  
  const chartVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <AnimatePresence>
      {formattedData.length > 0 && (
        <motion.div
          className="w-full ios-card overflow-hidden sf-pro-display"
          style={{
            borderRadius: '20px',
            backdropFilter: 'blur(20px)',
            background: 'rgba(255, 255, 255, 0.85)',
            boxShadow: '0 10px 30px rgba(31, 38, 135, 0.1), 0 1px 8px rgba(0, 0, 0, 0.06)'
          }}
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          <motion.div className="flex justify-between items-center mb-6 px-5 pt-5" variants={chartVariants}>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight sf-pro-display">
                {title || `${config.name}`}
              </h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                Historical data tracking
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-gray-100/80 dark:bg-gray-700/50 text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center">
              <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: config.color, boxShadow: `0 0 3px ${config.color}` }}></span>
              Last {timeRange}
            </div>
          </motion.div>
          
          <motion.div
            variants={chartVariants}
            style={{ height: `${height}px` }}
            className="w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedData}
                margin={{ top: 5, right: 5, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id={`gradient-${dataType}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.gradient[0]} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={config.gradient[1]} stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(200,200,200,0.15)" 
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tick={{ 
                    fontSize: 11, 
                    fontWeight: 500, 
                    fill: 'rgba(100,100,100,0.8)',
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(200,200,200,0.3)', strokeWidth: 1 }}
                  dy={8}
                />
                <YAxis
                  tick={{ 
                    fontSize: 11, 
                    fontWeight: 500, 
                    fill: 'rgba(100,100,100,0.8)',
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(200,200,200,0.3)', strokeWidth: 1 }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                  dx={-5}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="natural"
                  dataKey="value"
                  stroke={config.color}
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 2, fill: 'white', stroke: config.color }}
                  activeDot={{ 
                    r: 6, 
                    strokeWidth: 3, 
                    fill: 'white', 
                    stroke: config.color,
                    strokeOpacity: 0.8,
                    className: "animate-pulse-slow"
                  }}
                  isAnimationActive={true}
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                  name={config.name}
                  fill={`url(#gradient-${dataType})`}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
          
          <motion.div
            className="flex justify-between items-center px-5 pb-5 mt-4"
            variants={chartVariants}
          >
            <span className="text-xs font-medium bg-gray-100/70 dark:bg-gray-700/40 px-3 py-1 rounded-full text-gray-500 dark:text-gray-400">
              {`${formattedData.length} data points`}
            </span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
              <span className="h-3 w-3 mr-1.5 rounded-sm" style={{ backgroundColor: config.color }}></span>
              Values in {config.unit}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}