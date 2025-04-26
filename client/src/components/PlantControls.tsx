import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Leaf, Droplet, Sun, Thermometer, Droplets, Gauge, Flower, Loader2, RefreshCw, AlertTriangle, 
         Sparkle as Sparkles, DropletIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PlantControls as PlantControlsType, SensorData } from '@/lib/firebase';
import { OptimizeEnvironmentButton } from './OptimizeEnvironmentButton';
import { getOptimalEnvironmentValues, OptimalEnvironmentValues } from '@/lib/environmentOptimizer';
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
  const [plantTypeLoading, setPlantTypeLoading] = useState(false);
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
    if (light > customRanges.light.max) return "High";
    return "Optimal";
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
    const newPlantType = e.target.value;
    setPlantType(newPlantType);
    
    // Auto-optimize if plant type is 3 characters or longer and has changed
    if (newPlantType.length >= 3 && newPlantType !== plantType) {
      // Use a delay to prevent too many API calls while typing
      const optimizationTimer = setTimeout(async () => {
        try {
          setPlantTypeLoading(true);
          const values = await getOptimalEnvironmentValues(newPlantType);
          handleOptimize(values);
        } catch (error) {
          console.error("Error auto-optimizing environment:", error);
          toast({
            title: "Auto-optimization Failed",
            description: "Could not determine optimal environment values automatically.",
            variant: "destructive"
          });
        } finally {
          setPlantTypeLoading(false);
        }
      }, 1000); // 1-second delay to avoid multiple API calls while typing
      
      return () => clearTimeout(optimizationTimer);
    }
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
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
    >
      <Card className="glassmorphic-card subtle-card-shine overflow-hidden border-0">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 to-blue-50/30 dark:from-emerald-900/10 dark:to-blue-900/5 z-0"
          animate={{ 
            opacity: [0.5, 0.7, 0.5],
            background: [
              "linear-gradient(120deg, rgba(209, 250, 229, 0.3), rgba(219, 234, 254, 0.2))",
              "linear-gradient(120deg, rgba(209, 250, 229, 0.4), rgba(219, 234, 254, 0.3))",
              "linear-gradient(120deg, rgba(209, 250, 229, 0.3), rgba(219, 234, 254, 0.2))"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <CardHeader className="relative z-10 border-b border-gray-100/50 dark:border-gray-800/50">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <motion.div
              animate={{ 
                rotate: [0, 5, 0, -5, 0],
                scale: [1, 1.05, 1, 1.05, 1]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 p-2 rounded-full"
            >
              <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
            </motion.div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-500 dark:from-green-400 dark:to-emerald-300 font-semibold">
              Plant Environment
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10 p-4">
          <div className="grid grid-cols-1 gap-3">
            {/* UV Light Control */}
            <motion.div 
              className="glassmorphic p-3 rounded-xl flex items-center justify-between"
              whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className={`p-2 rounded-full ${
                    controls.uvLight 
                      ? 'bg-gradient-to-br from-yellow-100 to-amber-50 dark:from-yellow-900/40 dark:to-amber-900/20' 
                      : 'bg-gray-100 dark:bg-gray-800/60'
                  }`}
                  animate={{ 
                    boxShadow: controls.uvLight 
                      ? ['0 0 0 rgba(252, 211, 77, 0)', '0 0 15px rgba(252, 211, 77, 0.7)', '0 0 0 rgba(252, 211, 77, 0)'] 
                      : 'none'
                  }}
                  transition={{ duration: 2, repeat: controls.uvLight ? Infinity : 0 }}
                >
                  <Sun className={`h-5 w-5 ${
                    controls.uvLight 
                      ? 'text-yellow-500 dark:text-yellow-400' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`} />
                </motion.div>
                <div>
                  <h3 className="font-medium text-sm">UV Light</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {controls.uvLight ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              
              <Switch 
                checked={controls.uvLight} 
                onCheckedChange={handleUvLightToggle} 
                className={`data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-400 h-6 w-11`}
              />
            </motion.div>
            
            {/* Temperature & Humidity Readings */}
            <div className="flex gap-3">
              {/* Temperature Reading */}
              <motion.div 
                className="flex-1 glassmorphic rounded-xl p-0 overflow-hidden"
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(255, 255, 255, 0.1)" 
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className={`h-1 w-full ${
                  sensorData 
                    ? sensorData.temperature > 35 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                      : sensorData.temperature < 15 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-400'
                    : 'bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600'
                }`} />
                
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className={`p-2 rounded-full ${
                          sensorData 
                            ? sensorData.temperature > 30 
                              ? 'bg-gradient-to-br from-orange-100 to-red-50 dark:from-orange-900/40 dark:to-red-900/20' 
                              : sensorData.temperature < 15 
                                ? 'bg-gradient-to-br from-blue-100 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/20' 
                                : 'bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/20'
                            : 'bg-gray-100 dark:bg-gray-800/60'
                        }`}
                        animate={sensorData?.temperature && sensorData.temperature > 30 ? {
                          boxShadow: ['0 0 0 rgba(251, 146, 60, 0)', '0 0 12px rgba(251, 146, 60, 0.6)', '0 0 0 rgba(251, 146, 60, 0)'],
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Thermometer className={`h-5 w-5 ${
                          sensorData 
                            ? sensorData.temperature > 30 
                              ? 'text-orange-500 dark:text-orange-400' 
                              : sensorData.temperature < 15 
                                ? 'text-blue-500 dark:text-blue-400' 
                                : 'text-green-500 dark:text-green-400'
                            : 'text-gray-400 dark:text-gray-500'
                        }`} />
                      </motion.div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium text-sm">Temperature</h3>
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              sensorData 
                                ? sensorData.temperature > 30 
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' 
                                  : sensorData.temperature < 15 
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {sensorData ? getTemperatureStatus(sensorData.temperature) : 'No data'}
                          </motion.div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {sensorData ? (sensorData.temperature < 22 ? 'Too cool' : sensorData.temperature > 28 ? 'Too warm' : 'Perfect range') : 'Waiting for data...'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <motion.span 
                        className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300"
                        animate={sensorData ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {sensorData ? `${sensorData.temperature}°C` : '--'}
                      </motion.span>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Humidity Reading */}
              <motion.div 
                className="flex-1 glassmorphic rounded-xl p-0 overflow-hidden"
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(255, 255, 255, 0.1)" 
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className={`h-1 w-full ${
                  sensorData 
                    ? sensorData.humidity > 70 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400' 
                      : sensorData.humidity < 30 
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-400' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-400'
                    : 'bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600'
                }`} />
                
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className={`p-2 rounded-full ${
                          sensorData 
                            ? sensorData.humidity > 70 
                              ? 'bg-gradient-to-br from-blue-100 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/20' 
                              : sensorData.humidity < 30 
                                ? 'bg-gradient-to-br from-yellow-100 to-amber-50 dark:from-yellow-900/40 dark:to-amber-900/20' 
                                : 'bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/20'
                            : 'bg-gray-100 dark:bg-gray-800/60'
                        }`}
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Droplets className={`h-5 w-5 ${
                          sensorData 
                            ? sensorData.humidity > 70 
                              ? 'text-blue-500 dark:text-blue-400' 
                              : sensorData.humidity < 30 
                                ? 'text-yellow-500 dark:text-yellow-400' 
                                : 'text-green-500 dark:text-green-400'
                            : 'text-gray-400 dark:text-gray-500'
                        }`} />
                      </motion.div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium text-sm">Humidity</h3>
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              sensorData 
                                ? sensorData.humidity > 70 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                                  : sensorData.humidity < 30 
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {sensorData ? getHumidityStatus(sensorData.humidity) : 'No data'}
                          </motion.div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {sensorData ? (sensorData.humidity < 30 ? 'Too dry' : sensorData.humidity > 70 ? 'Too humid' : 'Perfect range') : 'Waiting for data...'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <motion.span 
                        className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300"
                        animate={sensorData ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {sensorData ? `${sensorData.humidity > 100 ? (sensorData.humidity / 1000).toFixed(1) : sensorData.humidity}%` : '--'}
                      </motion.span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Light & Soil Moisture Readings */}
            <div className="flex gap-3">
              {/* Light Reading */}
              <motion.div 
                className="flex-1 glassmorphic rounded-xl p-0 overflow-hidden"
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(255, 255, 255, 0.1)" 
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className={`h-1 w-full ${
                  sensorData?.light 
                    ? sensorData.light > 70 
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-400' 
                      : sensorData.light < 20 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-400' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-400'
                    : 'bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600'
                }`} />
                
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className={`p-2 rounded-full ${
                          sensorData?.light 
                            ? sensorData.light > 70 
                              ? 'bg-gradient-to-br from-yellow-100 to-amber-50 dark:from-yellow-900/40 dark:to-amber-900/20' 
                              : sensorData.light < 20 
                                ? 'bg-gradient-to-br from-indigo-100 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/20' 
                                : 'bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/20'
                            : 'bg-gray-100 dark:bg-gray-800/60'
                        }`}
                        animate={sensorData?.light && sensorData.light > 70 ? {
                          boxShadow: ['0 0 0 rgba(252, 211, 77, 0)', '0 0 15px rgba(252, 211, 77, 0.7)', '0 0 0 rgba(252, 211, 77, 0)'],
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Sun className={`h-5 w-5 ${
                          sensorData?.light 
                            ? sensorData.light > 70 
                              ? 'text-yellow-500 dark:text-yellow-400' 
                              : sensorData.light < 20 
                                ? 'text-indigo-500 dark:text-indigo-400' 
                                : 'text-green-500 dark:text-green-400'
                            : 'text-gray-400 dark:text-gray-500'
                        }`} />
                      </motion.div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium text-sm">Light Level</h3>
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              sensorData?.light 
                                ? sensorData.light > 70 
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                                  : sensorData.light < 20 
                                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' 
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {sensorData?.light ? getLightStatus(sensorData.light) : 'No data'}
                          </motion.div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {sensorData?.light ? (sensorData.light < 20 ? 'Too dark' : sensorData.light > 70 ? 'Too bright' : 'Perfect range') : 'Waiting for data...'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <motion.span 
                        className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300"
                        animate={sensorData?.light ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {sensorData && sensorData.light !== undefined ? `${sensorData.light}%` : '--'}
                      </motion.span>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Soil Moisture Reading */}
              <motion.div 
                className="flex-1 glassmorphic rounded-xl p-0 overflow-hidden"
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(255, 255, 255, 0.1)" 
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className={`h-1 w-full ${
                  sensorData?.soilMoisture 
                    ? sensorData.soilMoisture > 75 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400' 
                      : sensorData.soilMoisture < 30 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-400' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-400'
                    : 'bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600'
                }`} />
                
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className={`p-2 rounded-full ${
                          sensorData?.soilMoisture 
                            ? sensorData.soilMoisture > 75 
                              ? 'bg-gradient-to-br from-blue-100 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/20' 
                              : sensorData.soilMoisture < 30 
                                ? 'bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-900/40 dark:to-orange-900/20' 
                                : 'bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/20'
                            : 'bg-gray-100 dark:bg-gray-800/60'
                        }`}
                        animate={sensorData?.soilMoisture ? { scale: [1, 1.08, 1] } : {}}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Droplet className={`h-5 w-5 ${
                          sensorData?.soilMoisture 
                            ? sensorData.soilMoisture > 75 
                              ? 'text-blue-500 dark:text-blue-400' 
                              : sensorData.soilMoisture < 30 
                                ? 'text-amber-500 dark:text-amber-400' 
                                : 'text-green-500 dark:text-green-400'
                            : 'text-gray-400 dark:text-gray-500'
                        }`} />
                      </motion.div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium text-sm">Soil Moisture</h3>
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              sensorData?.soilMoisture
                                ? sensorData.soilMoisture > 75 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                                  : sensorData.soilMoisture < 30 
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' 
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {sensorData?.soilMoisture ? getSoilMoistureStatus(sensorData.soilMoisture) : 'No data'}
                          </motion.div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {sensorData?.soilMoisture ? (sensorData.soilMoisture < 30 ? 'Too dry' : sensorData.soilMoisture > 75 ? 'Too wet' : 'Perfect range') : 'Waiting for data...'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <motion.span 
                        className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300"
                        animate={sensorData?.soilMoisture ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {sensorData && sensorData.soilMoisture !== undefined ? `${sensorData.soilMoisture}%` : '--'}
                      </motion.span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Plant Type Selection */}
            <motion.div 
              className="glassmorphic rounded-xl p-0 overflow-hidden"
              whileHover={{ 
                scale: 1.02, 
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(255, 255, 255, 0.1)" 
              }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-indigo-400" />
              
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div 
                    className="p-2 rounded-full bg-gradient-to-br from-purple-100 to-indigo-50 dark:from-purple-900/40 dark:to-indigo-900/20"
                    animate={{ 
                      rotate: [0, 5, 0, -5, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Flower className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                  </motion.div>
                  <div>
                    <Label htmlFor="plantType" className="font-medium text-sm">Plant Type</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enter species for optimal settings
                    </p>
                  </div>
                  
                  {plantTypeLoading && (
                    <div className="flex items-center text-xs gap-1 ml-auto bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="h-3 w-3" />
                      </motion.div>
                      <span>Smart Optimizing...</span>
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <Input
                    id="plantType"
                    placeholder="Enter plant species (e.g. Aloe Vera)"
                    value={plantType}
                    onChange={handlePlantTypeChange}
                    className="apple-input w-full h-10 text-sm pr-8 border-0 focus:ring-purple-400/50"
                  />
                  
                  {plantType && (
                    <motion.div 
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                    >
                      <Flower className="h-4 w-4 text-purple-500" />
                    </motion.div>
                  )}
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/10 rounded-lg p-2 mt-3">
                  <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    <Flower className="h-3.5 w-3.5 text-purple-500" />
                    <span>AI will auto-optimize environment for your plant</span>
                  </p>
                </div>
              </div>
            </motion.div>
            
            {/* Watering Control */}
            <motion.div 
              className="glassmorphic rounded-xl p-0 overflow-hidden"
              whileHover={{ 
                scale: 1.02, 
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(255, 255, 255, 0.1)" 
              }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className={`h-1 w-full ${
                isWatering 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-400' 
                  : 'bg-gradient-to-r from-blue-400 to-sky-400'
              }`} />
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className={`p-2 rounded-full ${
                        isWatering 
                          ? 'bg-gradient-to-br from-blue-100 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/20' 
                          : 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/10'
                      }`}
                      animate={{ 
                        y: isWatering ? [0, -3, 0] : 0,
                        boxShadow: isWatering 
                          ? ['0 0 0 rgba(96, 165, 250, 0)', '0 0 15px rgba(96, 165, 250, 0.7)', '0 0 0 rgba(96, 165, 250, 0)'] 
                          : 'none'
                      }}
                      transition={{ duration: 1.5, repeat: isWatering ? Infinity : 0, ease: "easeInOut" }}
                    >
                      <Droplets className={`h-5 w-5 ${
                        isWatering 
                          ? 'text-blue-500 dark:text-blue-400' 
                          : 'text-blue-400 dark:text-blue-500/60'
                      }`} />
                    </motion.div>
                    <div>
                      <h3 className="font-medium text-sm">Water Plants</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isWatering 
                          ? 'Watering in progress...' 
                          : wateringDisabled 
                            ? `Available again in ${Math.ceil(5)}s` 
                            : 'Ready to water your plants'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {isWatering && (
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                      </motion.div>
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <Button 
                    onClick={handleWateringClick}
                    disabled={wateringDisabled || isWatering}
                    className={`w-full h-11 rounded-xl font-medium transition-all duration-300 relative overflow-hidden disabled:opacity-60 ${
                      isWatering 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white cursor-default' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                    }`}
                  >
                    {isWatering ? (
                      <>
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Droplet className="h-4 w-4" />
                          </motion.div>
                          <span>Watering in Progress</span>
                        </span>
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 origin-left"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: isWatering ? 1 : 0 }}
                          transition={{ duration: 3, ease: "easeInOut" }}
                          style={{ transformOrigin: 'left' }}
                        />
                      </>
                    ) : (
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Droplet className="h-4 w-4" />
                        <span>Water Now</span>
                      </span>
                    )}
                  </Button>
                  
                  {isWatering && (
                    <motion.div 
                      className="absolute inset-x-0 -bottom-4 flex justify-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <div className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs">
                        Watering for optimal soil moisture
                      </div>
                    </motion.div>
                  )}
                </div>
                
                {!isWatering && !wateringDisabled && sensorData?.soilMoisture && sensorData.soilMoisture < 30 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 mt-3">
                    <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                      <span>Soil moisture is low, watering recommended</span>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}