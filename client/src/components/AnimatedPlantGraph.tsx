import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import { Droplet, Sun, Thermometer, Gauge } from 'lucide-react';

// Custom styled tooltip
const CustomTooltip = ({ active, payload, label, dataType }: any) => {
  if (active && payload && payload.length) {
    // Get the right color based on data type
    const getColor = () => {
      switch (dataType) {
        case 'temperature':
          return 'rgb(239, 68, 68)';
        case 'humidity':
          return 'rgb(59, 130, 246)';
        case 'light':
          return 'rgb(250, 204, 21)';
        case 'soilMoisture':
          return 'rgb(16, 185, 129)';
        default:
          return 'rgb(107, 114, 128)';
      }
    };

    // Get the right unit based on data type
    const getUnit = () => {
      switch (dataType) {
        case 'temperature':
          return '°C';
        case 'humidity':
        case 'soilMoisture':
          return '%';
        case 'light':
          return ' lux';
        default:
          return '';
      }
    };

    // Convert timestamp to readable time
    const getTimeString = () => {
      const date = new Date(label);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glassmorphic-card p-3 shadow-lg min-w-[180px]"
        style={{
          borderLeft: `4px solid ${getColor()}`,
        }}
      >
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{getTimeString()}</p>
        <div className="flex items-center gap-2 mb-1">
          {dataType === 'temperature' && <Thermometer size={16} className="text-red-500" />}
          {dataType === 'humidity' && <Droplet size={16} className="text-blue-500" />}
          {dataType === 'light' && <Sun size={16} className="text-yellow-500" />}
          {dataType === 'soilMoisture' && <Gauge size={16} className="text-emerald-500" />}
          <p className="font-medium">
            {payload[0].value.toFixed(1)}{getUnit()}
          </p>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-white/5 to-white/20 dark:from-gray-800/30 dark:to-gray-800/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: getColor() }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, payload[0].value)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>
    );
  }

  return null;
};

interface AnimatedPlantGraphProps {
  data: Array<{
    timestamp: number;
    temperature?: number;
    humidity?: number;
    light?: number;
    soilMoisture?: number;
  }>;
  dataType: 'temperature' | 'humidity' | 'light' | 'soilMoisture';
  timeRange?: string;
  title?: string;
  height?: number;
}

export function AnimatedPlantGraph({
  data,
  dataType,
  timeRange = '24h',
  title,
  height = 220
}: AnimatedPlantGraphProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevDataLength = useRef<number>(0);

  // Process and sort data by timestamp
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Trigger animation if data length has changed
    if (data.length !== prevDataLength.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 800);
      prevDataLength.current = data.length;
      return () => clearTimeout(timer);
    }

    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

    // Process data for the chart
    const processedData = sortedData.map(item => ({
      timestamp: item.timestamp,
      [dataType]: item[dataType] || 0
    }));

    setChartData(processedData);
  }, [data, dataType]);

  // Get the color based on data type
  const getLineColor = () => {
    switch (dataType) {
      case 'temperature':
        return 'rgb(239, 68, 68)';
      case 'humidity':
        return 'rgb(59, 130, 246)';
      case 'light':
        return 'rgb(250, 204, 21)';
      case 'soilMoisture':
        return 'rgb(16, 185, 129)';
      default:
        return 'rgb(107, 114, 128)';
    }
  };

  // Get the gradient based on data type
  const getGradientColors = () => {
    switch (dataType) {
      case 'temperature':
        return {
          light: ['#FEE2E2', '#FECACA', '#FCA5A5'],
          dark: ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0)']
        };
      case 'humidity':
        return {
          light: ['#DBEAFE', '#BFDBFE', '#93C5FD'],
          dark: ['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0)']
        };
      case 'light':
        return {
          light: ['#FEF3C7', '#FDE68A', '#FCD34D'],
          dark: ['rgba(250, 204, 21, 0.3)', 'rgba(250, 204, 21, 0.1)', 'rgba(250, 204, 21, 0)']
        };
      case 'soilMoisture':
        return {
          light: ['#D1FAE5', '#A7F3D0', '#6EE7B7'],
          dark: ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0)']
        };
      default:
        return {
          light: ['#F3F4F6', '#E5E7EB', '#D1D5DB'],
          dark: ['rgba(107, 114, 128, 0.3)', 'rgba(107, 114, 128, 0.1)', 'rgba(107, 114, 128, 0)']
        };
    }
  };

  // Get the icon based on data type
  const getIcon = () => {
    switch (dataType) {
      case 'temperature':
        return <Thermometer className="h-5 w-5 text-red-500" />;
      case 'humidity':
        return <Droplet className="h-5 w-5 text-blue-500" />;
      case 'light':
        return <Sun className="h-5 w-5 text-yellow-500" />;
      case 'soilMoisture':
        return <Gauge className="h-5 w-5 text-emerald-500" />;
      default:
        return null;
    }
  };

  // Get the title for the graph
  const getTitle = () => {
    if (title) return title;
    
    switch (dataType) {
      case 'temperature':
        return 'Temperature';
      case 'humidity':
        return 'Humidity';
      case 'light':
        return 'Light Intensity';
      case 'soilMoisture':
        return 'Soil Moisture';
      default:
        return 'Plant Data';
    }
  };

  // Format timestamp for x-axis
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get the unit for y-axis
  const getUnit = () => {
    switch (dataType) {
      case 'temperature':
        return '°C';
      case 'humidity':
      case 'soilMoisture':
        return '%';
      case 'light':
        return 'lux';
      default:
        return '';
    }
  };

  const gradientColors = getGradientColors();
  const lineColor = getLineColor();

  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glassmorphic-card overflow-hidden border-0">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-full bg-white/70 dark:bg-gray-800/70 shadow-sm">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-base font-medium">{getTitle()}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last {timeRange} of data</p>
            </div>
          </div>

          {chartData.length > 0 ? (
            <motion.div 
              animate={isAnimating ? { opacity: [0.7, 1] } : {}}
              transition={{ duration: 0.5 }}
              className="w-full"
              style={{ height }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={chartData}
                  margin={{top: 10, right: 10, left: -20, bottom: 0}}
                >
                  <defs>
                    <linearGradient id={`${dataType}ColorGradient`} x1="0" y1="0" x2="0" y2="1">
                      <stop 
                        offset="5%" 
                        stopColor={lineColor} 
                        stopOpacity={0.8}
                      />
                      <stop 
                        offset="95%" 
                        stopColor={lineColor} 
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="rgba(107, 114, 128, 0.2)" 
                    vertical={false}
                  />
                  
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                    tick={{ fontSize: 10, fill: 'rgb(107, 114, 128)' }}
                    stroke="rgba(107, 114, 128, 0.2)"
                    tickMargin={5}
                  />
                  
                  <YAxis 
                    unit={getUnit()}
                    tick={{ fontSize: 10, fill: 'rgb(107, 114, 128)' }}
                    stroke="rgba(107, 114, 128, 0.2)"
                    tickMargin={5}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  
                  <Tooltip 
                    content={<CustomTooltip dataType={dataType} />}
                    position={{ y: -50 }}
                  />
                  
                  <Area 
                    type="monotone" 
                    dataKey={dataType} 
                    stroke={lineColor} 
                    strokeWidth={2}
                    fill={`url(#${dataType}ColorGradient)`}
                    animationDuration={1000}
                    activeDot={{ 
                      r: 6, 
                      stroke: 'white', 
                      strokeWidth: 2,
                      fill: lineColor
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center" style={{ height }}>
              <p className="text-gray-400 text-sm">No data available</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}