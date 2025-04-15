import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Leaf } from 'lucide-react';

interface PlantControlsProps {
  onAction: (action: string, state: boolean) => void;
}

export function PlantControls({ onAction }: PlantControlsProps) {
  const { toast } = useToast();

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-600" />
          Plant Information
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/30">
          <h3 className="text-base font-medium mb-2 text-green-800 dark:text-green-400">Monitoring Mode Active</h3>
          <p className="text-sm text-green-700 dark:text-green-500">
            This smart monitoring system is tracking your plant's environment conditions in real-time.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
            <h4 className="text-sm font-medium mb-1">Temperature</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitoring ideal temperature range for optimal plant growth
            </p>
          </div>
          
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
            <h4 className="text-sm font-medium mb-1">Humidity</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tracking ambient humidity levels in your plant's environment
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}