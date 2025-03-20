import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface PlantConfigProps {
  onSave: (config: PlantConfigValues) => void;
}

export interface PlantConfigValues {
  plantType: string;
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  soilMoistureMin: number;
  soilMoistureMax: number;
}

export function PlantConfig({ onSave }: PlantConfigProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<PlantConfigValues>({
    plantType: 'succulent',
    tempMin: 18,
    tempMax: 26,
    humidityMin: 40,
    humidityMax: 60,
    soilMoistureMin: 30,
    soilMoistureMax: 50
  });
  
  const handleChange = (field: keyof PlantConfigValues, value: string | number) => {
    setConfig({
      ...config,
      [field]: value
    });
  };
  
  const handleSave = () => {
    onSave(config);
    toast({
      title: "Configuration saved",
      description: "Your plant configuration has been updated successfully.",
    });
  };
  
  return (
    <section>
      <Card className="bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Plant Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                <span className="material-icons text-sm text-gray-500">spa</span>
                <span>Plant Type</span>
              </Label>
              <Select 
                value={config.plantType} 
                onValueChange={(value) => handleChange('plantType', value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select plant type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="succulent">Succulent</SelectItem>
                  <SelectItem value="tropical">Tropical</SelectItem>
                  <SelectItem value="herb">Herb</SelectItem>
                  <SelectItem value="vegetable">Vegetable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 mb-2">
                <span className="material-icons text-sm text-gray-500">thermostat</span>
                <span>Ideal Temperature Range</span>
              </Label>
              <div className="flex items-center space-x-3">
                <Input 
                  type="number" 
                  className="w-20" 
                  value={config.tempMin}
                  onChange={(e) => handleChange('tempMin', parseInt(e.target.value))}
                />
                <span className="text-gray-500">to</span>
                <Input 
                  type="number" 
                  className="w-20" 
                  value={config.tempMax}
                  onChange={(e) => handleChange('tempMax', parseInt(e.target.value))}
                />
                <span className="text-gray-500">°C</span>
              </div>
            </div>
            
            <div>
              <Label className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 mb-2">
                <span className="material-icons text-sm text-gray-500">water_drop</span>
                <span>Ideal Humidity Range</span>
              </Label>
              <div className="flex items-center space-x-3">
                <Input 
                  type="number" 
                  className="w-20" 
                  value={config.humidityMin}
                  onChange={(e) => handleChange('humidityMin', parseInt(e.target.value))}
                />
                <span className="text-gray-500">to</span>
                <Input 
                  type="number" 
                  className="w-20" 
                  value={config.humidityMax}
                  onChange={(e) => handleChange('humidityMax', parseInt(e.target.value))}
                />
                <span className="text-gray-500">%</span>
              </div>
            </div>
            
            <div>
              <Label className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 mb-2">
                <span className="material-icons text-sm text-gray-500">grass</span>
                <span>Ideal Soil Moisture Range</span>
              </Label>
              <div className="flex items-center space-x-3">
                <Input 
                  type="number" 
                  className="w-20" 
                  value={config.soilMoistureMin}
                  onChange={(e) => handleChange('soilMoistureMin', parseInt(e.target.value))}
                />
                <span className="text-gray-500">to</span>
                <Input 
                  type="number" 
                  className="w-20" 
                  value={config.soilMoistureMax}
                  onChange={(e) => handleChange('soilMoistureMax', parseInt(e.target.value))}
                />
                <span className="text-gray-500">%</span>
              </div>
            </div>
            
            <Button 
              className="w-full"
              onClick={handleSave}
            >
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
