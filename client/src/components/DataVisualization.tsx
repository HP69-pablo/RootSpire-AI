import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { SensorHistory } from '@/lib/firebase';
import { format, subHours, subMinutes } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  NameType, 
  ValueType 
} from 'recharts/types/component/DefaultTooltipContent';

interface DataVisualizationProps {
  historyData: SensorHistory;
  currentData?: {
    temperature: number;
    humidity: number;
    light?: number;
  };
}

type TimeFrame = '1h' | '6h' | '12h' | '24h' | 'custom';

export function DataVisualization({ historyData, currentData }: DataVisualizationProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('24h');
  const [chartData, setChartData] = useState<any[]>([]);
  const [customHours, setCustomHours] = useState<number>(2);
  const [customMinutes, setCustomMinutes] = useState<number>(0);
  const [hoveredValues, setHoveredValues] = useState<{
    temperature?: number;
    humidity?: number;
    soilMoisture?: number;
    light?: number;
    time?: string;
  } | null>(null);
  
  const processChartData = useCallback(() => {
    if (Object.keys(historyData).length === 0) return;
    
    // Convert historyData to array format for Recharts
    const dataArray = Object.entries(historyData).map(([timestamp, data]) => ({
      timestamp: parseInt(timestamp),
      ...data
    }));
    
    // Sort by timestamp
    dataArray.sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate cutoff time based on selected time frame
    const now = Date.now();
    let cutoffTime: number;
    
    switch (timeFrame) {
      case '1h':
        cutoffTime = subHours(now, 1).getTime();
        break;
      case '6h':
        cutoffTime = subHours(now, 6).getTime();
        break;
      case '12h':
        cutoffTime = subHours(now, 12).getTime();
        break;
      case '24h':
        cutoffTime = subHours(now, 24).getTime();
        break;
      case 'custom':
        cutoffTime = subMinutes(subHours(now, customHours), customMinutes).getTime();
        break;
      default:
        cutoffTime = subHours(now, 24).getTime();
    }
    
    // Filter data by time frame
    const filteredData = dataArray.filter(item => item.timestamp >= cutoffTime);
    
    // Format data for chart
    const formattedData = filteredData.map(item => ({
      time: item.timestamp,
      temperature: item.temperature,
      humidity: item.humidity,
      soilMoisture: item.soilMoisture || null,
      light: item.light || null,
      // Format the timestamp for display
      timeFormatted: format(new Date(item.timestamp), timeFrame === '1h' ? 'h:mm a' : 'h a')
    }));
    
    // Add current real-time data if available
    if (currentData && formattedData.length > 0) {
      // Add current data point at the end
      formattedData.push({
        time: now,
        temperature: currentData.temperature,
        humidity: currentData.humidity,
        light: currentData.light || null,
        soilMoisture: null, // We might not have real-time soil moisture
        timeFormatted: 'Now'
      });
    }
    
    setChartData(formattedData);
  }, [historyData, timeFrame, customHours, customMinutes, currentData]);
  
  useEffect(() => {
    processChartData();
  }, [processChartData]);
  
  // Custom tooltip component to show real-time values on hover
  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      // Update hovered values when tooltip is active
      const data = {
        temperature: payload[0]?.value as number,
        humidity: payload[1]?.value as number,
        soilMoisture: payload[2]?.value as number,
        light: payload[3]?.value as number,
        time: label
      };
      
      return (
        <div className="custom-tooltip bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md">
          <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            entry.value !== null && (
              <p 
                key={`item-${index}`} 
                className="text-sm" 
                style={{ color: entry.color }}
              >
                {`${entry.name}: ${entry.value}${String(entry.name).includes('Temperature') ? '°C' : '%'}`}
              </p>
            )
          ))}
        </div>
      );
    }
    
    return null;
  };
  
  const handleTimeFrameChange = (value: string) => {
    setTimeFrame(value as TimeFrame);
  };
  
  const handleCustomHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 72) {
      setCustomHours(value);
    }
  };
  
  const handleCustomMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value < 60) {
      setCustomMinutes(value);
    }
  };
  
  return (
    <section className="mb-8">
      <Card className="bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg font-medium">Sensor History</CardTitle>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Time Frame Selector */}
              <Select
                value={timeFrame}
                onValueChange={handleTimeFrameChange}
              >
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="Time frame" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last hour</SelectItem>
                  <SelectItem value="6h">6 hours</SelectItem>
                  <SelectItem value="12h">12 hours</SelectItem>
                  <SelectItem value="24h">24 hours</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Custom time input fields, only visible when custom is selected */}
              {timeFrame === 'custom' && (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <Label htmlFor="hours" className="text-xs mb-1">Hours</Label>
                    <Input 
                      id="hours"
                      type="number" 
                      min="0" 
                      max="72"
                      value={customHours} 
                      onChange={handleCustomHoursChange}
                      className="w-16 h-8"
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label htmlFor="minutes" className="text-xs mb-1">Minutes</Label>
                    <Input 
                      id="minutes"
                      type="number" 
                      min="0" 
                      max="59"
                      value={customMinutes} 
                      onChange={handleCustomMinutesChange}
                      className="w-16 h-8"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 20 }}
                onMouseMove={(e) => {
                  if (e?.activePayload) {
                    setHoveredValues({
                      temperature: e.activePayload[0]?.value as number,
                      humidity: e.activePayload[1]?.value as number,
                      soilMoisture: e.activePayload[2]?.value as number,
                      light: e.activePayload[3]?.value as number,
                      time: e.activeLabel as string
                    });
                  }
                }}
                onMouseLeave={() => setHoveredValues(null)}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="timeFormatted" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  yAxisId="temp"
                  orientation="left"
                  domain={['dataMin - 5', 'dataMax + 5']}
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
                  content={<CustomTooltip />}
                  cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 1 }}
                />
                <Legend verticalAlign="top" height={36} iconSize={10} iconType="circle" />
                <Line 
                  yAxisId="temp"
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4, stroke: '#ef4444', strokeWidth: 2 }}
                  name="Temperature (°C)"
                  isAnimationActive={false}
                />
                <Line 
                  yAxisId="humidity"
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                  name="Humidity (%)"
                  isAnimationActive={false}
                />
                <Line 
                  yAxisId="humidity"
                  type="monotone" 
                  dataKey="soilMoisture" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 2 }}
                  name="Soil Moisture (%)"
                  isAnimationActive={false}
                />
                <Line 
                  yAxisId="humidity"
                  type="monotone" 
                  dataKey="light" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4, stroke: '#f59e0b', strokeWidth: 2 }}
                  name="Light Level (%)"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {hoveredValues && (
            <div className="mt-2 text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-500 dark:text-gray-400">Temp:</span>
                <span className="font-medium">{hoveredValues.temperature?.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
                <span className="text-gray-500 dark:text-gray-400">Humidity:</span>
                <span className="font-medium">{hoveredValues.humidity?.toFixed(0)}%</span>
              </div>
              {hoveredValues.soilMoisture !== null && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-gray-500 dark:text-gray-400">Soil:</span>
                  <span className="font-medium">{hoveredValues.soilMoisture?.toFixed(0)}%</span>
                </div>
              )}
              {hoveredValues.light !== null && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-gray-500 dark:text-gray-400">Light:</span>
                  <span className="font-medium">{hoveredValues.light?.toFixed(0)}%</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
