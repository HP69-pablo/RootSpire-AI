import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SensorHistory } from '@/lib/firebase';
import { format } from 'date-fns';

interface DataVisualizationProps {
  historyData: SensorHistory;
}

export function DataVisualization({ historyData }: DataVisualizationProps) {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    if (Object.keys(historyData).length === 0) return;
    
    // Convert historyData to array format for Recharts
    const dataArray = Object.entries(historyData).map(([timestamp, data]) => ({
      timestamp: parseInt(timestamp),
      ...data
    }));
    
    // Sort by timestamp
    dataArray.sort((a, b) => a.timestamp - b.timestamp);
    
    // Format data for chart
    const formattedData = dataArray.map(item => ({
      time: item.timestamp,
      temperature: item.temperature,
      humidity: item.humidity,
      soilMoisture: item.soilMoisture,
      // Format the timestamp for display
      timeFormatted: format(new Date(item.timestamp), 'h aaa')
    }));
    
    setChartData(formattedData);
  }, [historyData]);
  
  const getTimeRangeInDays = (): number => {
    switch (timeRange) {
      case '24h': return 1;
      case '7d': return 7;
      case '30d': return 30;
      default: return 1;
    }
  };
  
  return (
    <section className="mb-8">
      <Card className="bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium">Sensor History</CardTitle>
            
            {/* Time Range Selector */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-md p-1">
              {(['24h', '7d', '30d'] as const).map(range => (
                <button
                  key={range}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    timeRange === range 
                      ? 'bg-white dark:bg-slate-600 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="timeFormatted" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  yAxisId="temp"
                  orientation="left"
                  domain={[15, 35]}
                  tickCount={5}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: '°C', position: 'insideLeft', angle: -90, dy: 40, fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  yAxisId="humidity"
                  orientation="right"
                  domain={[0, 100]}
                  tickCount={5}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: '%', position: 'insideRight', angle: 90, dx: 15, fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    fontSize: 12,
                    color: 'hsl(var(--card-foreground))'
                  }}
                  labelFormatter={(value) => `Time: ${value}`}
                />
                <Legend verticalAlign="top" height={36} iconSize={10} iconType="circle" />
                <Line 
                  yAxisId="temp"
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  name="Temperature (°C)"
                />
                <Line 
                  yAxisId="humidity"
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  name="Humidity (%)"
                />
                <Line 
                  yAxisId="humidity"
                  type="monotone" 
                  dataKey="soilMoisture" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  name="Soil Moisture (%)"
                  style={{ opacity: 0.7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
