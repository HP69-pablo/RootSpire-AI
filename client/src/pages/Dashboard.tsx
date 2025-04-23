import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { AlertBanner } from '@/components/AlertBanner';
import { DataVisualization } from '@/components/DataVisualization';
import { PlantConfig, PlantConfigValues } from '@/components/PlantConfig';
import { NotificationSettings, NotificationSettingsValues } from '@/components/NotificationSettings';
import { PlantControls } from '@/components/PlantControls';
import { 
  initializeFirebase, 
  subscribeSensorData, 
  getSensorHistory, 
  subscribePlantControls,
  setUvLight,
  setWateringActive,
  SensorData, 
  SensorHistory,
  PlantControls as PlantControlsType
} from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { toast } = useToast();
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 24.5,
    humidity: 38,
    timestamp: Date.now()
  });
  const [historyData, setHistoryData] = useState<SensorHistory>({});
  const [plantConfig, setPlantConfig] = useState<PlantConfigValues>({
    plantType: 'succulent',
    tempMin: 18,
    tempMax: 26,
    humidityMin: 40,
    humidityMax: 60,
    soilMoistureMin: 30,
    soilMoistureMax: 50
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsValues>({
    enableNotifications: true,
    lowMoistureAlerts: true,
    temperatureAlerts: false,
    humidityAlerts: false,
    email: ''
  });
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    title: string;
    type: 'critical' | 'warning' | 'info';
  }>({
    show: false,
    message: '',
    title: '',
    type: 'info'
  });
  
  // Track plant controls state 
  const [plantControls, setPlantControls] = useState<PlantControlsType>({
    uvLight: false,
    wateringActive: false
  });

  useEffect(() => {
    // Make sure Firebase is initialized before subscribing to data
    const isInitialized = initializeFirebase();
    
    if (isInitialized) {
      // Subscribe to real-time sensor data updates
      const unsubscribeSensor = subscribeSensorData((data) => {
        console.log("Received new sensor data:", data);
        setSensorData(data);
      });
      
      // Get sensor history data (24h by default)
      const unsubscribeHistory = getSensorHistory(1, (data) => {
        console.log("Received history data:", Object.keys(data).length, "entries");
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
    // Check temperature (highest priority)
    if (sensorData.temperature < plantConfig.tempMin || sensorData.temperature > plantConfig.tempMax) {
      setAlert({
        show: true,
        title: 'Temperature Alert',
        message: `Temperature is ${sensorData.temperature < plantConfig.tempMin ? 'below' : 'above'} the ideal range (${plantConfig.tempMin}°C - ${plantConfig.tempMax}°C).`,
        type: 'warning'
      });
      return;
    }
    
    // Check humidity
    if (sensorData.humidity < plantConfig.humidityMin || sensorData.humidity > plantConfig.humidityMax) {
      setAlert({
        show: true,
        title: 'Humidity Alert',
        message: `Humidity is ${sensorData.humidity < plantConfig.humidityMin ? 'below' : 'above'} the ideal range (${plantConfig.humidityMin}% - ${plantConfig.humidityMax}%).`,
        type: 'warning'
      });
      return;
    }
    
    // No alerts needed
    setAlert({
      show: false,
      title: '',
      message: '',
      type: 'info'
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
    
    if (action === 'uvLight') {
      setUvLight(state)
        .then(() => {
          toast({
            title: state ? "UV Light ON" : "UV Light OFF",
            description: state 
              ? "Providing supplemental light to your plant." 
              : "UV light has been turned off.",
          });
        })
        .catch(error => {
          console.error("Error setting UV light state:", error);
          toast({
            title: "Control Error",
            description: "Failed to control UV light. Please try again.",
            variant: "destructive"
          });
        });
    } 
    else if (action === 'watering') {
      setWateringActive(state)
        .then(() => {
          if (state) {
            toast({
              title: "Watering System Activated",
              description: "Water pump is running.",
            });
          }
        })
        .catch(error => {
          console.error("Error setting watering state:", error);
          toast({
            title: "Control Error",
            description: "Failed to control watering system. Please try again.",
            variant: "destructive"
          });
        });
    }
  };
  
  return (
    <div className="min-h-screen font-sans transition-colors duration-300 ease-out bg-gradient-to-br from-slate-50 to-white text-slate-900 dark:from-slate-900 dark:to-slate-800 dark:text-white overflow-hidden">
      <Header />
      
      <main className="container mx-auto px-4 py-6 md:py-10">
        {/* Alert Banner */}
        {alert.show && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="my-4"
          >
            <AlertBanner 
              title={alert.title}
              message={alert.message}
              type={alert.type}
            />
          </motion.div>
        )}
        
        {/* Data Visualization Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="my-8"
        >
          <DataVisualization historyData={historyData} />
        </motion.div>
        
        {/* Plant Controls Section */}
        <motion.div 
          className="my-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <PlantControls 
            onAction={handlePlantControlAction}
            sensorData={sensorData}
          />
        </motion.div>
        
        {/* Plant Emergency SOS Button */}
        <motion.div 
          className="my-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <span className="text-red-500 mr-2">●</span> 
                Plant Emergency SOS
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Is your plant showing signs of distress? Get instant AI-powered advice to help diagnose and treat common plant issues.
              </p>
              
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-8 rounded-full shadow-md flex items-center justify-center"
                  onClick={() => {
                    toast({
                      title: "Plant SOS Activated",
                      description: "Taking you to the Plant Chat for emergency assistance.",
                    });
                    // In a real implementation, this would take the user to the chat with a pre-filled emergency message
                    window.location.href = '/chat';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  SOS: Get Help Now
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
      
      <footer className="mt-12 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Smart Plant Monitoring System © {new Date().getFullYear()}
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
