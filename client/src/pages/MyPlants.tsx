import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { useAuth } from '@/lib/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { addUserPlant, UserPlant } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Leaf, Plus, Droplet, Calendar, AlertCircle, Check, Loader2, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { uploadPlantPhoto, updatePlantData } from '@/lib/firebase';
import { analyzePlantPhoto, PlantAnalysisResult } from '@/lib/gemini';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MyPlants() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Add plant form state
  const [newPlant, setNewPlant] = useState({
    name: '',
    species: '',
    notes: ''
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      setLocation('/login');
    }
  }, [user, loading, setLocation]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPlant(prev => ({ ...prev, [name]: value }));
  };

  // Handle add plant
  const handleAddPlant = async () => {
    if (!user || !newPlant.name || !newPlant.species) return;
    
    setSaving(true);
    try {
      const plantId = `plant_${Date.now()}`;
      const plant: UserPlant = {
        id: plantId,
        name: newPlant.name,
        species: newPlant.species,
        addedAt: Date.now(),
        notes: newPlant.notes || undefined,
        health: 'good'
      };
      
      const success = await addUserPlant(user.uid, plant);
      
      if (success) {
        await refreshProfile();
        toast({
          title: "Plant added",
          description: `${newPlant.name} has been added to your collection`,
        });
        setNewPlant({ name: '', species: '', notes: '' });
        setShowAddPlant(false);
      } else {
        toast({
          title: "Failed to add plant",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding plant:', error);
      toast({
        title: "Error",
        description: "Failed to add plant",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate days since last watered
  const getDaysSinceWatered = (lastWatered?: number) => {
    if (!lastWatered) return 'Never';
    const days = Math.floor((Date.now() - lastWatered) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : `${days} days ago`;
  };

  // Get health badge color based on plant health
  const getHealthColor = (health?: string) => {
    switch (health) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-green-400';
      case 'fair':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen font-sans transition-colors duration-300 ease-out bg-gradient-to-br from-slate-50 to-white text-slate-900 dark:from-slate-900 dark:to-slate-800 dark:text-white">
        <Header />
        <div className="container mx-auto p-4 flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-green-500" />
            <h3 className="mt-4 text-xl">Loading your plants...</h3>
          </div>
        </div>
      </div>
    );
  }

  const userPlants = profile?.plants ? Object.values(profile.plants) : [];

  return (
    <div className="min-h-screen font-sans transition-colors duration-300 ease-out bg-gradient-to-br from-slate-50 to-white text-slate-900 dark:from-slate-900 dark:to-slate-800 dark:text-white">
      <Header />
      
      <main className="container mx-auto px-4 py-6 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Plants</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Manage your plant collection and monitor their health
              </p>
            </div>
            
            <Dialog open={showAddPlant} onOpenChange={setShowAddPlant}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Plant
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add a new plant</DialogTitle>
                  <DialogDescription>
                    Enter the details of your plant to add it to your collection
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Plant Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="E.g., Living Room Fern"
                      value={newPlant.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="species">Plant Species</Label>
                    <Input
                      id="species"
                      name="species"
                      placeholder="E.g., Boston Fern"
                      value={newPlant.species}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      name="notes"
                      placeholder="Any special care instructions?"
                      value={newPlant.notes}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddPlant(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddPlant}
                    disabled={!newPlant.name || !newPlant.species || saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {saving ? "Saving..." : "Add Plant"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {userPlants.length === 0 ? (
            <Card className="border border-dashed border-gray-300 dark:border-gray-600 bg-transparent">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Leaf className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium mb-2">No plants yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">
                  Add your first plant to start monitoring its health and get personalized care recommendations
                </p>
                <Button
                  onClick={() => setShowAddPlant(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Plant
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userPlants.map((plant) => (
                <motion.div
                  key={plant.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="overflow-hidden border-0 shadow-md bg-white dark:bg-slate-800">
                    <div className="h-3 bg-gradient-to-r from-green-400 to-green-600 dark:from-green-600 dark:to-green-800" />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{plant.name}</CardTitle>
                        <Badge className={getHealthColor(plant.health)}>
                          {plant.health || 'Unknown'}
                        </Badge>
                      </div>
                      <CardDescription>{plant.species}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span>Added {new Date(plant.addedAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <Droplet className="h-4 w-4 mr-2 text-blue-500" />
                          <span>Last watered: {getDaysSinceWatered(plant.lastWatered)}</span>
                        </div>
                        
                        {plant.notes && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md text-sm mt-3">
                            {plant.notes}
                          </div>
                        )}
                        
                        <div className="pt-2 flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-900/20"
                          >
                            <Droplet className="h-3.5 w-3.5 mr-1" />
                            Water
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 dark:text-gray-300"
                          >
                            Check Health
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}