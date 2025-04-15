import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Leaf, Droplet, Sun, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PlantControls as PlantControlsType } from '@/lib/firebase';

interface PlantControlsProps {
  onAction: (action: string, state: boolean) => void;
}

export function PlantControls({ onAction }: PlantControlsProps) {
  const { toast } = useToast();
  const [controls, setControls] = useState<PlantControlsType>({
    uvLight: false,
    wateringActive: false
  });
  const [isWatering, setIsWatering] = useState(false);
  const [wateringDisabled, setWateringDisabled] = useState(false);

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
            Plant Controls
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10 space-y-6 p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* UV Light Control */}
            <motion.div 
              className="p-5 backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className={`p-2 rounded-full ${controls.uvLight ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}
                  animate={{ 
                    boxShadow: controls.uvLight 
                      ? ['0 0 0 rgba(252, 211, 77, 0)', '0 0 15px rgba(252, 211, 77, 0.7)', '0 0 0 rgba(252, 211, 77, 0)'] 
                      : 'none'
                  }}
                  transition={{ duration: 2, repeat: controls.uvLight ? Infinity : 0 }}
                >
                  <Sun className={`h-6 w-6 ${controls.uvLight ? 'text-yellow-500' : 'text-gray-400'}`} />
                </motion.div>
                <div>
                  <h3 className="font-medium">UV Light</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {controls.uvLight ? 'Currently active' : 'Currently inactive'}
                  </p>
                </div>
              </div>
              
              <Switch 
                checked={controls.uvLight} 
                onCheckedChange={handleUvLightToggle} 
                className="data-[state=checked]:bg-green-500"
              />
            </motion.div>
            
            {/* Watering Control */}
            <motion.div 
              className="p-5 backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className={`p-2 rounded-full ${isWatering ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}
                    animate={{ 
                      y: isWatering ? [0, -5, 0] : 0,
                      boxShadow: isWatering 
                        ? ['0 0 0 rgba(96, 165, 250, 0)', '0 0 15px rgba(96, 165, 250, 0.7)', '0 0 0 rgba(96, 165, 250, 0)'] 
                        : 'none'
                    }}
                    transition={{ duration: 1.5, repeat: isWatering ? Infinity : 0, ease: "easeInOut" }}
                  >
                    <Droplet className={`h-6 w-6 ${isWatering ? 'text-blue-500' : 'text-gray-400'}`} />
                  </motion.div>
                  <div>
                    <h3 className="font-medium">Watering System</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isWatering ? 'Watering in progress...' : 'Ready to water'}
                    </p>
                  </div>
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
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-11 font-medium transition-all duration-300 relative overflow-hidden"
                variant="default"
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