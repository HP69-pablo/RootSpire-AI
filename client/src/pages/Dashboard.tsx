import { useState, useEffect } from "react";
import { AlertBanner } from "@/components/AlertBanner";
import { DataVisualization } from "@/components/DataVisualization";
import { PlantConfig, PlantConfigValues } from "@/components/PlantConfig";
import {
  NotificationSettings,
  NotificationSettingsValues,
} from "@/components/NotificationSettings";
import { PlantControls } from "@/components/PlantControls";
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

  return (
    <div className="dark fitness-app-bg min-h-screen sf-pro">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/90 dark:bg-[#0c0f12]/90 border-b border-gray-200/50 dark:border-[#2C3038]/30">
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
            <div className="fitness-metric-card overflow-hidden p-1">
              <AlertBanner
                title={alert.title}
                message={alert.message}
                type={alert.type}
              />
            </div>
          </motion.div>
        )}

        {/* Current Plant Status Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <div className="fitness-metric-card p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Plant Status</h2>
              <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm text-gray-800 dark:text-gray-200">
                {sensorData ? new Date(sensorData.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Temperature */}
              <motion.div 
                className="sensor-stat group"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1
                  ${sensorData?.temperature && sensorData.temperature > plantConfig.tempMax 
                    ? 'bg-red-500/30 text-red-500' 
                    : sensorData?.temperature && sensorData.temperature < plantConfig.tempMin 
                      ? 'bg-blue-500/30 text-blue-500' 
                      : 'bg-green-500/30 text-green-500'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
                  </svg>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {sensorData ? `${sensorData.temperature.toFixed(1)}°` : '--°'}
                </div>
                <div className="text-xs text-gray-400">Temperature</div>
                <div className={`mt-1 text-xs px-2 py-0.5 rounded-full 
                  ${sensorData?.temperature && sensorData.temperature > plantConfig.tempMax 
                    ? 'bg-red-500/20 text-red-500' 
                    : sensorData?.temperature && sensorData.temperature < plantConfig.tempMin 
                      ? 'bg-blue-500/20 text-blue-500' 
                      : 'bg-green-500/20 text-green-500'}`}
                >
                  {sensorData?.temperature && sensorData.temperature > plantConfig.tempMax 
                    ? 'Too Hot' 
                    : sensorData?.temperature && sensorData.temperature < plantConfig.tempMin 
                      ? 'Too Cold' 
                      : 'Optimal'}
                </div>
              </motion.div>
              
              {/* Humidity */}
              <motion.div 
                className="sensor-stat group"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1
                  ${sensorData?.humidity && 
                    (sensorData.humidity > 100 ? sensorData.humidity / 1000 : sensorData.humidity) > plantConfig.humidityMax 
                    ? 'bg-blue-500/30 text-blue-500' 
                    : sensorData?.humidity && 
                      (sensorData.humidity > 100 ? sensorData.humidity / 1000 : sensorData.humidity) < plantConfig.humidityMin 
                      ? 'bg-yellow-500/30 text-yellow-500' 
                      : 'bg-green-500/30 text-green-500'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                  </svg>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {sensorData ? `${(sensorData.humidity > 100 ? sensorData.humidity / 1000 : sensorData.humidity).toFixed(0)}%` : '--%'}
                </div>
                <div className="text-xs text-gray-400">Humidity</div>
                <div className={`mt-1 text-xs px-2 py-0.5 rounded-full 
                  ${sensorData?.humidity && 
                    (sensorData.humidity > 100 ? sensorData.humidity / 1000 : sensorData.humidity) > plantConfig.humidityMax 
                    ? 'bg-blue-500/20 text-blue-500' 
                    : sensorData?.humidity && 
                      (sensorData.humidity > 100 ? sensorData.humidity / 1000 : sensorData.humidity) < plantConfig.humidityMin 
                      ? 'bg-yellow-500/20 text-yellow-500' 
                      : 'bg-green-500/20 text-green-500'}`}
                >
                  {sensorData?.humidity && 
                    (sensorData.humidity > 100 ? sensorData.humidity / 1000 : sensorData.humidity) > plantConfig.humidityMax 
                    ? 'Too Moist' 
                    : sensorData?.humidity && 
                      (sensorData.humidity > 100 ? sensorData.humidity / 1000 : sensorData.humidity) < plantConfig.humidityMin 
                      ? 'Too Dry' 
                      : 'Optimal'}
                </div>
              </motion.div>
              
              {/* Light */}
              <motion.div 
                className="sensor-stat group"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1
                  ${sensorData?.light && sensorData.light > 50 
                    ? 'bg-yellow-500/30 text-yellow-500' 
                    : sensorData?.light && sensorData.light < 20 
                      ? 'bg-blue-500/30 text-blue-500' 
                      : 'bg-green-500/30 text-green-500'}`}
                >
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
                </div>
                <div className="text-2xl font-bold mt-2">
                  {sensorData?.light ? `${sensorData.light}%` : '--%'}
                </div>
                <div className="text-xs text-gray-400">Light</div>
                <div className={`mt-1 text-xs px-2 py-0.5 rounded-full 
                  ${sensorData?.light && sensorData.light > 50 
                    ? 'bg-yellow-500/20 text-yellow-500' 
                    : sensorData?.light && sensorData.light < 20
                      ? 'bg-blue-500/20 text-blue-500' 
                      : 'bg-green-500/20 text-green-500'}`}
                >
                  {sensorData?.light && sensorData.light > 50 
                    ? 'Bright' 
                    : sensorData?.light && sensorData.light < 20
                      ? 'Too Dark' 
                      : 'Good'}
                </div>
              </motion.div>
              
              {/* Soil Moisture */}
              <motion.div 
                className="sensor-stat group"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1
                  ${sensorData?.soilMoisture && sensorData.soilMoisture > plantConfig.soilMoistureMax 
                    ? 'bg-blue-500/30 text-blue-500' 
                    : sensorData?.soilMoisture && sensorData.soilMoisture < plantConfig.soilMoistureMin 
                      ? 'bg-yellow-500/30 text-yellow-500' 
                      : 'bg-green-500/30 text-green-500'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 16a4 4 0 0 1-4-4 7 7 0 0 1 7-7 8 8 0 0 0 5 2v-2a10 10 0 0 1-5-1.27A10 10 0 0 0 4 6a10 10 0 0 0 11 10c2 0 4-.5 5.5-1.5"></path>
                    <path d="M22 16a5 5 0 0 0-5-5 3 3 0 0 0-3 3c0 1.1.6 2 1.5 2.5"></path>
                  </svg>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {sensorData?.soilMoisture ? `${sensorData.soilMoisture}%` : '--%'}
                </div>
                <div className="text-xs text-gray-400">Soil Moisture</div>
                <div className={`mt-1 text-xs px-2 py-0.5 rounded-full 
                  ${sensorData?.soilMoisture && sensorData.soilMoisture > plantConfig.soilMoistureMax 
                    ? 'bg-blue-500/20 text-blue-500' 
                    : sensorData?.soilMoisture && sensorData.soilMoisture < plantConfig.soilMoistureMin 
                      ? 'bg-yellow-500/20 text-yellow-500' 
                      : 'bg-green-500/20 text-green-500'}`}
                >
                  {sensorData?.soilMoisture && sensorData.soilMoisture > plantConfig.soilMoistureMax 
                    ? 'Too Wet' 
                    : sensorData?.soilMoisture && sensorData.soilMoisture < plantConfig.soilMoistureMin 
                      ? 'Too Dry' 
                      : 'Optimal'}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Plant Controls Widget */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
          <motion.div
            className="md:col-span-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="fitness-metric-card h-full p-6">
              <h2 className="text-xl font-semibold tracking-tight mb-4 flex items-center text-gray-900 dark:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-green-500">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                Controls
              </h2>
              
              <PlantControls
                onAction={handlePlantControlAction}
                sensorData={sensorData}
              />
            </div>
          </motion.div>
          
          {/* Data Visualization Widget */}
          <motion.div
            className="md:col-span-7"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="fitness-metric-card h-full p-6 bg-amber-50/40 dark:bg-[#151918]/70">
              <h2 className="text-xl font-semibold tracking-tight mb-4 flex items-center text-gray-900 dark:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                Data Trends
              </h2>
              
              <DataVisualization
                historyData={historyData}
                currentData={
                  sensorData
                    ? {
                        temperature: sensorData.temperature,
                        // Normalize humidity value if it's too large (like 330000)
                        humidity: sensorData.humidity > 100 ? sensorData.humidity / 1000 : sensorData.humidity,
                        light: sensorData.light,
                        soilMoisture: sensorData.soilMoisture,
                      }
                    : undefined
                }
              />
            </div>
          </motion.div>
        </div>
        
        {/* Bottom Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plant SOS Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="fitness-metric-card p-6 bg-gradient-to-br from-amber-50/50 to-red-50/40 dark:from-red-900/30 dark:to-red-950/80">
              <h2 className="text-xl font-semibold tracking-tight mb-3 flex items-center text-gray-900 dark:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-red-500">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Plant Emergency SOS
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Is your plant showing signs of distress? Get instant AI-powered
                advice to help diagnose and treat common plant issues.
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-full flex items-center justify-center touch-button"
                onClick={() => {
                  toast({
                    title: "Plant SOS Activated",
                    description:
                      "Taking you to the Plant Chat for emergency assistance.",
                  });
                  // In a real implementation, this would take the user to the chat with a pre-filled emergency message
                  window.location.href = "/chat";
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                SOS: Get Help Now
              </motion.button>
            </div>
          </motion.div>
          
          {/* Plant Gallery Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="fitness-metric-card p-6 bg-gradient-to-br from-amber-50/50 to-green-50/40 dark:from-green-900/30 dark:to-emerald-950/80">
              <h2 className="text-xl font-semibold tracking-tight mb-3 flex items-center text-gray-900 dark:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                My Plant Gallery
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Track your plants' growth progress with photos and see how they've changed over time.
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-full flex items-center justify-center touch-button"
                onClick={() => {
                  toast({
                    title: "Plant Gallery",
                    description: "Taking you to your plant collection.",
                  });
                  // In a real implementation, this would take the user to the My Plants page
                  window.location.href = "/plants";
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                View My Plants
              </motion.button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer Removed */}
    </div>
  );
}
