import { useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlantConfig, PlantConfigValues } from '@/components/PlantConfig';
import { NotificationSettings, NotificationSettingsValues } from '@/components/NotificationSettings';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Moon, Sun, ArrowLeft, CloudUpload, Loader2 } from 'lucide-react';
import { useTheme } from '@/lib/ThemeProvider';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { downloadPlantTypesImages } from '@/lib/firebase';

export default function Settings() {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const [caching, setCaching] = useState(false);
  
  // Handle plant config save
  const handleSaveConfig = (config: PlantConfigValues) => {
    toast({
      title: "Plant configuration saved",
      description: "Your plant settings have been updated successfully"
    });
  };
  
  // Handle notification settings save
  const handleSaveNotifications = (settings: NotificationSettingsValues) => {
    toast({
      title: "Notification settings saved",
      description: "Your notification preferences have been updated"
    });
  };
  
  // Handle caching plant images to Firebase Storage
  const handleCacheImages = async () => {
    try {
      setCaching(true);
      toast({
        title: "Caching plant images",
        description: "Downloading plant images to Firebase Storage for faster loading...",
      });
      
      await downloadPlantTypesImages();
      
      toast({
        title: "Images cached successfully",
        description: "Plant images have been stored in Firebase Storage for faster loading",
      });
    } catch (error) {
      console.error('Error caching plant images:', error);
      toast({
        title: "Caching failed",
        description: "There was a problem caching the plant images. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setCaching(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-sans transition-colors duration-300 ease-out">
      <Header />
      
      <main className="container mx-auto px-4 py-6 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setLocation('/')}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Configure your plant monitoring system
              </p>
            </div>
          </div>
          
          <Tabs defaultValue="appearance">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="plant">Plant Config</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Settings</CardTitle>
                  <CardDescription>
                    Customize the appearance of your plant monitoring system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Theme Mode</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Switch between light and dark mode
                        </p>
                      </div>
                      <Button variant="outline" onClick={toggleTheme}>
                        {theme === 'dark' ? (
                          <>
                            <Sun className="h-4 w-4 mr-2" />
                            Light Mode
                          </>
                        ) : (
                          <>
                            <Moon className="h-4 w-4 mr-2" />
                            Dark Mode
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <h3 className="font-medium">Performance Settings</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Optimize app performance and speed
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Plant Image Caching</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Download plant images to Firebase for faster loading
                        </p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={handleCacheImages}
                        disabled={caching}
                      >
                        {caching ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Caching...
                          </>
                        ) : (
                          <>
                            <CloudUpload className="h-4 w-4 mr-2" />
                            Cache Images
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="plant">
              <PlantConfig onSave={handleSaveConfig} />
            </TabsContent>
            
            <TabsContent value="notifications">
              <NotificationSettings onSave={handleSaveNotifications} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}