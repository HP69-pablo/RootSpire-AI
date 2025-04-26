import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface GrowthVisualizationProps {
  userId: string;
  plantId: string;
  plantName: string;
  growthData: {
    heights: Array<{ timestamp: number; value: number }>;
    widths: Array<{ timestamp: number; value: number }>;
    leafCounts: Array<{ timestamp: number; value: number }>;
  };
  isLoading?: boolean;
}

export function GrowthVisualization({ 
  userId, 
  plantId, 
  plantName, 
  growthData, 
  isLoading = false 
}: GrowthVisualizationProps) {
  const [activeTab, setActiveTab] = useState<string>('height');
  
  // Format data for recharts
  const formatChartData = (
    data: Array<{ timestamp: number; value: number }>,
    valueLabel: string
  ) => {
    return data.map(item => ({
      date: new Date(item.timestamp).toLocaleDateString(),
      timestamp: item.timestamp,
      [valueLabel]: item.value
    }));
  };
  
  const heightData = formatChartData(growthData.heights, 'height');
  const widthData = formatChartData(growthData.widths, 'width');
  const leafCountData = formatChartData(growthData.leafCounts, 'leafCount');
  
  // Check if we have data to display
  const hasData = 
    growthData.heights.length > 0 || 
    growthData.widths.length > 0 || 
    growthData.leafCounts.length > 0;
  
  // Determine which tab should be active by default (the one with data)
  useEffect(() => {
    if (growthData.heights.length > 0) {
      setActiveTab('height');
    } else if (growthData.widths.length > 0) {
      setActiveTab('width');
    } else if (growthData.leafCounts.length > 0) {
      setActiveTab('leafCount');
    }
  }, [growthData]);
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(data.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-md border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-800 dark:text-white">{date}</p>
          {payload.map((item: any, index: number) => (
            <p 
              key={index} 
              className="text-sm"
              style={{ color: item.color }}
            >
              {item.name === 'height' ? 'Height: ' : 
               item.name === 'width' ? 'Width: ' : 
               'Leaf Count: '}
              <span className="font-semibold">
                {item.value}
                {item.name === 'height' || item.name === 'width' ? ' cm' : ''}
              </span>
            </p>
          ))}
        </div>
      );
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <Card className="w-full mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Growth Visualization</span>
            <Badge variant="outline" className="ml-2">Loading</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className="w-full mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Growth Visualization</span>
            <Badge variant="outline" className="ml-2">No Data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No growth measurements recorded yet. Add measurements in the timeline to see your plant's growth visualized here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Growth Visualization</span>
          <Badge 
            variant="outline" 
            className="ml-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
          >
            {growthData.heights.length + growthData.widths.length + growthData.leafCounts.length} Records
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger 
              value="height" 
              disabled={growthData.heights.length === 0}
              className={growthData.heights.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Height
            </TabsTrigger>
            <TabsTrigger 
              value="width" 
              disabled={growthData.widths.length === 0}
              className={growthData.widths.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Width
            </TabsTrigger>
            <TabsTrigger 
              value="leafCount" 
              disabled={growthData.leafCounts.length === 0}
              className={growthData.leafCounts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Leaf Count
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="height">
            <div className="h-64">
              {growthData.heights.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={heightData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      tickMargin={10}
                      className="text-gray-500 dark:text-gray-400 fill-current" 
                    />
                    <YAxis 
                      unit=" cm" 
                      tick={{ fontSize: 12 }} 
                      tickMargin={10}
                      className="text-gray-500 dark:text-gray-400 fill-current" 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="height" 
                      name="Height"
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorHeight)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">
                    No height measurements recorded yet.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="width">
            <div className="h-64">
              {growthData.widths.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={widthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWidth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      tickMargin={10}
                      className="text-gray-500 dark:text-gray-400 fill-current" 
                    />
                    <YAxis 
                      unit=" cm" 
                      tick={{ fontSize: 12 }} 
                      tickMargin={10}
                      className="text-gray-500 dark:text-gray-400 fill-current" 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="width" 
                      name="Width"
                      stroke="#8b5cf6" 
                      fillOpacity={1} 
                      fill="url(#colorWidth)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">
                    No width measurements recorded yet.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="leafCount">
            <div className="h-64">
              {growthData.leafCounts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={leafCountData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLeafCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      tickMargin={10}
                      className="text-gray-500 dark:text-gray-400 fill-current" 
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      tickMargin={10}
                      className="text-gray-500 dark:text-gray-400 fill-current" 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="leafCount" 
                      name="Leaf Count"
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorLeafCount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">
                    No leaf count measurements recorded yet.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}