import { useState, useEffect } from "react";
import { AlertBanner } from "@/components/AlertBanner";
import { DataVisualization } from "@/components/DataVisualization";
import { PlantConfig, PlantConfigValues } from "@/components/PlantConfig";
import {
  NotificationSettings,
  NotificationSettingsValues,
} from "@/components/NotificationSettings";
import { DraggableWidgetList, Widget } from "@/components/DraggableWidgetList";
import { WidgetGallery, WidgetTemplate } from "@/components/WidgetGallery";
import { SensorWidget } from "@/components/SensorWidget";
import { ControlWidget } from "@/components/ControlWidget";
import { ActivityRingsWidget } from "@/components/ActivityRingsWidget";
import {
  initializeFirebase,
  subscribeSensorData,
  getSensorHistory,
  subscribePlantControls,
  setUvLight,
  setWateringActive,
  SensorData,
  SensorHistory,
  PlantControls as PlantControlsType,
} from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [historyData, setHistoryData] = useState<SensorHistory>({});
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [plantConfig, setPlantConfig] = useState<PlantConfigValues>({
    plantType: "succulent",
    tempMin: 18,
    tempMax: 26,
    humidityMin: 40,
    humidityMax: 60,
    soilMoistureMin: 30,
    soilMoistureMax: 50,
  });
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettingsValues>({
      enableNotifications: true,
      lowMoistureAlerts: true,
      temperatureAlerts: false,
      humidityAlerts: false,
      email: "",
    });
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    title: string;
    type: "critical" | "warning" | "info";
  }>({
    show: false,
    message: "",
    title: "",
    type: "info",
  });

  // Track plant controls state
  const [plantControls, setPlantControls] = useState<PlantControlsType>({
    uvLight: false,
    wateringActive: false,
  });
  
  // State for draggable widgets
  const [widgets, setWidgets] = useState<Widget[]>([]);
  
  // Widget gallery visibility
  const [isWidgetGalleryOpen, setIsWidgetGalleryOpen] = useState(false);

  // Handle functions first to avoid reference errors
  const handleSaveConfig = (config: PlantConfigValues) => {
    setPlantConfig(config);
    // In a real application, you would save this to Firebase
    toast({
      title: "Configuration saved",
      description: "Your plant configuration has been saved.",
    });
  };

  const handleSaveNotifications = (settings: NotificationSettingsValues) => {
    setNotificationSettings(settings);
    // In a real application, you would save this to Firebase
    toast({
      title: "Notification settings saved",
      description: "Your notification preferences have been updated.",
    });
  };
  
  // Handle plant control actions
  const handlePlantControlAction = (action: string, state: boolean) => {
    console.log(`Plant control action: ${action} = ${state}`);

    if (action === "uvLight") {
      setUvLight(state)
        .then(() => {
          toast({
            title: state ? "UV Light ON" : "UV Light OFF",
            description: state
              ? "Providing supplemental light to your plant."
              : "UV light has been turned off.",
          });
        })
        .catch((error) => {
          console.error("Error setting UV light state:", error);
          toast({
            title: "Control Error",
            description: "Failed to control UV light. Please try again.",
            variant: "destructive",
          });
        });
    } else if (action === "watering") {
      setWateringActive(state)
        .then(() => {
          if (state) {
            toast({
              title: "Watering System Activated",
              description: "Water pump is running.",
            });
          }
        })
        .catch((error) => {
          console.error("Error setting watering state:", error);
          toast({
            title: "Control Error",
            description: "Failed to control watering system. Please try again.",
            variant: "destructive",
          });
        });
    }
  };
  
  // Handle adding a new widget from the gallery
  const handleAddWidget = (widgetTemplate: WidgetTemplate) => {
    let newWidget: Widget;
    
    switch (widgetTemplate.type) {
      case 'temperature-widget':
        newWidget = createTemperatureWidget();
        break;
      case 'humidity-widget':
        newWidget = createHumidityWidget();
        break;
      case 'soil-moisture-widget':
        newWidget = createSoilMoistureWidget();
        break;
      case 'light-widget':
        newWidget = createLightWidget();
        break;
      case 'uv-control-widget':
        newWidget = createUvControlWidget();
        break;
      case 'watering-control-widget':
        newWidget = createWateringControlWidget();
        break;
      case 'environment-history-widget':
        newWidget = createEnvironmentHistoryWidget();
        break;
      case 'activity-rings-widget':
        newWidget = createActivityRingsWidget();
        break;
      default:
        // Default to a template widget if type not recognized
        newWidget = {
          id: `widget-${Date.now()}`,
          type: widgetTemplate.type,
          size: widgetTemplate.size,
          content: (
            <div className="p-4">
              <h3 className="font-medium text-lg mb-3">{widgetTemplate.name}</h3>
              <p>{widgetTemplate.description}</p>
            </div>
          )
        };
    }
    
    // Add the new widget to the list
    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);
    
    // Save updated widget list to localStorage
    saveWidgetsToLocalStorage(updatedWidgets);
    
    toast({
      title: "Widget Added",
      description: `${widgetTemplate.name} widget has been added to your dashboard.`,
    });
  };
  
  // Handle removing a widget
  const handleRemoveWidget = (widgetId: string) => {
    const updatedWidgets = widgets.filter(widget => widget.id !== widgetId);
    setWidgets(updatedWidgets);
    
    // Save updated widget list to localStorage
    saveWidgetsToLocalStorage(updatedWidgets);
    
    toast({
      title: "Widget Removed",
      description: "Widget has been removed from your dashboard.",
    });
  };
  
  // Save widgets configuration to localStorage
  const saveWidgetsToLocalStorage = (widgetsToSave: Widget[]) => {
    const layoutToSave = widgetsToSave.map(widget => ({
      id: widget.id,
      type: widget.type,
      size: widget.size
    }));
    
    localStorage.setItem('dashboardWidgets', JSON.stringify(layoutToSave));
  };
  
  // Widget creation methods
  const createTemperatureWidget = (): Widget => {
    return {
      id: `temperature-${Date.now()}`,
      type: 'temperature-widget',
      size: 'small',
      content: (
        <SensorWidget
          title="Temperature"
          value={sensorData?.temperature || null}
          unit="°C"
          min={plantConfig.tempMin}
          max={plantConfig.tempMax}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
            </svg>
          }
          color="#FF2D55"
          status={
            sensorData?.temperature 
              ? sensorData.temperature > plantConfig.tempMax 
                ? 'High' 
                : sensorData.temperature < plantConfig.tempMin 
                  ? 'Low' 
                  : 'Optimal'
              : 'Optimal'
          }
        />
      )
    };
  };
  
  const createHumidityWidget = (): Widget => {
    return {
      id: `humidity-${Date.now()}`,
      type: 'humidity-widget',
      size: 'small',
      content: (
        <SensorWidget
          title="Humidity"
          value={sensorData?.humidity || null}
          unit="%"
          min={plantConfig.humidityMin}
          max={plantConfig.humidityMax}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
            </svg>
          }
          color="#5AC8FA"
          status={
            sensorData?.humidity 
              ? sensorData.humidity > plantConfig.humidityMax 
                ? 'High' 
                : sensorData.humidity < plantConfig.humidityMin 
                  ? 'Low' 
                  : 'Optimal'
              : 'Optimal'
          }
        />
      )
    };
  };
  
  const createSoilMoistureWidget = (): Widget => {
    return {
      id: `soil-moisture-${Date.now()}`,
      type: 'soil-moisture-widget',
      size: 'small',
      content: (
        <SensorWidget
          title="Soil Moisture"
          value={sensorData?.soilMoisture || null}
          unit="%"
          min={plantConfig.soilMoistureMin}
          max={plantConfig.soilMoistureMax}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 16a4 4 0 0 1-2.65-1"></path>
              <path d="M6 12a4 4 0 0 1 6.33-3.24"></path>
              <path d="M20.8 18.4 16 12l-2 4 1 2"></path>
              <path d="m20.8 18.4.9 1.6H10l5-9 5.8 7.8Z"></path>
              <path d="m8 10 1.735 3.37"></path>
            </svg>
          }
          color="#34C759"
          status={
            sensorData?.soilMoisture 
              ? sensorData.soilMoisture > plantConfig.soilMoistureMax 
                ? 'High' 
                : sensorData.soilMoisture < plantConfig.soilMoistureMin 
                  ? 'Low' 
                  : 'Optimal'
              : 'Optimal'
          }
        />
      )
    };
  };
  
  const createLightWidget = (): Widget => {
    return {
      id: `light-${Date.now()}`,
      type: 'light-widget',
      size: 'small',
      content: (
        <SensorWidget
          title="Light Level"
          value={sensorData?.light || null}
          unit="%"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          }
          color="#FFCC00"
          status={
            sensorData?.light 
              ? sensorData.light > 50 
                ? 'High' 
                : sensorData.light < 10 
                  ? 'Low' 
                  : 'Optimal'
              : 'Optimal'
          }
        />
      )
    };
  };
  
  const createUvControlWidget = (): Widget => {
    return {
      id: `uv-control-${Date.now()}`,
      type: 'uv-control-widget',
      size: 'small',
      content: (
        <ControlWidget
          title="UV Light"
          isActive={plantControls.uvLight}
          onToggle={(state) => handlePlantControlAction('uvLight', state)}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          }
          color="#FFCC00"
          description="Controls supplemental UV lighting for your plant. Use during low natural light periods."
        />
      )
    };
  };
  
  const createWateringControlWidget = (): Widget => {
    return {
      id: `watering-control-${Date.now()}`,
      type: 'watering-control-widget',
      size: 'small',
      content: (
        <ControlWidget
          title="Watering"
          isActive={plantControls.wateringActive}
          onToggle={(state) => handlePlantControlAction('watering', state)}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v6"></path>
              <path d="M5 10c-1.7 1-3 2.9-3 5 0 3.3 2.7 6 6 6 1 0 1.9-.2 2.8-.7"></path>
              <path d="M5 10c1-1.7 2.9-3 5-3 3.3 0 6 2.7 6 6 0 1-.2 1.9-.7 2.8"></path>
              <path d="M20 16.2c1.2.8 2 2.2 2 3.8 0 2.5-2 4.5-4.5 4.5-.9 0-1.8-.3-2.5-.7"></path>
              <path d="M20 16.2c-.8-1.2-2.2-2-3.8-2-2.5 0-4.5 2-4.5 4.5 0 .9.3 1.8.7 2.5"></path>
            </svg>
          }
          color="#5AC8FA"
          description="Controls the automatic watering system. Activates water pump when soil moisture is too low."
        />
      )
    };
  };
  
  const createEnvironmentHistoryWidget = (): Widget => {
    return {
      id: `environment-history-${Date.now()}`,
      type: 'environment-history-widget',
      size: 'large',
      content: (
        <div className="widget-large apple-widget p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-lg">Environment History</h3>
          </div>
          <DataVisualization 
            historyData={historyData} 
            currentData={sensorData ? {
              temperature: sensorData.temperature,
              humidity: sensorData.humidity,
              light: sensorData.light,
              soilMoisture: sensorData.soilMoisture
            } : undefined} 
          />
        </div>
      )
    };
  };
  
  const createActivityRingsWidget = (): Widget => {
    if (!sensorData) {
      return {
        id: `activity-rings-${Date.now()}`,
        type: 'activity-rings-widget',
        size: 'medium',
        content: (
          <div className="widget-medium apple-widget p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-lg">Plant Vitals</h3>
            </div>
            <div className="flex items-center justify-center h-[180px]">
              <p className="text-gray-500">Waiting for sensor data...</p>
            </div>
          </div>
        )
      };
    }
    
    return {
      id: `activity-rings-${Date.now()}`,
      type: 'activity-rings-widget',
      size: 'medium',
      content: (
        <ActivityRingsWidget 
          data={{
            temperature: {
              value: sensorData.temperature,
              min: plantConfig.tempMin,
              max: plantConfig.tempMax
            },
            humidity: {
              value: sensorData.humidity,
              min: plantConfig.humidityMin,
              max: plantConfig.humidityMax
            },
            light: {
              value: sensorData.light || 0,
              min: 10,
              max: 90
            },
            soilMoisture: {
              value: sensorData.soilMoisture || 0,
              min: plantConfig.soilMoistureMin,
              max: plantConfig.soilMoistureMax
            }
          }}
        />
      )
    };
  };
  
  // Handle widget reordering
  const handleWidgetReorder = (reorderedWidgets: Widget[]) => {
    setWidgets(reorderedWidgets);
    
    // Save the widget order to localStorage
    saveWidgetsToLocalStorage(reorderedWidgets);
    
    toast({
      title: "Dashboard Layout Saved",
      description: "Your custom dashboard layout has been saved.",
    });
  };

  useEffect(() => {
    // Make sure Firebase is initialized before subscribing to data
    const isInitialized = initializeFirebase();

    if (isInitialized) {
      // Subscribe to real-time sensor data updates
      const unsubscribeSensor = subscribeSensorData((data) => {
        console.log("Received new sensor data:", data);
        setSensorData(data);
        
        // Update last update time
        const now = new Date();
        const formattedTime = now.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        setLastUpdate(formattedTime);
      });

      // Get sensor history data (24h by default)
      const unsubscribeHistory = getSensorHistory(1, (data) => {
        console.log(
          "Received history data:",
          Object.keys(data).length,
          "entries",
        );
        setHistoryData(data);
      });

      // Subscribe to plant controls
      const unsubscribeControls = subscribePlantControls((controls) => {
        console.log("Received plant controls:", controls);
        setPlantControls(controls);
      });

      // Cleanup subscriptions on component unmount
      return () => {
        unsubscribeSensor();
        unsubscribeHistory();
        unsubscribeControls();
      };
    } else {
      console.error("Firebase could not be initialized");
    }
  }, []);

  // Check for alerts when sensor data or config changes
  useEffect(() => {
    checkForAlerts();
  }, [sensorData, plantConfig]);
  
  // Initialize draggable widgets when sensor data is available
  useEffect(() => {
    if (!sensorData) return;
    
    // Try to load widget configuration from localStorage
    const savedWidgetConfig = localStorage.getItem('dashboardWidgets');
    
    if (savedWidgetConfig) {
      try {
        // Load the saved order/configuration
        const savedOrder = JSON.parse(savedWidgetConfig);
        const restoredWidgets: Widget[] = [];
        
        savedOrder.forEach((item: { id: string, type: string, size?: 'small' | 'medium' | 'large' }) => {
          switch (item.type) {
            case 'temperature-widget':
              restoredWidgets.push(createTemperatureWidget());
              break;
            case 'humidity-widget':
              restoredWidgets.push(createHumidityWidget());
              break; 
            case 'soil-moisture-widget':
              restoredWidgets.push(createSoilMoistureWidget());
              break;
            case 'light-widget':
              restoredWidgets.push(createLightWidget());
              break;
            case 'uv-control-widget':
              restoredWidgets.push(createUvControlWidget());
              break;
            case 'watering-control-widget':
              restoredWidgets.push(createWateringControlWidget());
              break;
            case 'environment-history-widget':
              restoredWidgets.push(createEnvironmentHistoryWidget());
              break;
            case 'activity-rings-widget':
              restoredWidgets.push(createActivityRingsWidget());
              break;
          }
        });
        
        if (restoredWidgets.length > 0) {
          setWidgets(restoredWidgets);
          return;
        }
      } catch (error) {
        console.error('Error restoring dashboard layout:', error);
        // Fall back to default layout
      }
    }
    
    // Default widget layout if no saved configuration
    setWidgets([
      createTemperatureWidget(),
      createHumidityWidget(),
      createSoilMoistureWidget(),
      createLightWidget(),
      createActivityRingsWidget(),
      createUvControlWidget(),
      createWateringControlWidget(),
      createEnvironmentHistoryWidget()
    ]);
  }, [sensorData, historyData, plantConfig, plantControls]);

  const checkForAlerts = () => {
    // If we don't have sensor data yet, no alerts to check
    if (!sensorData) {
      return;
    }

    // Check temperature (highest priority)
    const temp = sensorData.temperature;
    if (temp < plantConfig.tempMin || temp > plantConfig.tempMax) {
      setAlert({
        show: true,
        title: "Temperature Alert",
        message: `Temperature is ${temp < plantConfig.tempMin ? "below" : "above"} the ideal range (${plantConfig.tempMin}°C - ${plantConfig.tempMax}°C).`,
        type: "warning",
      });
      return;
    }

    // Check humidity - humidity is in raw percentage format directly from sensor
    const humidity = sensorData.humidity;
    // If humidity value is unrealistically high (like 330000), normalize it
    const normalizedHumidity = humidity > 100 ? humidity / 1000 : humidity;
    
    if (
      normalizedHumidity < plantConfig.humidityMin ||
      normalizedHumidity > plantConfig.humidityMax
    ) {
      setAlert({
        show: true,
        title: "Humidity Alert",
        message: `Humidity is ${normalizedHumidity < plantConfig.humidityMin ? "below" : "above"} the ideal range (${plantConfig.humidityMin}% - ${plantConfig.humidityMax}%).`,
        type: "warning",
      });
      return;
    }
    
    // Check soil moisture if available
    if (sensorData.soilMoisture !== undefined) {
      const soilMoisture = sensorData.soilMoisture;
      if (
        soilMoisture < plantConfig.soilMoistureMin ||
        soilMoisture > plantConfig.soilMoistureMax
      ) {
        setAlert({
          show: true,
          title: "Soil Moisture Alert",
          message: `Soil moisture is ${soilMoisture < plantConfig.soilMoistureMin ? "below" : "above"} the ideal range (${plantConfig.soilMoistureMin}% - ${plantConfig.soilMoistureMax}%).`,
          type: "warning",
        });
        return;
      }
    }

    // No alerts needed
    setAlert({
      show: false,
      title: "",
      message: "",
      type: "info",
    });
  };

  return (
    <div className="dark fitness-app-bg min-h-screen sf-pro">
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/90 dark:bg-[#0c0f12]/90 border-b border-gray-200/50 dark:border-[#2C3038]/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-2 shadow-lg mr-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                <path d="M12 2L8 6H16L12 2Z"></path>
                <path d="M7 10.5C7 8.01472 9.01472 6 11.5 6C13.9853 6 16 8.01472 16 10.5C16 12.9853 13.9853 15 11.5 15C9.01472 15 7 12.9853 7 10.5Z"></path>
                <path d="M12 22C7.58172 22 4 18.4183 4 14C4 12.9391 4.20252 11.9217 4.57904 11C5.38373 11.2409 6.25953 11.5049 7.20108 11.7399C7.70742 12.7236 8.78721 13.5 10.5 13.5C10.6155 13.5 10.7296 13.4952 10.842 13.486C11.5301 14.4452 12.6542 15 14 15C16.7614 15 19 12.7614 19 10C19 8.76039 18.5252 7.62488 17.748 6.75255C19.4773 8.42702 20.5 10.8574 20.5 13.5C20.5 18.1944 16.6944 22 12 22Z"></path>
              </svg>
            </motion.div>
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
              Plant Care
            </motion.h1>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm text-gray-600 dark:text-gray-400 flex items-center"
          >
            <div className="flex items-center mr-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
              <span>Live</span>
            </div>
            <span>Updated {lastUpdate}</span>
          </motion.div>
        </div>
      </header>

      {/* Widget Add Button */}
      <motion.button
        className="widget-add-button z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsWidgetGalleryOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
      >
        <Plus size={24} />
      </motion.button>

      <main className="container mx-auto px-4 py-6 md:py-8 pb-24">
        {/* Alert Banner */}
        {alert.show && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <div className="apple-widget overflow-hidden p-1">
              <AlertBanner
                title={alert.title}
                message={alert.message}
                type={alert.type}
              />
            </div>
          </motion.div>
        )}

        {/* Draggable Widget Grid */}
        <div className="widget-grid">
          {widgets.length > 0 ? (
            <DraggableWidgetList
              widgets={widgets}
              onReorder={handleWidgetReorder}
              className="space-y-6"
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center min-h-[400px] col-span-full"
            >
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400">
                  <rect width="8" height="8" x="3" y="3" rx="2"/>
                  <rect width="8" height="8" x="13" y="3" rx="2"/>
                  <rect width="8" height="8" x="3" y="13" rx="2"/>
                  <rect width="8" height="8" x="13" y="13" rx="2"/>
                </svg>
                <h3 className="text-xl font-semibold mb-2">Loading Widgets...</h3>
                <p className="text-gray-500">Please wait while we fetch your plant data.</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Widget Gallery Modal */}
        <WidgetGallery
          isOpen={isWidgetGalleryOpen}
          onClose={() => setIsWidgetGalleryOpen(false)}
          onSelectWidget={handleAddWidget}
        />
      </main>
    </div>
  );
}