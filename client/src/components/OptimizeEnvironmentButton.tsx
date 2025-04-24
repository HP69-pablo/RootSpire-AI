import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { getOptimalEnvironmentValues, OptimalEnvironmentValues } from '@/lib/environmentOptimizer';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface OptimizeEnvironmentButtonProps {
  plantType: string;
  onOptimize: (values: OptimalEnvironmentValues) => void;
}

export function OptimizeEnvironmentButton({ 
  plantType, 
  onOptimize 
}: OptimizeEnvironmentButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [optimizedValues, setOptimizedValues] = useState<OptimalEnvironmentValues | null>(null);

  const handleOptimizeClick = async () => {
    if (!plantType) {
      toast({
        title: "Plant Type Required",
        description: "Please select a plant type to optimize the environment.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const values = await getOptimalEnvironmentValues(plantType);
      setOptimizedValues(values);
      setShowResults(true);
      onOptimize(values);
      
      // Show success toast
      toast({
        title: "Environment Optimized",
        description: `${plantType} environment values have been optimized.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error optimizing environment:", error);
      toast({
        title: "Optimization Failed",
        description: "Could not determine optimal environment values. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false);
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button 
          onClick={handleOptimizeClick}
          disabled={loading || !plantType}
          className={cn(
            "relative bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium",
            "py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg border-0",
            "flex items-center gap-2 w-full justify-center"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing Plant...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Optimize Using AI</span>
            </>
          )}
        </Button>
      </motion.div>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900 rounded-xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-600/10 border-b">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Optimized Environment
            </DialogTitle>
            <DialogDescription>
              AI-optimized settings for {plantType}
            </DialogDescription>
          </DialogHeader>
          
          {optimizedValues && (
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Temperature</h3>
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Optimal Range</span>
                  <span className="font-semibold">
                    {optimizedValues.temperature.min}°C - {optimizedValues.temperature.max}°C
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Humidity</h3>
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Optimal Range</span>
                  <span className="font-semibold">
                    {optimizedValues.humidity.min}% - {optimizedValues.humidity.max}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Light</h3>
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Optimal Range</span>
                  <span className="font-semibold">
                    {optimizedValues.light.min}% - {optimizedValues.light.max}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  {optimizedValues.light.description}
                </p>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Soil Moisture</h3>
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Optimal Range</span>
                  <span className="font-semibold">
                    {optimizedValues.soilMoisture.min}% - {optimizedValues.soilMoisture.max}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  {optimizedValues.soilMoisture.description}
                </p>
              </div>
              
              {optimizedValues.recommendations.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-medium">Recommendations</h3>
                  <ul className="space-y-1">
                    {optimizedValues.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="p-4 bg-gray-50 dark:bg-gray-800/50">
            <Button onClick={handleCloseResults}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}