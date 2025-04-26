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
  const [activeMetric, setActiveMetric] = useState<'temperature' | 'humidity' | 'light' | 'soilMoisture'>('temperature');
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
      className="w-full p-5 sm:p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg shadow-lg border border-gray-100 dark:border-gray-700"
      style={{
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05), 0 1px 8px rgba(0, 0, 0, 0.06)"
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="flex flex-col space-y-4"
        variants={itemVariants}
      >
        <div className="flex flex-col space-y-2 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight sf-pro-display">
            Plant Health
          </h2>
          <p className="text-gray-500 dark:text-gray-400 sf-pro-display text-sm">
            Monitor and track your plant's environmental patterns over time
          </p>
        </div>
        
        <Tabs defaultValue="temperature" className="w-full" onValueChange={(value) => setActiveMetric(value as any)}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <TabsList className="grid grid-cols-4 bg-gray-100/80 dark:bg-gray-800/50 p-1 rounded-xl">
              <TabsTrigger value="temperature" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">Temperature</TabsTrigger>
              <TabsTrigger value="humidity" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">Humidity</TabsTrigger>
              <TabsTrigger value="light" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">Light</TabsTrigger>
              <TabsTrigger value="soilMoisture" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">Soil</TabsTrigger>
            </TabsList>
            
            <div className="flex justify-end space-x-2">
              {['1h', '6h', '12h', '24h'].map((tf) => (
                <motion.button
                  key={tf}
                  onClick={() => setTimeFrame(tf as TimeFrame)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                    timeFrame === tf 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-gray-100/90 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  whileHover={timeFrame !== tf ? { scale: 1.05 } : {}}
                >
                  {tf}
                </motion.button>
              ))}
            </div>
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
        </Tabs>
        
        <div className="flex justify-center items-center mt-3 mb-2 space-x-2">
          <div className="px-3 py-1 bg-gray-100/70 dark:bg-gray-800/50 rounded-full">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 sf-pro-display">
              {historyArray.length} data points collected
            </span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
          <div className="flex items-center">
            <span className="animate-pulse w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 sf-pro-display">
              Last updated {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}