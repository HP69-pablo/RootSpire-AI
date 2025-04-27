import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  size: 'small' | 'medium' | 'large';
  icon: JSX.Element;
  category: 'sensor' | 'control' | 'analytics' | 'plant-care';
}

interface WidgetGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWidget: (widget: WidgetTemplate) => void;
}

export function WidgetGallery({
  isOpen,
  onClose,
  onSelectWidget
}: WidgetGalleryProps) {
  const widgetTemplates: WidgetTemplate[] = [
    {
      id: 'temperature',
      name: 'Temperature',
      description: 'Shows current temperature with historical data',
      type: 'temperature-widget',
      size: 'small',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
        </svg>
      ),
      category: 'sensor'
    },
    {
      id: 'humidity',
      name: 'Humidity',
      description: 'Shows current humidity with target range',
      type: 'humidity-widget',
      size: 'small',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
        </svg>
      ),
      category: 'sensor'
    },
    {
      id: 'soil-moisture',
      name: 'Soil Moisture',
      description: 'Shows current soil moisture with status',
      type: 'soil-moisture-widget',
      size: 'small',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 16a4 4 0 0 1-2.65-1"></path>
          <path d="M6 12a4 4 0 0 1 6.33-3.24"></path>
          <path d="M20.8 18.4 16 12l-2 4 1 2"></path>
          <path d="m20.8 18.4.9 1.6H10l5-9 5.8 7.8Z"></path>
          <path d="m8 10 1.735 3.37"></path>
        </svg>
      ),
      category: 'sensor'
    },
    {
      id: 'light-level',
      name: 'Light Level',
      description: 'Shows current light level with daily pattern',
      type: 'light-widget',
      size: 'small',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      ),
      category: 'sensor'
    },
    {
      id: 'uv-control',
      name: 'UV Light Control',
      description: 'Control UV light with scheduling',
      type: 'uv-control-widget',
      size: 'small',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v8"></path>
          <path d="m4.93 10.93 1.41 1.41"></path>
          <path d="M2 18h2"></path>
          <path d="M20 18h2"></path>
          <path d="m19.07 10.93-1.41 1.41"></path>
          <path d="M22 22H2"></path>
          <path d="m16 6-4 4-4-4"></path>
          <path d="M16 18a4 4 0 0 0-8 0"></path>
        </svg>
      ),
      category: 'control'
    },
    {
      id: 'watering-control',
      name: 'Watering Control',
      description: 'Control watering system with scheduling',
      type: 'watering-control-widget',
      size: 'small',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 17a5 5 0 0 1 0-10h8a5 5 0 0 1 0 10"></path>
          <path d="M8 7h8"></path>
          <path d="M8 17h8"></path>
          <path d="M12 7v10"></path>
        </svg>
      ),
      category: 'control'
    },
    {
      id: 'environment-history',
      name: 'Environmental History',
      description: 'Shows historical data with trends',
      type: 'environment-history-widget',
      size: 'large',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18"></path>
          <path d="m19 9-5 5-4-4-3 3"></path>
        </svg>
      ),
      category: 'analytics'
    },
    {
      id: 'activity-rings',
      name: 'Activity Rings',
      description: 'Shows plant health metrics in fitness-style rings',
      type: 'activity-rings-widget',
      size: 'medium',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="6"></circle>
          <circle cx="12" cy="12" r="2"></circle>
        </svg>
      ),
      category: 'analytics'
    },
    {
      id: 'water-schedule',
      name: 'Watering Schedule',
      description: 'View and adjust watering schedules',
      type: 'water-schedule-widget',
      size: 'medium',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
          <path d="M8 14h.01"></path>
          <path d="M12 14h.01"></path>
          <path d="M16 14h.01"></path>
          <path d="M8 18h.01"></path>
          <path d="M12 18h.01"></path>
          <path d="M16 18h.01"></path>
        </svg>
      ),
      category: 'plant-care'
    },
    {
      id: 'health-status',
      name: 'Plant Health',
      description: 'Shows overall plant health status',
      type: 'health-status-widget',
      size: 'medium',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22c6-3 10-7.5 10-13 0-2.5-2-4.5-4.5-4.5-1.8 0-3.4 1-4.4 2.5h-.2C11.9 5.5 10.3 4.5 8.5 4.5 6 4.5 4 6.5 4 9c0 5.5 4 10 8 13z"></path>
          <path d="M12 22V9"></path>
        </svg>
      ),
      category: 'plant-care'
    }
  ];

  // Filter by category state
  const [activeCategory, setActiveCategory] = React.useState<string>('all');

  const filteredWidgets = activeCategory === 'all' 
    ? widgetTemplates 
    : widgetTemplates.filter(widget => widget.category === activeCategory);

  if (!isOpen) return null;

  return (
    <motion.div 
      className="widget-gallery"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="widget-gallery-container"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        <div className="widget-gallery-header">
          <h2 className="text-xl font-semibold">Add Widget</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pt-4">
          <div className="flex gap-2 pb-4 border-b border-amber-100/40 dark:border-[#2C3038] overflow-x-auto">
            <button 
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${activeCategory === 'all' 
                  ? 'bg-green-500 text-white'
                  : 'bg-[#F5F2EA]/50 dark:bg-[#2C2C2E] text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3C3C3E]'
                }
              `}
            >
              All
            </button>
            <button 
              onClick={() => setActiveCategory('sensor')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${activeCategory === 'sensor' 
                  ? 'bg-green-500 text-white'
                  : 'bg-[#F5F2EA]/50 dark:bg-[#2C2C2E] text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3C3C3E]'
                }
              `}
            >
              Sensors
            </button>
            <button 
              onClick={() => setActiveCategory('control')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${activeCategory === 'control' 
                  ? 'bg-green-500 text-white'
                  : 'bg-[#F5F2EA]/50 dark:bg-[#2C2C2E] text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3C3C3E]'
                }
              `}
            >
              Controls
            </button>
            <button 
              onClick={() => setActiveCategory('analytics')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${activeCategory === 'analytics' 
                  ? 'bg-green-500 text-white'
                  : 'bg-[#F5F2EA]/50 dark:bg-[#2C2C2E] text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3C3C3E]'
                }
              `}
            >
              Analytics
            </button>
            <button 
              onClick={() => setActiveCategory('plant-care')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${activeCategory === 'plant-care' 
                  ? 'bg-green-500 text-white'
                  : 'bg-[#F5F2EA]/50 dark:bg-[#2C2C2E] text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3C3C3E]'
                }
              `}
            >
              Plant Care
            </button>
          </div>
        </div>

        <div className="widget-gallery-grid">
          {filteredWidgets.map(widget => (
            <motion.div
              key={widget.id}
              className={`apple-widget p-4 cursor-pointer hover:shadow-md border-2 border-transparent hover:border-green-500 transition-all duration-200`}
              whileHover={{ y: -5 }}
              onClick={() => {
                onSelectWidget(widget);
                onClose();
              }}
            >
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mr-3">
                  {widget.icon}
                </div>
                <div>
                  <h3 className="font-medium">{widget.name}</h3>
                  <div className={`text-xs ${widget.size === 'small' ? 'bg-blue-500/20 text-blue-500' : widget.size === 'medium' ? 'bg-amber-500/20 text-amber-500' : 'bg-purple-500/20 text-purple-500'} px-2 py-0.5 rounded-full inline-block mt-1`}>
                    {widget.size === 'small' ? 'Small' : widget.size === 'medium' ? 'Medium' : 'Large'}
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {widget.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}