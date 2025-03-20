import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { StatusOverview } from '@/components/StatusOverview';
import { AlertBanner } from '@/components/AlertBanner';
import { DataVisualization } from '@/components/DataVisualization';
import { PlantConfig, PlantConfigValues } from '@/components/PlantConfig';
import { NotificationSettings, NotificationSettingsValues } from '@/components/NotificationSettings';
import { subscribeSensorData, getSensorHistory, SensorData, SensorHistory } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { toast } = useToast();
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 24.5,
    humidity: 38,
    soilMoisture: 22,
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
  
  useEffect(() => {
    // Subscribe to real-time sensor data updates
    const unsubscribeSensor = subscribeSensorData((data) => {
      setSensorData(data);
    });
    
    // Get sensor history data (24h by default)
    const unsubscribeHistory = getSensorHistory(1, (data) => {
      setHistoryData(data);
    });
    
    // Cleanup subscriptions on component unmount
    return () => {
      unsubscribeSensor();
      unsubscribeHistory();
    };
  }, []);
  
  // Check for alerts when sensor data or config changes
  useEffect(() => {
    checkForAlerts();
  }, [sensorData, plantConfig]);
  
  const checkForAlerts = () => {
    // Check soil moisture first (highest priority)
    if (sensorData.soilMoisture < plantConfig.soilMoistureMin * 0.8) {
      setAlert({
        show: true,
        title: 'Critical Soil Moisture Alert',
        message: `Soil moisture has dropped below ${Math.round(plantConfig.soilMoistureMin * 0.8)}%. Your plant needs watering soon.`,
        type: 'critical'
      });
      return;
    }
    
    // Check temperature
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
  
  return (
    <div className="min-h-screen font-sans transition-colors duration-200 ease-in-out bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white">
      <Header />
      
      <main className="container mx-auto p-4">
        {/* Status Overview Section */}
        <StatusOverview sensorData={sensorData} config={plantConfig} />
        
        {/* Alert Banner */}
        {alert.show && (
          <AlertBanner 
            title={alert.title}
            message={alert.message}
            type={alert.type}
          />
        )}
        
        {/* Data Visualization Section */}
        <DataVisualization historyData={historyData} />
        
        {/* Settings & Notifications Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlantConfig onSave={handleSaveConfig} />
          <NotificationSettings onSave={handleSaveNotifications} />
        </div>
      </main>
      
      <footer className="mt-8 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Smart Plant Monitoring System © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
