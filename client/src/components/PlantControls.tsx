import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Leaf, Droplet, Sun, Thermometer, Droplets, Gauge, Flower } from 'lucide-react';
import { motion } from 'framer-motion';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PlantControls as PlantControlsType, SensorData } from '@/lib/firebase';
import { OptimizeEnvironmentButton } from './OptimizeEnvironmentButton';
import { OptimalEnvironmentValues } from '@/lib/environmentOptimizer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PlantControlsProps {
  onAction: (action: string, state: boolean) => void;
  sensorData?: SensorData | null;
}

export function PlantControls({ onAction, sensorData }: PlantControlsProps) {
  const { toast } = useToast();
  const [controls, setControls] = useState<PlantControlsType>({
    uvLight: false,
    wateringActive: false
  });
  const [isWatering, setIsWatering] = useState(false);
  const [wateringDisabled, setWateringDisabled] = useState(false);
  const [plantType, setPlantType] = useState<string>("");
  const [customRanges, setCustomRanges] = useState({
    temperature: { min: 10, max: 32 },
    humidity: { min: 20, max: 80 },
    light: { min: 30, max: 70 },
    soilMoisture: { min: 30, max: 70 }
  });
  
  // Temperature and humidity status indicators - using dynamic thresholds
  const getTemperatureStatus = (temp: number) => {
    if (temp < customRanges.temperature.min) return "Low";
    if (temp > customRanges.temperature.max) return "High";
    return "Optimal";
  };
  
  const getHumidityStatus = (humidity: number) => {
    // Normalize humidity if the value is unrealistically high (legacy data might be in ppm)
    const normalizedHumidity = humidity > 100 ? humidity / 1000 : humidity;
    if (normalizedHumidity < customRanges.humidity.min) return "Low";
    if (normalizedHumidity > customRanges.humidity.max) return "High";
    return "Optimal";
  };
  
  // Get temperature color based on value - using dynamic thresholds
  const getTemperatureColor = (temp: number) => {
    if (temp < customRanges.temperature.min) return "text-blue-500";
    if (temp > customRanges.temperature.max) return "text-red-500";
    if (temp >= (customRanges.temperature.min + customRanges.temperature.max) / 2) return "text-orange-500";
    return "text-green-500";
  };
  
  const getTemperatureBackground = (temp: number) => {
    if (temp < customRanges.temperature.min) return "bg-blue-100 dark:bg-blue-900/30";
    if (temp > customRanges.temperature.max) return "bg-red-100 dark:bg-red-900/30";
    if (temp >= (customRanges.temperature.min + customRanges.temperature.max) / 2) return "bg-orange-100 dark:bg-orange-900/30";
    return "bg-green-100 dark:bg-green-900/30";
  };
  
  // Get humidity color based on value - using dynamic thresholds
  const getHumidityColor = (humidity: number) => {
    // Normalize humidity if the value is unrealistically high (legacy data might be in ppm)
    const normalizedHumidity = humidity > 100 ? humidity / 1000 : humidity;
    if (normalizedHumidity < customRanges.humidity.min) return "text-orange-500";
    if (normalizedHumidity > customRanges.humidity.max) return "text-blue-500";
    return "text-green-500";
  };
  
  const getHumidityBackground = (humidity: number) => {
    // Normalize humidity if the value is unrealistically high (legacy data might be in ppm)
    const normalizedHumidity = humidity > 100 ? humidity / 1000 : humidity;
    if (normalizedHumidity < customRanges.humidity.min) return "bg-orange-100 dark:bg-orange-900/30";
    if (normalizedHumidity > customRanges.humidity.max) return "bg-blue-100 dark:bg-blue-900/30";
    return "bg-green-100 dark:bg-green-900/30";
  };
  
  // Get light status based on value - using dynamic thresholds
  const getLightStatus = (light: number) => {
    if (light < customRanges.light.min) return "Low";
    if (light > customRanges.light.max) return "Bright";
    return "Medium";
  };
  
  // Get light color based on value - using dynamic thresholds
  const getLightColor = (light: number) => {
    if (light < customRanges.light.min) return "text-gray-500";
    if (light > customRanges.light.max) return "text-yellow-500";
    return "text-yellow-400";
  };
  
  // Get light background based on value - using dynamic thresholds
  const getLightBackground = (light: number) => {
    if (light < customRanges.light.min) return "bg-gray-100 dark:bg-gray-800";
    if (light > customRanges.light.max) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-yellow-50 dark:bg-yellow-900/20";
  };
  
  // Get soil moisture status based on value - using dynamic thresholds
  const getSoilMoistureStatus = (soilMoisture: number) => {
    if (soilMoisture < customRanges.soilMoisture.min) return "Dry";
    if (soilMoisture > customRanges.soilMoisture.max) return "Wet";
    return "Optimal";
  };
  
  // Get soil moisture color based on value - using dynamic thresholds
  const getSoilMoistureColor = (soilMoisture: number) => {
    if (soilMoisture < customRanges.soilMoisture.min) return "text-orange-500";
    if (soilMoisture > customRanges.soilMoisture.max) return "text-blue-500";
    return "text-emerald-500";
  };
  
  // Get soil moisture background based on value - using dynamic thresholds
  const getSoilMoistureBackground = (soilMoisture: number) => {
    if (soilMoisture < customRanges.soilMoisture.min) return "bg-orange-100 dark:bg-orange-900/30";
    if (soilMoisture > customRanges.soilMoisture.max) return "bg-blue-100 dark:bg-blue-900/30";
    return "bg-emerald-100 dark:bg-emerald-900/30";
  };

  // Handle UV light toggle
  const handleUvLightToggle = (checked: boolean) => {
    setControls(prev => ({ ...prev, uvLight: checked }));
    onAction('uvLight', checked);
  };

  // Handle watering button click
  const handleWateringClick = () => {
    if (wateringDisabled) return;
    
    setIsWatering(true);
    setWateringDisabled(true);
    
    onAction('watering', true);
    
    // Auto-disable watering after 3 seconds
    setTimeout(() => {
      setIsWatering(false);
      onAction('watering', false);
      
      // Prevent button spamming by adding a cooldown
      setTimeout(() => {
        setWateringDisabled(false);
      }, 5000);
    }, 3000);
  };
  
  // Handle plant type change
  const handlePlantTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlantType(e.target.value);
  };
  
  // Handle environment optimization from AI
  const handleOptimize = (optimalValues: OptimalEnvironmentValues) => {
    setCustomRanges({
      temperature: { 
        min: optimalValues.temperature.min, 
        max: optimalValues.temperature.max 
      },
      humidity: { 
        min: optimalValues.humidity.min, 
        max: optimalValues.humidity.max 
      },
      light: { 
        min: optimalValues.light.min, 
        max: optimalValues.light.max 
      },
      soilMoisture: { 
        min: optimalValues.soilMoisture.min, 
        max: optimalValues.soilMoisture.max 
      }
    });
    
    // Update the status indicator functions with the new ranges
    // This dynamically applies the AI-optimized thresholds
    toast({
      title: "Environment Optimized",
      description: `Thresholds have been set for ${plantType}`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white dark:bg-slate-800 shadow-md border-0 overflow-hidden rounded-2xl">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-blue-50/70 to-green-50/50 dark:from-blue-900/10 dark:to-green-900/5 z-0"
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <CardHeader className="relative z-10 border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Leaf className="h-5 w-5 text-green-600" />
            </motion.div>
            Plant Environment
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10 p-4">
          <div className="grid grid-cols-1 gap-3">
            {/* UV Light Control - More compact */}
            <motion.div 
              className="p-3 backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="flex items-center gap-2">
                <motion.div 
                  className={`p-1.5 rounded-full ${controls.uvLight ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}
                  animate={{ 
                    boxShadow: controls.uvLight 
                      ? ['0 0 0 rgba(252, 211, 77, 0)', '0 0 10px rgba(252, 211, 77, 0.7)', '0 0 0 rgba(252, 211, 77, 0)'] 
                      : 'none'
                  }}
                  transition={{ duration: 2, repeat: controls.uvLight ? Infinity : 0 }}
                >
                  <Sun className={`h-4 w-4 ${controls.uvLight ? 'text-yellow-500' : 'text-gray-400'}`} />
                </motion.div>
                <h3 className="font-medium text-sm">UV Light</h3>
              </div>
              
              <Switch 
                checked={controls.uvLight} 
                onCheckedChange={handleUvLightToggle} 
                className="data-[state=checked]:bg-green-500 h-5 w-9"
              />
            </motion.div>
            
            {/* Temperature & Humidity Readings */}
            <div className="flex gap-3">
              {/* Temperature Reading */}
              <motion.div 
                className="flex-1 p-3 backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.div 
                      className={`p-1.5 rounded-full ${sensorData ? getTemperatureBackground(sensorData.temperature) : 'bg-gray-100 dark:bg-gray-800'}`}
                    >
                      <Thermometer className={`h-4 w-4 ${sensorData ? getTemperatureColor(sensorData.temperature) : 'text-gray-400'}`} />
                    </motion.div>
                    <div>
                      <h3 className="font-medium text-sm">Temperature</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {sensorData ? getTemperatureStatus(sensorData.temperature) : 'No data'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold">
                      {sensorData ? `${sensorData.temperature}°C` : '--'}
                    </span>
                  </div>
                </div>
              </motion.div>
              
              {/* Humidity Reading */}
              <motion.div 
                className="flex-1 p-3 backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.div 
                      className={`p-1.5 rounded-full ${sensorData ? getHumidityBackground(sensorData.humidity) : 'bg-gray-100 dark:bg-gray-800'}`}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Droplets className={`h-4 w-4 ${sensorData ? getHumidityColor(sensorData.humidity) : 'text-gray-400'}`} />
                    </motion.div>
                    <div>
                      <h3 className="font-medium text-sm">Humidity</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {sensorData ? getHumidityStatus(sensorData.humidity) : 'No data'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold">
                      {sensorData ? `${sensorData.humidity > 100 ? (sensorData.humidity / 1000).toFixed(1) : sensorData.humidity}%` : '--'}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Light & Soil Moisture Readings */}
            <div className="flex gap-3">
              {/* Light Reading */}
              <motion.div 
                className="flex-1 p-3 backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.div 
                      className={`p-1.5 rounded-full ${sensorData?.light ? getLightBackground(sensorData.light) : 'bg-gray-100 dark:bg-gray-800'}`}
                      animate={{ 
                        boxShadow: sensorData?.light && sensorData.light > 50
                          ? ['0 0 0 rgba(252, 211, 77, 0)', '0 0 10px rgba(252, 211, 77, 0.7)', '0 0 0 rgba(252, 211, 77, 0)'] 
                          : 'none'
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sun className={`h-4 w-4 ${sensorData?.light ? getLightColor(sensorData.light) : 'text-gray-400'}`} />
                    </motion.div>
                    <div>
                      <h3 className="font-medium text-sm">Light Level</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {sensorData?.light ? getLightStatus(sensorData.light) : 'No data'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold">
                      {sensorData && sensorData.light !== undefined ? `${sensorData.light}%` : '--'}
                    </span>
                  </div>
                </div>
              </motion.div>
              
              {/* Soil Moisture Reading */}
              <motion.div 
                className="flex-1 p-3 backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.div 
                      className={`p-1.5 rounded-full ${sensorData?.soilMoisture ? getSoilMoistureBackground(sensorData.soilMoisture) : 'bg-gray-100 dark:bg-gray-800'}`}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Gauge className={`h-4 w-4 ${sensorData?.soilMoisture ? getSoilMoistureColor(sensorData.soilMoisture) : 'text-gray-400'}`} />
                    </motion.div>
                    <div>
                      <h3 className="font-medium text-sm">Soil Moisture</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {sensorData?.soilMoisture ? getSoilMoistureStatus(sensorData.soilMoisture) : 'No data'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold">
                      {sensorData && sensorData.soilMoisture !== undefined ? `${sensorData.soilMoisture}%` : '--'}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Watering Control - Compact */}
            <motion.div 
              className="p-3 backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <motion.div 
                    className={`p-1.5 rounded-full ${isWatering ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}
                    animate={{ 
                      y: isWatering ? [0, -3, 0] : 0,
                      boxShadow: isWatering 
                        ? ['0 0 0 rgba(96, 165, 250, 0)', '0 0 10px rgba(96, 165, 250, 0.7)', '0 0 0 rgba(96, 165, 250, 0)'] 
                        : 'none'
                    }}
                    transition={{ duration: 1.5, repeat: isWatering ? Infinity : 0, ease: "easeInOut" }}
                  >
                    <Droplet className={`h-4 w-4 ${isWatering ? 'text-blue-500' : 'text-gray-400'}`} />
                  </motion.div>
                  <h3 className="font-medium text-sm">Water Plants</h3>
                </div>
                
                {wateringDisabled && !isWatering && (
                  <span className="text-xs text-gray-500">
                    Available in {Math.ceil(5)}s
                  </span>
                )}
              </div>
              
              <Button 
                onClick={handleWateringClick}
                disabled={wateringDisabled || isWatering}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg h-8 text-xs font-medium transition-all duration-300 relative overflow-hidden"
                variant="default"
                size="sm"
              >
                {isWatering ? (
                  <>
                    <span className="relative z-10">Watering...</span>
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 bg-blue-400 h-full origin-bottom"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: isWatering ? 1 : 0 }}
                      transition={{ duration: 3, ease: "easeInOut" }}
                    />
                  </>
                ) : (
                  "Water Now"
                )}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}