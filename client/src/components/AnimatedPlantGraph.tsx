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
  dataType?: 'temperature' | 'humidity' | 'light' | 'soilMoisture';
  dataTypes?: ('temperature' | 'humidity' | 'light' | 'soilMoisture')[];
  combinedView?: boolean;
  timeRange?: string;
  title?: string;
  height?: number;
}

// Mapping for the data types with colors for dark and light mode
const typeConfig = {
  temperature: {
    color: '#FF5C5C',
    darkColor: '#FF7878',
    gradient: ['#FF6666', '#FFCCCC'],
    darkGradient: ['#FF6666', '#AA4444'],
    unit: '°C',
    name: 'Temperature'
  },
  humidity: {
    color: '#5C9CFF',
    darkColor: '#7CAFFF',
    gradient: ['#66A3FF', '#CCE0FF'],
    darkGradient: ['#66A3FF', '#3067B3'],
    unit: '%',
    name: 'Humidity'
  },
  light: {
    color: '#FFD15C',
    darkColor: '#FFDC7D',
    gradient: ['#FFD966', '#FFECC4'],
    darkGradient: ['#FFD966', '#BD9C3F'],
    unit: '%',
    name: 'Light'
  },
  soilMoisture: {
    color: '#5CBF6A',
    darkColor: '#6BDF7A',
    gradient: ['#66CC72', '#CCE8D0'],
    darkGradient: ['#66CC72', '#3D7F45'],
    unit: '%',
    name: 'Soil Moisture'
  }
};

