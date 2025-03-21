import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { ref, set } from 'firebase/database';
import { getDatabase } from 'firebase/database';

interface PlantControlsProps {
  onAction: (action: string, state: boolean) => void;
}

export function PlantControls({ onAction }: PlantControlsProps) {
  const { toast } = useToast();
  const [uvLightOn, setUvLightOn] = useState(false);
  const [wateringActive, setWateringActive] = useState(false);
  const [wateringInProgress, setWateringInProgress] = useState(false);

  const handleUvLightToggle = (checked: boolean) => {
    setUvLightOn(checked);
    onAction('uvLight', checked);
    
    // Update Firebase with the new state
    try {
      const db = getDatabase();
      set(ref(db, 'plantControls/uvLight'), checked);
      
      toast({
        title: checked ? "UV Light turned ON" : "UV Light turned OFF",
        description: checked 
          ? "The UV light is now providing supplemental light for your plant." 
          : "The UV light has been turned off.",
      });
    } catch (error) {
      console.error('Error updating UV light state:', error);
      toast({
        title: "Error",
        description: "Could not update UV light state.",
        variant: "destructive",
      });
    }
  };

  const handleWateringButton = () => {
    if (wateringInProgress) return; // Prevent multiple clicks
    
    setWateringActive(true);
    setWateringInProgress(true);
    onAction('watering', true);
    
    // Update Firebase with the watering command
    try {
      const db = getDatabase();
      set(ref(db, 'plantControls/wateringActive'), true);
      
      toast({
        title: "Watering started",
        description: "Watering system activated for 5 seconds.",
      });
      
      // Simulate watering for 5 seconds
      setTimeout(() => {
        setWateringActive(false);
        setWateringInProgress(false);
        onAction('watering', false);
        
        // Update Firebase when watering is complete
        set(ref(db, 'plantControls/wateringActive'), false);
        
        toast({
          title: "Watering complete",
          description: "Your plant has been watered successfully.",
        });
      }, 5000);
    } catch (error) {
      console.error('Error activating watering system:', error);
      setWateringActive(false);
      setWateringInProgress(false);
      
      toast({
        title: "Error",
        description: "Could not activate watering system.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Plant Controls</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* UV Light Control */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="uvLight" className="text-base">UV Light</Label>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Supplemental lighting for your plant
            </div>
          </div>
          <Switch
            id="uvLight"
            checked={uvLightOn}
            onCheckedChange={handleUvLightToggle}
          />
        </div>
        
        {/* Watering Button */}
        <div className="space-y-2">
          <Label className="text-base">Watering System</Label>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Activate watering for 5 seconds
          </div>
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleWateringButton}
            disabled={wateringInProgress}
            variant={wateringActive ? "outline" : "default"}
          >
            {wateringActive ? "Watering..." : "Water Plant"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}