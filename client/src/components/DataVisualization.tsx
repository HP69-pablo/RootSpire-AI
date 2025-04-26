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
      className="w-full p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="flex flex-col space-y-4"
        variants={itemVariants}
      >
        <div className="flex flex-col space-y-2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Plant Health Trends
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Track your plant's environmental conditions over time
          </p>
        </div>
        
        <Tabs defaultValue="temperature" className="w-full" onValueChange={(value) => setActiveMetric(value as any)}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="temperature">Temperature</TabsTrigger>
            <TabsTrigger value="humidity">Humidity</TabsTrigger>
            <TabsTrigger value="light">Light</TabsTrigger>
            <TabsTrigger value="soilMoisture">Soil</TabsTrigger>
          </TabsList>
          
          <div className="mb-4 flex justify-end space-x-2">
            {['1h', '6h', '12h', '24h'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFrame(tf as TimeFrame)}
                className={`px-3 py-1 text-sm rounded-full transition-all ${
                  timeFrame === tf 
                    ? 'bg-primary text-white font-medium shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {tf}
              </button>
            ))}
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
        
        <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
          {historyArray.length} data points collected • Last updated: {new Date().toLocaleTimeString()}
        </div>
      </motion.div>
    </motion.div>
  );
}