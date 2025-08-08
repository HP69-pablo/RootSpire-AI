import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Thermometer, Droplets, Gauge } from "lucide-react";

type SensorType = "temperature" | "humidity" | "soil";

interface SensorCardProps {
  type: SensorType;
  value: number | string;
  previousValue?: number | string;
  status: "Optimal" | "High" | "Low" | "Critical";
}

export function SensorCard({ type, value, previousValue, status }: SensorCardProps) {
  const [animated, setAnimated] = useState(false);
  
  // Convert string values to numbers for calculations
  const numericValue = typeof value === 'string' ? (value === 'none' ? 0 : parseFloat(value)) : value;
  
  useEffect(() => {
    setAnimated(true);
    const timer = setTimeout(() => setAnimated(false), 500);
    return () => clearTimeout(timer);
  }, [value]);
  
  const getIcon = () => {
    switch (type) {
      case "temperature":
        return (
          <div className="icon-container temperature-icon">
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-primary-500">
              <path fill="currentColor" d="M15,13V5A3,3 0 0,0 9,5V13A5,5 0 1,0 15,13M12,4A1,1 0 0,1 13,5V8H11V5A1,1 0 0,1 12,4Z" />
              <motion.circle 
                className="indicator" 
                fill="#ef4444" 
                cx="12" 
                cy="13" 
                r="1.5" 
                animate={{ 
                  y: -Math.min(5, Math.max(-5, (numericValue - 25) * 0.5)) 
                }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </svg>
          </div>
        );
      case "humidity":
        return (
          <div className="icon-container humidity-icon">
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-primary-500">
              <path fill="currentColor" d="M12,3.25C12,3.25 6,10 6,14C6,17.32 8.69,20 12,20A6,6 0 0,0 18,14C18,10 12,3.25 12,3.25M14.47,9.97L15.53,11.03L9.53,17.03L8.47,15.97M9.75,10A1.25,1.25 0 0,1 11,11.25A1.25,1.25 0 0,1 9.75,12.5A1.25,1.25 0 0,1 8.5,11.25A1.25,1.25 0 0,1 9.75,10M14.25,14.5A1.25,1.25 0 0,1 15.5,15.75A1.25,1.25 0 0,1 14.25,17A1.25,1.25 0 0,1 13,15.75A1.25,1.25 0 0,1 14.25,14.5Z" />
              <motion.circle 
                className="indicator" 
                fill="currentColor" 
                cx="12" 
                cy="12" 
                r="1" 
                animate={{ 
                  y: 2,
                  opacity: numericValue < 30 ? 0.5 : 1
                }}
                transition={{ 
                  y: { 
                    duration: 2, 
                    repeat: Infinity, 
                    repeatType: "reverse" 
                  },
                  opacity: { duration: 0.5 }
                }}
              />
            </svg>
          </div>
        );
      case "soil":
        return (
          <div className="icon-container">
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-danger-500">
              <path fill="currentColor" d="M8.5,4.5L7,7H4C2.9,7 2,7.9 2,9V15C2,16.1 2.9,17 4,17H7L10.5,21L12,17H20C21.1,17 22,16.1 22,15V9C22,7.9 21.1,7 20,7H12L10.5,3L8.5,4.5M12.5,10.67C13.1,11.14 13.5,11.84 13.5,12.67C13.5,13.83 12.5,14.33 12.5,14.33C12.5,14.33 11.5,13.83 11.5,12.67C11.5,11.84 11.9,11.14 12.5,10.67Z" />
            </svg>
          </div>
        );
    }
  };
  
  const getLabel = () => {
    switch (type) {
      case "temperature": return "Temperature";
      case "humidity": return "Humidity";
      case "soil": return "Soil Moisture";
    }
  };
  
  const getUnit = () => {
    switch (type) {
      case "temperature": return "°C";
      case "humidity": return "%";
      case "soil": return "%";
    }
  };
  
  const getChange = () => {
    if (previousValue === undefined) return 0;
    if (value === "none" || previousValue === "none") return 0;
    return Number(value) - Number(previousValue);
  };
  
  const getChangeIcon = () => {
    const change = getChange();
    if (change > 0) {
      return <span className="material-icons text-success-500 text-sm">arrow_upward</span>;
    } else if (change < 0) {
      return <span className="material-icons text-warning-500 text-sm">arrow_downward</span>;
    }
    return null;
  };
  
  const getStatusClasses = () => {
    switch (status) {
      case "Optimal":
        return "bg-success-50 text-success-500";
      case "High":
      case "Low":
        return "bg-warning-50 text-warning-500";
      case "Critical":
        return "bg-danger-50 text-danger-500 animate-pulse-slow";
    }
  };
  
  // Handle "none" display for soil moisture
  const displayValue = () => {
    if (value === "none") {
      return "N/A";
    }
    if (typeof value === 'number') {
      return type === "temperature" ? value.toFixed(1) : Math.round(value);
    }
    return value;
  };

  // Get color scheme based on sensor type and status
  const getColorScheme = () => {
    if (value === "none") return {
      gradient: "from-gray-100 to-white dark:from-gray-800 dark:to-gray-700",
      icon: "text-gray-400 dark:text-gray-500",
      value: "text-gray-700 dark:text-gray-300"
    };
    
    switch (type) {
      case "temperature":
        if (status === "High") return {
          gradient: "from-red-50 to-rose-50 dark:from-red-900/30 dark:to-red-800/20",
          icon: "text-red-400 dark:text-red-400",
          value: "text-red-600 dark:text-red-300",
          status: "bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300"
        };
        if (status === "Low") return {
          gradient: "from-sky-50 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20",
          icon: "text-sky-400 dark:text-blue-400",
          value: "text-sky-600 dark:text-blue-300",
          status: "bg-sky-50 dark:bg-blue-900/40 text-sky-600 dark:text-blue-300"
        };
        return {
          gradient: "from-green-50 to-teal-50 dark:from-green-900/30 dark:to-green-800/20",
          icon: "text-teal-400 dark:text-green-400",
          value: "text-teal-600 dark:text-green-300",
          status: "bg-teal-50 dark:bg-green-900/40 text-teal-600 dark:text-green-300"
        };
      
      case "humidity":
        if (status === "High") return {
          gradient: "from-cyan-50 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20",
          icon: "text-cyan-400 dark:text-blue-400",
          value: "text-cyan-600 dark:text-blue-300",
          status: "bg-cyan-50 dark:bg-blue-900/40 text-cyan-600 dark:text-blue-300"
        };
        if (status === "Low") return {
          gradient: "from-amber-50 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20",
          icon: "text-amber-400 dark:text-orange-400",
          value: "text-amber-600 dark:text-orange-300",
          status: "bg-amber-50 dark:bg-orange-900/40 text-amber-600 dark:text-orange-300"
        };
        return {
          gradient: "from-emerald-50 to-green-50 dark:from-green-900/30 dark:to-green-800/20",
          icon: "text-emerald-400 dark:text-green-400",
          value: "text-emerald-600 dark:text-green-300",
          status: "bg-emerald-50 dark:bg-green-900/40 text-emerald-600 dark:text-green-300"
        };
      
      case "soil":
        if (status === "Low" || status === "Critical") return {
          gradient: "from-amber-50 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20",
          icon: "text-amber-400 dark:text-orange-400",
          value: "text-amber-600 dark:text-orange-300",
          status: "bg-amber-50 dark:bg-orange-900/40 text-amber-600 dark:text-orange-300"
        };
        if (status === "High") return {
          gradient: "from-sky-50 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20",
          icon: "text-sky-400 dark:text-blue-400",
          value: "text-sky-600 dark:text-blue-300",
          status: "bg-sky-50 dark:bg-blue-900/40 text-sky-600 dark:text-blue-300"
        };
        return {
          gradient: "from-teal-50 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/20",
          icon: "text-teal-400 dark:text-emerald-400",
          value: "text-teal-600 dark:text-emerald-300",
          status: "bg-teal-50 dark:bg-emerald-900/40 text-teal-600 dark:text-emerald-300"
        };
    }
  };
  
  const colorScheme = getColorScheme();
  
  // Ultra premium icons for sensors with enhanced Apple-inspired animations
  const getModernIcon = () => {
    switch (type) {
      case "temperature":
        return (
          <motion.div 
            className={`p-6 rounded-3xl bg-gradient-to-br ${colorScheme.gradient} shadow-xl`}
            style={{
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08), 0 5px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(255, 255, 255, 0.15) inset",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)"
            }}
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ 
              scale: animated ? [1, 1.08, 1] : 1,
              opacity: 1,
              y: status === "High" ? [0, -3, 0] : 0,
              boxShadow: status === "Critical" 
                ? ["0 10px 25px rgba(239, 68, 68, 0.15), 0 5px 10px rgba(239, 68, 68, 0.1), 0 1px 3px rgba(255, 255, 255, 0.15) inset", 
                   "0 15px 35px rgba(239, 68, 68, 0.25), 0 5px 15px rgba(239, 68, 68, 0.2), 0 1px 3px rgba(255, 255, 255, 0.15) inset", 
                   "0 10px 25px rgba(239, 68, 68, 0.15), 0 5px 10px rgba(239, 68, 68, 0.1), 0 1px 3px rgba(255, 255, 255, 0.15) inset"]
                : "0 10px 25px rgba(0, 0, 0, 0.08), 0 5px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(255, 255, 255, 0.15) inset"
            }}
            transition={{ 
              duration: 0.7, 
              y: { 
                duration: 2, 
                repeat: status === "High" ? Infinity : 0, 
                repeatType: "reverse" 
              },
              boxShadow: {
                duration: 2,
                repeat: status === "Critical" ? Infinity : 0,
                repeatType: "reverse"
              }
            }}
            whileHover={{ 
              scale: 1.12,
              y: -5,
              transition: { duration: 0.3 }
            }}
          >
            <motion.div 
              animate={
                status === "High" 
                ? { y: [-2, 2, -2], opacity: [0.8, 1, 0.8] } 
                : status === "Low" 
                ? { y: [2, -2, 2], opacity: [0.8, 1, 0.8] } 
                : {}
              }
              transition={{ 
                repeat: (status === "High" || status === "Low") ? Infinity : 0, 
                duration: 2, 
                repeatType: "loop" 
              }}
            >
              <Thermometer className={`h-10 w-10 ${colorScheme.icon} drop-shadow-md`} />
            </motion.div>
          </motion.div>
        );
      case "humidity":
        return (
          <motion.div 
            className={`p-6 rounded-3xl bg-gradient-to-br ${colorScheme.gradient} shadow-xl`}
            style={{
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08), 0 5px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(255, 255, 255, 0.15) inset",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)"
            }}
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ 
              scale: animated ? [1, 1.08, 1] : 1,
              opacity: 1,
              y: status !== "Low" ? [0, -3, 0] : 0,
              boxShadow: status === "Critical" 
                ? ["0 10px 25px rgba(59, 130, 246, 0.15), 0 5px 10px rgba(59, 130, 246, 0.1), 0 1px 3px rgba(255, 255, 255, 0.15) inset", 
                   "0 15px 35px rgba(59, 130, 246, 0.25), 0 5px 15px rgba(59, 130, 246, 0.2), 0 1px 3px rgba(255, 255, 255, 0.15) inset", 
                   "0 10px 25px rgba(59, 130, 246, 0.15), 0 5px 10px rgba(59, 130, 246, 0.1), 0 1px 3px rgba(255, 255, 255, 0.15) inset"]
                : "0 10px 25px rgba(0, 0, 0, 0.08), 0 5px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(255, 255, 255, 0.15) inset"
            }}
            transition={{ 
              duration: 0.7,
              y: { 
                duration: 2.5, 
                repeat: status !== "Low" ? Infinity : 0, 
                repeatType: "reverse" 
              },
              boxShadow: {
                duration: 2,
                repeat: status === "Critical" ? Infinity : 0,
                repeatType: "reverse"
              }
            }}
            whileHover={{ 
              scale: 1.12,
              y: -5,
              transition: { duration: 0.3 }
            }}
          >
            <motion.div 
              animate={
                status === "Optimal" || status === "High"
                ? { y: [-3, 0, -3], opacity: [0.8, 1, 0.8] } 
                : status === "Low" || status === "Critical"
                ? { rotate: [-5, 5, -5] } 
                : {}
              }
              transition={{ 
                repeat: Infinity, 
                duration: 2.5, 
                repeatType: "loop" 
              }}
            >
              <Droplets className={`h-10 w-10 ${colorScheme.icon} drop-shadow-md`} />
            </motion.div>
          </motion.div>
        );
      case "soil":
        return (
          <motion.div 
            className={`p-6 rounded-3xl bg-gradient-to-br ${colorScheme.gradient} shadow-xl`}
            style={{
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08), 0 5px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(255, 255, 255, 0.15) inset",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)"
            }}
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ 
              scale: animated ? [1, 1.08, 1] : 1,
              opacity: 1,
              rotate: status === "Low" || status === "Critical" ? [-2, 2, -2] : 0,
              boxShadow: status === "Critical" ? "0 0 20px rgba(239, 68, 68, 0.3)" : undefined" 
                ? ["0 10px 25px rgba(245, 158, 11, 0.15), 0 5px 10px rgba(245, 158, 11, 0.1), 0 1px 3px rgba(255, 255, 255, 0.15) inset", 
                   "0 15px 35px rgba(245, 158, 11, 0.25), 0 5px 15px rgba(245, 158, 11, 0.2), 0 1px 3px rgba(255, 255, 255, 0.15) inset", 
                   "0 10px 25px rgba(245, 158, 11, 0.15), 0 5px 10px rgba(245, 158, 11, 0.1), 0 1px 3px rgba(255, 255, 255, 0.15) inset"]
                : "0 10px 25px rgba(0, 0, 0, 0.08), 0 5px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(255, 255, 255, 0.15) inset"
            }}
            transition={{ 
              duration: 0.7,
              rotate: { 
                duration: 2, 
                repeat: (status === "Low" || status === "Critical") ? Infinity : 0, 
                repeatType: "reverse" 
              },
              boxShadow: {
                duration: 2,
                repeat: status === "Critical" ? Infinity : 0,
                repeatType: "reverse"
              }
            }}
            whileHover={{ 
              scale: 1.12,
              y: -5,
              transition: { duration: 0.3 }
            }}
          >
            <motion.div 
              animate={
                status === "Low" || status === "Critical"
                ? { rotate: [-8, 8, -8], scale: [0.95, 1, 0.95] } 
                : status === "High"
                ? { y: [-3, 0, -3], scale: [1, 1.05, 1] } 
                : {}
              }
              transition={{ 
                repeat: (status !== "Optimal") ? Infinity : 0, 
                duration: 2, 
                repeatType: "loop" 
              }}
            >
              <Gauge className={`h-10 w-10 ${colorScheme.icon} drop-shadow-md`} />
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <motion.div 
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 10px 30px rgba(0, 150, 136, 0.1)"
      }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="w-full h-full"
    >
      {/* Apple Fitness-style card */}
      <Card className="fitness-card overflow-hidden p-0"
      >
        <div className="p-4 flex flex-col justify-between h-full">
          {/* Card Header - Apple Fitness Style */}
          <div className="flex justify-between items-start">
            <motion.h3 
              className="text-sm font-medium text-gray-600 dark:text-gray-400 sf-pro-display tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              {getLabel()}
            </motion.h3>
          </div>
          
          {/* Central Value Display - Apple Fitness Style */}
          <motion.div 
            className="flex flex-col items-center justify-center text-center flex-grow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Value Display */}
            <motion.div className="flex flex-col items-center">
              <div className="flex items-baseline justify-center">
                <motion.span 
                  key={String(value)}
                  initial={animated ? { opacity: 0.5, y: -5 } : { opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight sf-pro-display"
                >
                  {displayValue()}
                </motion.span>
                <span className="ml-1 text-xl text-gray-400 font-normal sf-pro-display">
                  {value !== "none" ? getUnit() : ""}
                </span>
              </div>
              
              {/* Apple Fitness Style Bar Chart */}
              {value !== "none" && (
                <div className="mt-6 w-full space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-8 w-full">
                      <div className="fitness-chart-bar w-full">
                        <motion.div 
                          className="fitness-chart-progress"
                          style={{ 
                            width: type === "soil" 
                              ? `${Math.min(100, Number(value) * 1.5)}%` 
                              : type === "humidity" 
                                ? `${Math.min(100, Number(value))}%` 
                                : type === "temperature" 
                                  ? `${Math.min(100, (Number(value) / 40) * 100)}%`
                                  : "50%",
                            backgroundColor: type === "temperature" 
                              ? "#FF2D55" 
                              : type === "humidity" 
                                ? "#5AC8FA" 
                                : "#30D158" 
                          }}
                          initial={{ width: "0%" }}
                          animate={{ width: value === "none" ? "0%" :
                            type === "soil" 
                              ? `${Math.min(100, Number(value) * 1.5)}%` 
                              : type === "humidity" 
                                ? `${Math.min(100, Number(value))}%` 
                                : type === "temperature" 
                                  ? `${Math.min(100, (Number(value) / 40) * 100)}%`
                                  : "50%"
                          }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
          
          {/* Status Indicator */}
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-gray-500">
              {status}
            </span>
            <span className="text-gray-500">
              {type === "temperature" ? "Max 40°C" : 
               type === "humidity" ? "Max 100%" : 
               "Max 100%"}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
