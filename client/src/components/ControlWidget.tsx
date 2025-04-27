import React from 'react';
import { motion } from 'framer-motion';
import { Switch } from 'lucide-react';

interface ControlWidgetProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  isActive: boolean;
  onToggle: (active: boolean) => void;
  description: string;
}

export function ControlWidget({
  title,
  icon,
  color,
  isActive,
  onToggle,
  description
}: ControlWidgetProps) {
  return (
    <motion.div 
      className="widget-small apple-widget p-4"
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center mr-2" 
            style={{ backgroundColor: `${color}30`, color: color }}
          >
            {icon}
          </div>
          <h3 className="font-medium text-lg">{title}</h3>
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={isActive}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
        </label>
      </div>

      <div className="text-center my-5">
        <div className={`text-xl font-medium ${isActive ? 'text-green-500' : 'text-gray-400'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-500 border-t pt-3 border-amber-100/40 dark:border-[#2C3038]">
        {description}
      </div>
    </motion.div>
  );
}