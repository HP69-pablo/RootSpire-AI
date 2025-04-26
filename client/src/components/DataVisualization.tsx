import React, { useState, useMemo } from 'react';
import { AnimatedPlantGraph } from './AnimatedPlantGraph';
import { SensorHistory, PlantHistoryData } from '../lib/firebase';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DataVisualizationProps {
  historyData: SensorHistory;
  currentData?: {
    temperature: number;
    humidity: number;
    light?: number;
    soilMoisture?: number;
  };
}

type TimeFrame = '1h' | '6h' | '12h' | '24h' | 'custom';

export function DataVisualization({ historyData, currentData }: DataVisualizationProps) {
  const [activeMetric, setActiveMetric] = useState<'temperature' | 'humidity' | 'light' | 'soilMoisture' | 'combined'>('combined');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('24h');
  
  // Convert history data object to array
  const historyArray = useMemo(() => {
    const result: PlantHistoryData[] = [];
    
    // Convert timestamp keys to numbers and sort
    const sortedTimestamps = Object.keys(historyData)
      .map(ts => parseInt(ts))
      .sort((a, b) => a - b);
    
    // Filter based on selected time frame
    const now = Date.now();
    let timeLimit: number;
    
    switch(timeFrame) {
      case '1h':
        timeLimit = now - (60 * 60 * 1000);
        break;
      case '6h':
        timeLimit = now - (6 * 60 * 60 * 1000);
        break;
      case '12h':
        timeLimit = now - (12 * 60 * 60 * 1000);
        break;
      case '24h':
      default:
        timeLimit = now - (24 * 60 * 60 * 1000);
    }
    
    // Create data points from filtered timestamps
    sortedTimestamps.forEach(ts => {
      if (ts >= timeLimit) {
        const dataPoint = historyData[ts];
        result.push({
          timestamp: ts,
          temperature: dataPoint.temperature,
          humidity: dataPoint.humidity,
          light: dataPoint.light,
          soilMoisture: dataPoint.soilMoisture
        });
      }
    });
    
    // Add current data point if available
    if (currentData) {
      result.push({
        timestamp: now,
        ...currentData
      });
    }
    
    return result;
  }, [historyData, currentData, timeFrame]);
  
  // Generate time range display text
  const timeRangeText = useMemo(() => {
    switch(timeFrame) {
      case '1h': return '1 Hour';
      case '6h': return '6 Hours';
      case '12h': return '12 Hours';
      case '24h': return '24 Hours';
      default: return 'Custom';
    }
  }, [timeFrame]);
  
  // Define animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };
  
  return (
    <motion.div
      className="w-full p-5 sm:p-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/30"
      style={{
        boxShadow: "0 15px 40px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(255, 255, 255, 0.1) inset",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)"
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className="flex flex-col space-y-5"
        variants={itemVariants}
      >
        <div className="flex flex-col space-y-2 mb-6">
          <motion.h2 
            className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight sf-pro-display"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Plant Health
          </motion.h2>
          <motion.p 
            className="text-gray-500 dark:text-gray-400 sf-pro-display text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Monitor and track your plant's environmental patterns over time
          </motion.p>
        </div>
        
        <Tabs defaultValue="combined" className="w-full" onValueChange={(value) => setActiveMetric(value as any)}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-5">
            <TabsList className="grid grid-cols-5 bg-gray-100/60 dark:bg-gray-800/40 p-1.5 rounded-xl backdrop-blur-md border border-white/30 dark:border-gray-700/30 shadow-sm">
              <TabsTrigger 
                value="combined" 
                className="rounded-lg sf-pro-display text-xs sm:text-sm font-medium data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-700/90 data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md transition-all duration-300"
              >
                All Sensors
              </TabsTrigger>
              <TabsTrigger 
                value="temperature" 
                className="rounded-lg sf-pro-display text-xs sm:text-sm font-medium data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-700/90 data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md transition-all duration-300"
              >
                Temperature
              </TabsTrigger>
              <TabsTrigger 
                value="humidity" 
                className="rounded-lg sf-pro-display text-xs sm:text-sm font-medium data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-700/90 data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md transition-all duration-300"
              >
                Humidity
              </TabsTrigger>
              <TabsTrigger 
                value="light" 
                className="rounded-lg sf-pro-display text-xs sm:text-sm font-medium data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-700/90 data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md transition-all duration-300"
              >
                Light
              </TabsTrigger>
              <TabsTrigger 
                value="soilMoisture" 
                className="rounded-lg sf-pro-display text-xs sm:text-sm font-medium data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-700/90 data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md transition-all duration-300"
              >
                Soil
              </TabsTrigger>
            </TabsList>
            
            <motion.div 
              className="flex justify-end space-x-2 border border-white/20 dark:border-gray-700/30 bg-gray-50/40 dark:bg-gray-800/30 p-1.5 rounded-xl backdrop-blur-sm shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {['1h', '6h', '12h', '24h'].map((tf, index) => (
                <motion.button
                  key={tf}
                  onClick={() => setTimeFrame(tf as TimeFrame)}
                  className={`px-3 py-1.5 text-xs font-medium sf-pro-display rounded-lg transition-all ${
                    timeFrame === tf 
                      ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-md border border-white/10' 
                      : 'bg-gray-100/70 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-gray-600/60'
                  }`}
                  whileTap={{ scale: 0.92 }}
                  whileHover={timeFrame !== tf ? { 
                    scale: 1.05,
                    y: -1,
                    transition: { duration: 0.2 }
                  } : {}}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (index * 0.05), duration: 0.3 }}
                >
                  {tf}
                </motion.button>
              ))}
            </motion.div>
          </div>
          
          <TabsContent value="temperature">
            <AnimatedPlantGraph
              data={historyArray}
              dataType="temperature"
              timeRange={timeRangeText}
              title="Temperature History"
            />
          </TabsContent>
          
          <TabsContent value="humidity">
            <AnimatedPlantGraph
              data={historyArray}
              dataType="humidity"
              timeRange={timeRangeText}
              title="Humidity History"
            />
          </TabsContent>
          
          <TabsContent value="light">
            <AnimatedPlantGraph
              data={historyArray}
              dataType="light"
              timeRange={timeRangeText}
              title="Light Exposure History"
            />
          </TabsContent>
          
          <TabsContent value="soilMoisture">
            <AnimatedPlantGraph
              data={historyArray}
              dataType="soilMoisture"
              timeRange={timeRangeText}
              title="Soil Moisture History"
            />
          </TabsContent>
          
          <TabsContent value="combined">
            <AnimatedPlantGraph
              data={historyArray}
              dataTypes={['temperature', 'humidity', 'light', 'soilMoisture']}
              combinedView={true}
              timeRange={timeRangeText}
              title="All Sensor Data"
            />
          </TabsContent>
        </Tabs>
        
        <motion.div 
          className="flex flex-wrap justify-center items-center gap-3 mt-5 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <motion.div 
            className="px-4 py-1.5 bg-gray-100/60 dark:bg-gray-800/40 rounded-full border border-white/20 dark:border-gray-700/30 shadow-sm backdrop-blur-sm"
            whileHover={{ scale: 1.05, y: -1 }}
          >
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 sf-pro-display">
              {historyArray.length} data points collected
            </span>
          </motion.div>
          
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>
          
          <motion.div 
            className="flex items-center px-4 py-1.5 bg-gray-100/60 dark:bg-gray-800/40 rounded-full border border-white/20 dark:border-gray-700/30 shadow-sm backdrop-blur-sm"
            whileHover={{ scale: 1.05, y: -1 }}
          >
            <motion.span 
              className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
                boxShadow: [
                  '0 0 0 0 rgba(52, 211, 153, 0.7)', 
                  '0 0 0 4px rgba(52, 211, 153, 0.3)', 
                  '0 0 0 0 rgba(52, 211, 153, 0.7)'
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop"
              }}
            />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 sf-pro-display">
              Last updated {new Date().toLocaleTimeString()}
            </span>
          </motion.div>
          
          <motion.button
            className="flex items-center px-4 py-1.5 bg-gradient-to-br from-primary/90 to-primary-dark text-white rounded-full text-xs font-medium sf-pro-display shadow-md border border-white/10"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh data
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}