export function AnimatedPlantGraph({
  data,
  dataType,
  dataTypes = ['temperature', 'humidity', 'light', 'soilMoisture'],
  combinedView = false,
  timeRange = '24h',
  title,
  height = 350 // Increased height for better visibility
}: AnimatedPlantGraphProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Use combined view if explicitly set or if dataTypes is provided
  const useCombinedView = combinedView || (!dataType && dataTypes && dataTypes.length > 0);
  
  // If not in combined view but no dataType is specified, default to temperature
  const singleDataType = dataType || 'temperature';
  
  // Detect dark mode
  useEffect(() => {
    // Check if dark mode is already set via media query
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);
    
    // Listen for changes in color scheme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    // Add event listener
    mediaQuery.addEventListener('change', handleChange);
    
    // Also check for dark class on html element for theme toggle support
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const htmlElement = document.documentElement;
          if (htmlElement.classList.contains('dark')) {
            setIsDarkMode(true);
          } else {
            setIsDarkMode(false);
          }
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      observer.disconnect();
    };
  }, []);
  
  // Format the data for the chart
  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    
    // For combined view, we want to store data by 5-second intervals
    // For single data type view, we group by 5-minute intervals
    const intervals: Record<string, any> = {};
    const intervalMs = useCombinedView ? 5000 : 300000; // 5 seconds or 5 minutes
    
    sortedData.forEach(item => {
      const timestamp = new Date(item.timestamp);
      
      if (useCombinedView) {
        // For 5-second intervals
        const seconds = timestamp.getSeconds();
        const roundedSeconds = Math.floor(seconds / 5) * 5;
        timestamp.setSeconds(roundedSeconds);
        timestamp.setMilliseconds(0);
      } else {
        // For 5-minute intervals
        const minutes = timestamp.getMinutes();
        const roundedMinutes = Math.floor(minutes / 5) * 5;
        timestamp.setMinutes(roundedMinutes);
        timestamp.setSeconds(0);
        timestamp.setMilliseconds(0);
      }
      
      const key = timestamp.getTime().toString();
      
      if (!intervals[key] || item.timestamp > intervals[key].timestamp) {
        intervals[key] = {
          ...item,
          roundedTimestamp: timestamp
        };
      }
    });
    
    // Convert back to array and format based on view type
    if (useCombinedView) {
      return Object.values(intervals).map(item => ({
        time: format(item.roundedTimestamp, 'HH:mm:ss'),
        fullTime: item.roundedTimestamp,
        ...dataTypes.reduce((acc, type) => {
          acc[type] = item[type] !== undefined ? item[type] : null;
          return acc;
        }, {})
      }));
    } else {
      return Object.values(intervals).map(item => ({
        time: format(item.roundedTimestamp, 'HH:mm'),
        fullTime: item.roundedTimestamp,
        value: item[singleDataType] || 0
      }));
    }
  }, [data, singleDataType, dataTypes, useCombinedView]);
  
  // Animation effect to reveal the graph
  useEffect(() => {
    // Small delay to ensure the component has mounted
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Get configuration for the current data type (used in single-view mode)
  const config = typeConfig[singleDataType];
  
  // Custom tooltip component with Apple-inspired design
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const time = payload[0].payload.fullTime;
      
      return (
        <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 p-4 rounded-xl shadow-lg border-0 sf-pro-display animate-scale-pulse"
          style={{ 
            boxShadow: isDarkMode 
              ? '0 10px 25px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.3)'
              : '0 10px 25px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.04)',
          }}>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {format(time, useCombinedView ? 'MMM d, yyyy HH:mm:ss' : 'MMM d, yyyy HH:mm')}
          </p>
          
          {useCombinedView ? (
            // Show all data types in the tooltip for combined view
            <div className="space-y-1.5">
              {payload.map((entry: any, index: number) => {
                if (!entry.dataKey || 
                    !(['temperature', 'humidity', 'light', 'soilMoisture'] as const).includes(entry.dataKey as any)) {
                  return null;  
                }
                
                const dataTypeKey = entry.dataKey as keyof typeof typeConfig;
                const cfg = typeConfig[dataTypeKey];
                
                if (entry.value === null || entry.value === undefined) return null;
                
                return (
                  <p key={index} className="text-base font-semibold flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="h-3 w-3 mr-1.5 rounded-sm" 
                        style={{ backgroundColor: isDarkMode ? cfg.darkColor : cfg.color }}>
                      </span>
                      {cfg.name}:
                    </span>
                    <span style={{ color: isDarkMode ? cfg.darkColor : cfg.color }}>
                      {entry.value}{cfg.unit}
                    </span>
                  </p>
                );
              })}
            </div>
          ) : (
            // Show single data type for single view
            <p className="text-xl font-bold tracking-tight" 
              style={{ color: isDarkMode ? config.darkColor : config.color }}>
              {payload[0].value}{config.unit}
            </p>
          )}
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
          className="w-full ios-card overflow-hidden sf-pro-display dark:text-white"
          style={{
            borderRadius: '20px',
            backdropFilter: 'blur(20px)',
            background: isDarkMode 
              ? 'rgba(30, 41, 59, 0.85)' 
              : 'rgba(255, 255, 255, 0.85)',
            boxShadow: isDarkMode
              ? '0 10px 30px rgba(0, 0, 0, 0.2), 0 1px 8px rgba(0, 0, 0, 0.3)'
              : '0 10px 30px rgba(31, 38, 135, 0.1), 0 1px 8px rgba(0, 0, 0, 0.06)'
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
              <span className="w-2 h-2 rounded-full mr-1.5" style={{ 
                backgroundColor: isDarkMode ? config.darkColor : config.color, 
                boxShadow: `0 0 3px ${isDarkMode ? config.darkColor : config.color}` 
              }}></span>
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
                  {/* Create gradients for each data type */}
                  {Object.entries(typeConfig).map(([key, cfg]) => [
                    <linearGradient key={`${key}-light`} id={`gradient-${key}-light`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={cfg.gradient[0]} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={cfg.gradient[1]} stopOpacity={0.2} />
                    </linearGradient>,
                    <linearGradient key={`${key}-dark`} id={`gradient-${key}-dark`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={cfg.darkGradient[0]} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={cfg.darkGradient[1]} stopOpacity={0.3} />
                    </linearGradient>
                  ]).flat()}
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDarkMode ? "rgba(100,100,100,0.15)" : "rgba(200,200,200,0.15)"} 
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tick={{ 
                    fontSize: 11, 
                    fontWeight: 500, 
                    fill: isDarkMode ? 'rgba(200,200,200,0.8)' : 'rgba(100,100,100,0.8)',
                    fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  }}
                  tickLine={false}
                  axisLine={{ stroke: isDarkMode ? 'rgba(100,100,100,0.3)' : 'rgba(200,200,200,0.3)', strokeWidth: 1 }}
                  dy={8}
                />
                <YAxis
                  tick={{ 
                    fontSize: 11, 
                    fontWeight: 500, 
                    fill: isDarkMode ? 'rgba(200,200,200,0.8)' : 'rgba(100,100,100,0.8)',
                    fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  }}
                  tickLine={false}
                  axisLine={{ stroke: isDarkMode ? 'rgba(100,100,100,0.3)' : 'rgba(200,200,200,0.3)', strokeWidth: 1 }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                  dx={-5}
                  width={30}
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ 
                    stroke: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', 
                    strokeWidth: 1, 
                    strokeDasharray: '3 3' 
                  }}
                />
                
                {/* Render multiple lines for combined view or single line for single view */}
                {useCombinedView ? (
                  // Multiple lines for combined view
                  dataTypes.map((type) => {
                    const cfg = typeConfig[type];
                    return (
                      <Line
                        key={type}
                        type="monotone"
                        connectNulls={true}
                        dataKey={type}
                        stroke={isDarkMode ? cfg.darkColor : cfg.color}
                        strokeWidth={2.5}
                        dot={{ 
                          r: 3.5, 
                          strokeWidth: 2, 
                          fill: isDarkMode ? '#1e293b' : 'white', 
                          stroke: isDarkMode ? cfg.darkColor : cfg.color 
                        }}
                        activeDot={{ 
                          r: 5, 
                          strokeWidth: 2.5, 
                          fill: isDarkMode ? '#1e293b' : 'white', 
                          stroke: isDarkMode ? cfg.darkColor : cfg.color,
                          strokeOpacity: 0.9,
                          className: "animate-pulse-slow"
                        }}
                        isAnimationActive={true}
                        animationDuration={1800 + Math.random() * 400}
                        animationEasing="ease-in-out"
                        name={cfg.name}
                      />
                    );
                  })
                ) : (
                  // Single line for single data type view
                  <Line
                    type="monotone"
                    connectNulls={true}
                    dataKey="value"
                    stroke={isDarkMode ? config.darkColor : config.color}
                    strokeWidth={3}
                    dot={{ 
                      r: 4, 
                      strokeWidth: 2, 
                      fill: isDarkMode ? '#1e293b' : 'white', 
                      stroke: isDarkMode ? config.darkColor : config.color 
                    }}
                    activeDot={{ 
                      r: 6, 
                      strokeWidth: 3, 
                      fill: isDarkMode ? '#1e293b' : 'white', 
                      stroke: isDarkMode ? config.darkColor : config.color,
                      strokeOpacity: 0.9,
                      className: "animate-pulse-slow"
                    }}
                    isAnimationActive={true}
                    animationDuration={2000}
                    animationEasing="ease-in-out"
                    name={config.name}
                    fill={`url(#gradient-${singleDataType}-${isDarkMode ? 'dark' : 'light'})`}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
          
          <motion.div
            className={`px-5 pb-5 mt-4 ${useCombinedView ? 'flex flex-col space-y-2' : 'flex justify-between items-center'}`}
            variants={chartVariants}
          >
            <span className="text-xs font-medium bg-gray-100/70 dark:bg-gray-700/40 px-3 py-1 rounded-full text-gray-500 dark:text-gray-400 self-start">
              {`${formattedData.length} data points`}
            </span>
            
            {useCombinedView ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {dataTypes.map((type) => {
                  const cfg = typeConfig[type as keyof typeof typeConfig];
                  return (
                    <span key={type} className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                      <span 
                        className="h-3 w-3 mr-1.5 rounded-sm" 
                        style={{ backgroundColor: isDarkMode ? cfg.darkColor : cfg.color }}
                      ></span>
                      {cfg.name}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <span 
                  className="h-3 w-3 mr-1.5 rounded-sm" 
                  style={{ backgroundColor: isDarkMode ? config.darkColor : config.color }}
                ></span>
                Values in {config.unit}
              </span>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}