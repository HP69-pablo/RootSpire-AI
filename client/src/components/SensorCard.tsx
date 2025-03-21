import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

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
  
  return (
    <Card className="bg-white dark:bg-slate-800 shadow-sm p-5 border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{getLabel()}</h3>
          <div className="flex items-baseline">
            <motion.span 
              key={value}
              initial={animated ? { opacity: 0.5 } : { opacity: 1 }}
              animate={{ opacity: 1 }}
              className="text-3xl font-semibold font-mono"
            >
              {type === "temperature" ? value.toFixed(1) : Math.round(value)}
            </motion.span>
            <span className="ml-1 text-lg">{getUnit()}</span>
          </div>
        </div>
        
        {getIcon()}
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center">
            {getChangeIcon()}
            <span className={`text-xs font-medium ${getChange() > 0 ? 'text-success-500' : 'text-warning-500'}`}>
              {getChange() > 0 ? '+' : ''}{getChange().toFixed(type === 'temperature' ? 1 : 0)}{getUnit()}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">from last hour</span>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full ${getStatusClasses()} text-xs font-medium`}>
          {status}
        </div>
      </div>
    </Card>
  );
}
