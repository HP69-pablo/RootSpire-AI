import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Thermometer, Droplets, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { UserPlant } from '@/lib/auth';
import { SensorCard } from '@/components/SensorCard';

interface PlantCardProps {
  plant: UserPlant;
  onViewDetails: (plant: UserPlant) => void;
}

export function PlantCard({ plant, onViewDetails }: PlantCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Determine plant health status color
  const getHealthColor = (health: string | undefined) => {
    switch (health) {
      case 'excellent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'good':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'poor':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  // Generate random sensor data for demo
  // In a real app, these would come from Firebase for each plant
  const temperature = Math.floor(Math.random() * 10) + 20; // 20-30°C
  const humidity = Math.floor(Math.random() * 30) + 30; // 30-60%
  const soil = Math.floor(Math.random() * 30) + 30; // 30-60%
  
  // Determine status based on ranges
  const getStatus = (value: number, min: number, max: number) => {
    if (value < min - 5 || value > max + 5) return 'Critical';
    if (value < min || value > max) return value < min ? 'Low' : 'High';
    return 'Optimal';
  };
  
  const temperatureStatus = getStatus(temperature, 18, 26);
  const humidityStatus = getStatus(humidity, 40, 60);
  const soilStatus = getStatus(soil, 30, 50);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="p-4 pb-0">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold">{plant.name}</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">{plant.species}</p>
            </div>
            <Badge className={getHealthColor(plant.health)}>
              {plant.health || 'Unknown'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-3">
          <div className="flex items-center gap-3 mb-2">
            {plant.imageUrl ? (
              <img 
                src={plant.imageUrl} 
                alt={plant.name} 
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                🌱
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-1 text-sm">
                <Thermometer className="h-3 w-3 text-red-500" />
                <span className="mr-2">{temperature}°C</span>
                
                <Droplets className="h-3 w-3 text-blue-500" />
                <span>{humidity}%</span>
              </div>
              
              {plant.lastWatered && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Last watered: {new Date(plant.lastWatered).toLocaleDateString()}
                </p>
              )}
              
              {plant.notes && (
                <p className="text-xs italic mt-1 text-gray-600 dark:text-gray-300">
                  "{plant.notes.substring(0, 50)}{plant.notes.length > 50 ? '...' : ''}"
                </p>
              )}
            </div>
          </div>
          
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <div className="grid grid-cols-3 gap-2">
                <SensorCard
                  type="temperature"
                  value={temperature}
                  status={temperatureStatus as any}
                />
                <SensorCard
                  type="humidity"
                  value={humidity}
                  status={humidityStatus as any}
                />
                <SensorCard
                  type="soil"
                  value={soil}
                  status={soilStatus as any}
                />
              </div>
              
              {(temperatureStatus !== 'Optimal' || humidityStatus !== 'Optimal' || soilStatus !== 'Optimal') && (
                <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-800 dark:text-amber-200">
                    <p className="font-medium">Attention needed</p>
                    <ul className="mt-1 ml-4 list-disc">
                      {temperatureStatus !== 'Optimal' && (
                        <li>Temperature is {temperatureStatus.toLowerCase()} (Ideal: 18-26°C)</li>
                      )}
                      {humidityStatus !== 'Optimal' && (
                        <li>Humidity is {humidityStatus.toLowerCase()} (Ideal: 40-60%)</li>
                      )}
                      {soilStatus !== 'Optimal' && (
                        <li>Soil moisture is {soilStatus.toLowerCase()} (Ideal: 30-50%)</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
              
              {temperatureStatus === 'Optimal' && humidityStatus === 'Optimal' && soilStatus === 'Optimal' && (
                <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-md flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <p className="text-xs text-green-800 dark:text-green-200">
                    All parameters are within optimal ranges
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
        
        <CardFooter className="p-2 pt-0 flex justify-between gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-xs flex items-center"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Less Details
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                More Details
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onViewDetails(plant)}
            className="text-xs"
          >
            View History
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}