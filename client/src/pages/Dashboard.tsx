import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { StatusOverview } from '@/components/StatusOverview';
import { AlertBanner } from '@/components/AlertBanner';
import { DataVisualization } from '@/components/DataVisualization';
import { PlantConfig, PlantConfigValues } from '@/components/PlantConfig';
import { NotificationSettings, NotificationSettingsValues } from '@/components/NotificationSettings';
import { PlantControls } from '@/components/PlantControls';
import { PlantCard } from '@/components/PlantCard';
import { SensorCard } from '@/components/SensorCard';
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
import { useAuth } from '@/lib/AuthProvider';
import { UserPlant } from '@/lib/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Leaf, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { toast } = useToast();
  const { profile, refreshProfile } = useAuth();
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
  
  // Selected plant for detailed view
  const [selectedPlant, setSelectedPlant] = useState<UserPlant | null>(null);
  const [showPlantDetails, setShowPlantDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
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
  
  // Demo plants (in a real app, these would come from Firebase via the profile)
  const [userPlants, setUserPlants] = useState<UserPlant[]>([
    {
      id: '1',
      name: 'Peace Lily',
      species: 'Spathiphyllum',
      addedAt: Date.now() - 7776000000, // 90 days ago
      imageUrl: 'https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?q=80&w=200',
      lastWatered: Date.now() - 172800000, // 2 days ago
      notes: 'Needs indirect light and regular watering',
      health: 'good'
    },
    {
      id: '2',
      name: 'Snake Plant',
      species: 'Dracaena trifasciata',
      addedAt: Date.now() - 2592000000, // 30 days ago
      imageUrl: 'https://images.unsplash.com/photo-1646328349278-77de6c1bb16a?q=80&w=200',
      lastWatered: Date.now() - 604800000, // 7 days ago
      notes: 'Very low maintenance, water when soil is completely dry',
      health: 'excellent'
    },
    {
      id: '3',
      name: 'Fiddle Leaf Fig',
      species: 'Ficus lyrata',
      addedAt: Date.now() - 15552000000, // 180 days ago
      lastWatered: Date.now() - 345600000, // 4 days ago
      notes: 'Keep away from drafts, likes bright indirect light',
      health: 'fair'
    }
  ]);

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
  
  // Handle viewing plant details
  const handleViewPlantDetails = (plant: UserPlant) => {
    setSelectedPlant(plant);
    setShowPlantDetails(true);
  };
  
  // Filter plants by search term
  const filteredPlants = userPlants.filter(plant => 
    plant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    plant.species.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
        
        {/* My Plants Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="my-6"
        >
          <div className="flex flex-wrap items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <Leaf className="mr-2 h-5 w-5 text-green-600" />
                My Plants
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Monitor and manage your plants
              </p>
            </div>
            
            <div className="flex gap-2 mt-2 sm:mt-0">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search plants..." 
                  className="pl-8 w-full sm:w-auto min-w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-1" />
                Add Plant
              </Button>
            </div>
          </div>
          
          {filteredPlants.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
              <Leaf className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-1">No plants found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? "Try a different search term" : "Add your first plant to get started"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlants.map(plant => (
                <PlantCard 
                  key={plant.id}
                  plant={plant}
                  onViewDetails={handleViewPlantDetails}
                />
              ))}
            </div>
          )}
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
                    // Open the chat bubble with an emergency message
                    toast({
                      title: "Plant SOS Activated",
                      description: "Use the chat bubble to describe your plant emergency.",
                    });
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
      
      {/* Plant Details Modal */}
      <Dialog open={showPlantDetails} onOpenChange={setShowPlantDetails}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="mr-2">{selectedPlant?.name}</span>
              <Badge className="ml-2">{selectedPlant?.species}</Badge>
            </DialogTitle>
          </DialogHeader>
          
          {selectedPlant && (
            <div className="space-y-4 mt-2">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  {selectedPlant.imageUrl ? (
                    <img 
                      src={selectedPlant.imageUrl} 
                      alt={selectedPlant.name} 
                      className="w-full h-60 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-60 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Leaf className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="mt-4 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Added:</span> {new Date(selectedPlant.addedAt).toLocaleDateString()}
                    </p>
                    {selectedPlant.lastWatered && (
                      <p className="text-sm">
                        <span className="font-medium">Last watered:</span> {new Date(selectedPlant.lastWatered).toLocaleDateString()}
                      </p>
                    )}
                    {selectedPlant.notes && (
                      <div>
                        <span className="font-medium text-sm">Notes:</span>
                        <p className="text-sm mt-1 italic text-gray-600 dark:text-gray-300">
                          "{selectedPlant.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <h3 className="font-medium mb-4">Sensor History</h3>
                  <DataVisualization historyData={historyData} />
                  
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <SensorCard
                      type="temperature"
                      value={sensorData.temperature}
                      status={sensorData.temperature < plantConfig.tempMin ? 'Low' : sensorData.temperature > plantConfig.tempMax ? 'High' : 'Optimal'}
                    />
                    <SensorCard
                      type="humidity"
                      value={sensorData.humidity}
                      status={sensorData.humidity < plantConfig.humidityMin ? 'Low' : sensorData.humidity > plantConfig.humidityMax ? 'High' : 'Optimal'}
                    />
                    <SensorCard
                      type="soil"
                      value={45}
                      status="Optimal"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowPlantDetails(false)}>
                  Close
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  Edit Plant
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
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
