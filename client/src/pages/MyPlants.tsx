import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { useAuth } from '@/lib/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { addUserPlant, UserPlant } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Leaf, Plus, Droplet, Calendar, AlertCircle, Check, Loader2, Camera, Upload, Image as ImageIcon, X, Trash2 } from 'lucide-react';
import { uploadPlantPhoto, updatePlantData, subscribeSensorData, SensorData } from '@/lib/firebase';
import { getDatabase, ref, set } from 'firebase/database';
import { analyzePlantPhoto, PlantAnalysisResult, fetchPlantImage } from '@/lib/gemini';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlantTypeSelector } from '@/components/PlantTypeSelector';
import { PlantTypeInfo } from '@/lib/plantDatabase';

export default function MyPlants() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [showPlantTypeSelector, setShowPlantTypeSelector] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [plantDetailsOpen, setPlantDetailsOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<UserPlant | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PlantAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newPlantPhotoRef = useRef<HTMLInputElement>(null);
  
  // Add plant form state
  const [newPlant, setNewPlant] = useState({
    name: '',
    species: '',
    notes: ''
  });
  
  // New plant photo state
  const [newPlantPhoto, setNewPlantPhoto] = useState<File | null>(null);
  const [newPlantPhotoPreview, setNewPlantPhotoPreview] = useState<string | null>(null);
  const [newPlantAnalysisResult, setNewPlantAnalysisResult] = useState<PlantAnalysisResult | null>(null);
  const [analyzingNewPlantPhoto, setAnalyzingNewPlantPhoto] = useState(false);
  const [fetchingPlantImage, setFetchingPlantImage] = useState(false);
  const [autoPlantImageUrl, setAutoPlantImageUrl] = useState<string | null>(null);
  
  // Selected plant type from selector
  const [selectedPlantType, setSelectedPlantType] = useState<PlantTypeInfo | null>(null);
  const [speciesReferenceImages, setSpeciesReferenceImages] = useState<Record<string, string>>({});
  
  // Sensor data from Firebase
  const [sensorData, setSensorData] = useState<SensorData | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      setLocation('/login');
    }
  }, [user, loading, setLocation]);
  
  // Subscribe to sensor data from Firebase
  useEffect(() => {
    const unsubscribe = subscribeSensorData((data) => {
      setSensorData(data);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Load reference images for plants when profile is loaded
  useEffect(() => {
    if (profile?.plants && typeof profile.plants === 'object') {
      const loadSpeciesImages = async () => {
        // Create array of unique species names from profile.plants (which is an object of plants)
        const uniqueSpecies: string[] = [];
        
        // Safe access to plants with a separate if check to satisfy TypeScript
        const plantsObj = profile.plants;
        if (plantsObj) {
          const plantsList = Object.values(plantsObj);
          plantsList.forEach((plant: UserPlant) => {
            if (plant.species && !uniqueSpecies.includes(plant.species)) {
              uniqueSpecies.push(plant.species);
            }
          });
        }
        
        const newReferenceImages: Record<string, string> = {};
        
        for (const species of uniqueSpecies) {
          if (!speciesReferenceImages[species]) {
            try {
              const imageUrl = await fetchPlantImage(species);
              if (imageUrl) {
                newReferenceImages[species] = imageUrl;
              }
            } catch (error) {
              console.warn(`Could not fetch image for ${species}:`, error);
            }
          }
        }
        
        if (Object.keys(newReferenceImages).length > 0) {
          setSpeciesReferenceImages(prev => ({
            ...prev,
            ...newReferenceImages
          }));
        }
      };
      
      loadSpeciesImages();
    }
  }, [profile?.plants]);
  
  // Open plant details dialog
  const openPlantDetails = (plant: UserPlant) => {
    setSelectedPlant(plant);
    setPlantDetailsOpen(true);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPlant(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle plant type selection
  const handlePlantTypeSelect = (plantType: PlantTypeInfo) => {
    setSelectedPlantType(plantType);
    setNewPlant(prev => ({
      ...prev,
      species: `${plantType.name} (${plantType.scientificName})`,
      notes: prev.notes ? prev.notes : `Care instructions:\n- Light: ${plantType.light} light\n- Water: ${plantType.water} water needs\n- Temperature: ${plantType.tempMin}°C to ${plantType.tempMax}°C\n- Humidity: ${plantType.humidityMin}% to ${plantType.humidityMax}%\n\n${plantType.description}`
    }));
    
    // Set auto plant image URL if available from plant type
    if (plantType.imageUrl) {
      setAutoPlantImageUrl(plantType.imageUrl);
    }
    
    setShowPlantTypeSelector(false);
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
      
      // First add the plant to the database
      const success = await addUserPlant(user.uid, plant);
      
      if (success) {
        // If we have a user-provided photo, upload it
        if (newPlantPhoto) {
          try {
            const downloadUrl = await uploadPlantPhoto(user.uid, plantId, newPlantPhoto);
            
            // Update the plant with the image URL
            await updatePlantData(user.uid, plantId, {
              imageUrl: downloadUrl
            });
          } catch (uploadError) {
            console.error('Error uploading plant photo:', uploadError);
            // We don't fail the whole operation if just the photo upload fails
            toast({
              title: "Photo upload failed",
              description: "Your plant was added, but we couldn't upload the photo.",
              variant: "destructive"
            });
          }
        } 
        // If we have an auto-generated image from the API, use that
        else if (autoPlantImageUrl) {
          try {
            // Update the plant with the auto-fetched image URL
            await updatePlantData(user.uid, plantId, {
              imageUrl: autoPlantImageUrl
            });
          } catch (updateError) {
            console.error('Error setting auto image URL:', updateError);
            // We don't fail the operation if just the image setting fails
          }
        }
        
        await refreshProfile();
        toast({
          title: "Plant added",
          description: `${newPlant.name} has been added to your collection`,
        });
        
        // Reset everything
        setNewPlant({ name: '', species: '', notes: '' });
        setNewPlantPhoto(null);
        setNewPlantPhotoPreview(null);
        setNewPlantAnalysisResult(null);
        setAutoPlantImageUrl(null);
        setSelectedPlantType(null);
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
  
  // Open the photo upload dialog for a specific plant
  const openPhotoDialog = (plant: UserPlant) => {
    setSelectedPlant(plant);
    setPhotoPreview(null);
    setPhotoFile(null);
    setAnalysisResult(null);
    setPhotoDialogOpen(true);
  };
  
  // Handle photo file selection
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setPhotoFile(file);
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    
    // Check if this was a direct capture/upload from the plant card
    // If we have a selectedPlant, we should automatically process the photo
    if (selectedPlant && !photoDialogOpen) {
      try {
        setUploadingPhoto(true);
        
        // Show a toast to indicate the upload is in progress
        toast({
          title: "Uploading photo",
          description: "Please wait while we upload and analyze your plant photo...",
        });
        
        // Upload the photo to Firebase Storage
        const downloadUrl = await uploadPlantPhoto(user?.uid as string, selectedPlant.id, file);
        
        // Update the plant data with the image URL
        await updatePlantData(user?.uid as string, selectedPlant.id, {
          imageUrl: downloadUrl
        });
        
        // Now analyze the photo with Gemini
        setAnalyzingPhoto(true);
        
        // Convert the file to a base64 data URL for Gemini API
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          try {
            if (typeof reader.result === 'string') {
              const analysis = await analyzePlantPhoto(reader.result);
              
              // If the confidence is medium or high, update the plant species
              if (analysis.confidence !== 'low') {
                await updatePlantData(user?.uid as string, selectedPlant.id, {
                  species: analysis.species,
                  notes: selectedPlant.notes 
                    ? `${selectedPlant.notes}\n\nAI Analysis: ${analysis.careInstructions}`
                    : `AI Analysis: ${analysis.careInstructions}`,
                  health: analysis.healthAssessment.toLowerCase().includes('good') 
                    ? 'good' 
                    : analysis.healthAssessment.toLowerCase().includes('excellent') 
                      ? 'excellent'
                      : analysis.healthAssessment.toLowerCase().includes('poor')
                        ? 'poor'
                        : 'fair'
                });
                
                toast({
                  title: "Plant identified",
                  description: `Your plant was identified as ${analysis.commonName} (${analysis.species})`,
                });
              } else {
                toast({
                  title: "Plant analyzed",
                  description: "We uploaded your photo but couldn't identify the plant with high confidence.",
                });
              }
              
              // Refresh the profile to show updated data
              await refreshProfile();
            }
          } catch (error) {
            console.error('Error analyzing plant photo:', error);
            toast({
              title: "Analysis failed",
              description: "We uploaded your photo but couldn't analyze it. You can try again later.",
              variant: "destructive"
            });
          } finally {
            setAnalyzingPhoto(false);
            
            // Reset file input so user can select the same file again if needed
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        };
        
        reader.onerror = () => {
          toast({
            title: "Error",
            description: "Failed to process the image for analysis",
            variant: "destructive"
          });
          setAnalyzingPhoto(false);
        };
        
      } catch (error) {
        console.error('Error uploading plant photo:', error);
        toast({
          title: "Upload failed",
          description: "Failed to upload your plant photo. Please try again.",
          variant: "destructive"
        });
      } finally {
        setUploadingPhoto(false);
      }
    }
  };
  
  // Handle new plant photo selection during add plant flow
  const handleNewPlantPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setNewPlantPhoto(file);
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setNewPlantPhotoPreview(previewUrl);
    
    // Analyze the photo to identify the plant
    setAnalyzingNewPlantPhoto(true);
    
    try {
      // Convert the file to a base64 data URL for Gemini API
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          if (typeof reader.result === 'string') {
            const analysis = await analyzePlantPhoto(reader.result);
            setNewPlantAnalysisResult(analysis);
            
            // If confidence is medium or high, suggest the species
            if (analysis.confidence !== 'low') {
              setNewPlant(prev => ({
                ...prev,
                species: analysis.species,
                notes: prev.notes ? 
                  `${prev.notes}\n\nAI Analysis: ${analysis.careInstructions}` 
                  : `AI Analysis: ${analysis.careInstructions}`
              }));
              
              // Try to fetch a real image of the identified plant
              setFetchingPlantImage(true);
              const imageUrl = await fetchPlantImage(analysis.commonName);
              setFetchingPlantImage(false);
              
              if (imageUrl) {
                setAutoPlantImageUrl(imageUrl);
              }
              
              toast({
                title: "Plant identified",
                description: `Plant identified as ${analysis.commonName}`,
              });
            }
          }
        } catch (error) {
          console.error('Error analyzing new plant photo:', error);
          toast({
            title: "Analysis failed",
            description: "We couldn't analyze your plant photo. Please try again.",
            variant: "destructive"
          });
        } finally {
          setAnalyzingNewPlantPhoto(false);
        }
      };
      
      reader.onerror = () => {
        setAnalyzingNewPlantPhoto(false);
        toast({
          title: "Error",
          description: "Failed to process the image for analysis",
          variant: "destructive"
        });
      };
    } catch (error) {
      console.error('Error processing plant photo:', error);
      setAnalyzingNewPlantPhoto(false);
    }
  };
  
  // Handle plant deletion
  const handleDeletePlant = async (plantId: string) => {
    if (!user) return;
    
    if (!confirm("Are you sure you want to delete this plant?")) return;
    
    try {
      // Create an updated plants object without the deleted plant
      if (profile && profile.plants) {
        // Create a new object without the deleted plant
        const updatedPlants: Record<string, UserPlant> = {};
        
        // Copy all plants except the one to delete
        Object.entries(profile.plants).forEach(([id, plant]) => {
          if (id !== plantId) {
            updatedPlants[id] = plant;
          }
        });
        
        // Update Firebase with the new plants object
        const userRef = ref(getDatabase(), `users/${user.uid}/plants`);
        await set(userRef, updatedPlants);
        
        // Refresh the profile
        await refreshProfile();
        
        toast({
          title: "Plant deleted",
          description: "The plant has been removed from your collection",
        });
      }
    } catch (error) {
      console.error('Error deleting plant:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the plant. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle photo upload and analysis
  const handlePhotoUpload = async () => {
    if (!user || !selectedPlant || !photoFile) return;
    
    try {
      setUploadingPhoto(true);
      
      // Upload the photo to Firebase Storage
      const downloadUrl = await uploadPlantPhoto(user.uid, selectedPlant.id, photoFile);
      
      // Update the plant data with the image URL
      await updatePlantData(user.uid, selectedPlant.id, {
        imageUrl: downloadUrl
      });
      
      toast({
        title: "Photo uploaded",
        description: "Your plant photo has been successfully uploaded.",
      });
      
      // Now analyze the photo with Gemini
      setAnalyzingPhoto(true);
      
      // Convert the file to a base64 data URL for Gemini API
      const reader = new FileReader();
      reader.readAsDataURL(photoFile);
      reader.onload = async () => {
        try {
          if (typeof reader.result === 'string') {
            const analysis = await analyzePlantPhoto(reader.result);
            setAnalysisResult(analysis);
            
            // If the confidence is medium or high, update the plant species
            if (analysis.confidence !== 'low') {
              await updatePlantData(user.uid, selectedPlant.id, {
                species: analysis.species,
                notes: selectedPlant.notes 
                  ? `${selectedPlant.notes}\n\nAI Analysis: ${analysis.careInstructions}`
                  : `AI Analysis: ${analysis.careInstructions}`,
                health: analysis.healthAssessment.toLowerCase().includes('good') 
                  ? 'good' 
                  : analysis.healthAssessment.toLowerCase().includes('excellent') 
                    ? 'excellent'
                    : analysis.healthAssessment.toLowerCase().includes('poor')
                      ? 'poor'
                      : 'fair'
              });
              
              toast({
                title: "Plant identified",
                description: `Your plant was identified as ${analysis.commonName} (${analysis.species})`,
              });
              
              // Refresh the profile to show updated data
              await refreshProfile();
            }
          }
        } catch (error) {
          console.error('Error analyzing plant photo:', error);
          toast({
            title: "Analysis failed",
            description: "We couldn't analyze your plant photo. Please try again.",
            variant: "destructive"
          });
        } finally {
          setAnalyzingPhoto(false);
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to process the image for analysis",
          variant: "destructive"
        });
        setAnalyzingPhoto(false);
      };
      
    } catch (error) {
      console.error('Error uploading plant photo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload your plant photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
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
      {/* Hidden file input for direct photo upload from plant cards */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoSelect}
      />
      
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
                    <div className="flex space-x-2">
                      <Input
                        id="species"
                        name="species"
                        placeholder="E.g., Boston Fern"
                        value={newPlant.species}
                        onChange={handleInputChange}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowPlantTypeSelector(true)}
                        className="whitespace-nowrap"
                      >
                        Choose Type
                      </Button>
                    </div>
                    {selectedPlantType && (
                      <div className="text-sm text-gray-500 mt-1 flex items-center">
                        <Leaf className="h-3 w-3 mr-1 text-green-500" />
                        Selected: {selectedPlantType.name} ({selectedPlantType.scientificName})
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="photo">Plant Photo</Label>
                    {newPlantPhotoPreview ? (
                      <div className="relative w-full h-48 rounded-md overflow-hidden">
                        <img 
                          src={newPlantPhotoPreview} 
                          alt="Plant preview" 
                          className="w-full h-full object-cover"
                        />
                        {newPlantAnalysisResult && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-sm">
                            <p>Detected: {newPlantAnalysisResult.commonName}</p>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 bg-white dark:bg-black bg-opacity-70 dark:bg-opacity-70"
                          onClick={() => {
                            setNewPlantPhotoPreview(null);
                            setNewPlantPhoto(null);
                            setNewPlantAnalysisResult(null);
                            if (newPlantPhotoRef.current) {
                              newPlantPhotoRef.current.value = '';
                            }
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="flex space-x-4">
                            <div className="flex flex-col items-center cursor-pointer" onClick={() => newPlantPhotoRef.current?.click()}>
                              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-1">
                                <Upload className="h-6 w-6 text-green-500" />
                              </div>
                              <span className="text-xs font-medium">Upload</span>
                            </div>
                            
                            <div className="flex flex-col items-center cursor-pointer" onClick={() => {
                              if (newPlantPhotoRef.current) {
                                newPlantPhotoRef.current.capture = "environment";
                                newPlantPhotoRef.current.click();
                              }
                            }}>
                              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-1">
                                <Camera className="h-6 w-6 text-blue-500" />
                              </div>
                              <span className="text-xs font-medium">Camera</span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Upload or take a photo for AI identification
                          </p>
                        </div>
                        <input
                          type="file"
                          ref={newPlantPhotoRef}
                          className="hidden"
                          accept="image/*"
                          capture="environment"
                          onChange={handleNewPlantPhotoSelect}
                        />
                      </div>
                    )}
                    {analyzingNewPlantPhoto && (
                      <div className="flex items-center justify-center py-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Analyzing photo...
                      </div>
                    )}
                    {autoPlantImageUrl && (
                      <div className="flex items-center justify-between mt-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                        <span className="text-xs text-green-700 dark:text-green-400">Reference image added from plant database</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0" 
                          onClick={() => setAutoPlantImageUrl(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
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
                  <Card 
                    className="overflow-hidden border-0 shadow-md bg-white dark:bg-slate-800 cursor-pointer group"
                    onClick={() => openPlantDetails(plant)}
                  >
                    <div className="h-3 bg-gradient-to-r from-green-400 to-green-600 dark:from-green-600 dark:to-green-800" />
                    {plant.imageUrl ? (
                      <div className="h-40 w-full overflow-hidden relative">
                        <img 
                          src={plant.imageUrl} 
                          alt={plant.name} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        />
                        <div className="absolute top-2 right-2 bg-white dark:bg-slate-800 bg-opacity-70 dark:bg-opacity-70 px-2 py-1 rounded text-xs font-medium">
                          View Metrics
                        </div>
                        {/* Quick camera/upload buttons - shown on hover */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              variant="secondary"
                              className="bg-white text-black dark:bg-slate-800 dark:text-white h-10 w-10 rounded-full p-0 shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening details modal
                                if (fileInputRef.current) {
                                  setSelectedPlant(plant);
                                  fileInputRef.current.removeAttribute('capture');
                                  fileInputRef.current.click();
                                }
                              }}
                            >
                              <Upload className="h-5 w-5" />
                            </Button>
                            <Button 
                              size="sm"
                              variant="secondary" 
                              className="bg-white text-black dark:bg-slate-800 dark:text-white h-10 w-10 rounded-full p-0 shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening details modal
                                if (fileInputRef.current) {
                                  setSelectedPlant(plant);
                                  fileInputRef.current.setAttribute('capture', 'environment');
                                  fileInputRef.current.click();
                                }
                              }}
                            >
                              <Camera className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 w-full bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center relative">
                        {speciesReferenceImages[plant.species] ? (
                          <div className="relative w-full h-full">
                            <img 
                              src={speciesReferenceImages[plant.species]} 
                              alt={plant.species} 
                              className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center">
                              <p className="text-white text-sm font-medium mb-1 bg-black/50 px-2 py-1 rounded-md">Reference Image</p>
                              <p className="text-white text-xs bg-black/50 px-2 py-1 rounded-md">Upload your own photo</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Camera className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">No image yet</p>
                          </>
                        )}
                        
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                          <Button 
                            size="sm"
                            variant="outline" 
                            className="bg-white/90 dark:bg-slate-800/90"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening details
                              if (fileInputRef.current) {
                                setSelectedPlant(plant);
                                fileInputRef.current.removeAttribute('capture');
                                fileInputRef.current.click();
                              }
                            }}
                          >
                            <Upload className="h-3.5 w-3.5 mr-1" />
                            Gallery
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline" 
                            className="bg-white/90 dark:bg-slate-800/90"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening details
                              if (fileInputRef.current) {
                                setSelectedPlant(plant);
                                fileInputRef.current.setAttribute('capture', 'environment');
                                fileInputRef.current.click();
                              }
                            }}
                          >
                            <Camera className="h-3.5 w-3.5 mr-1" />
                            Camera
                          </Button>
                        </div>
                      </div>
                    )}
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
                          <div 
                            className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md text-sm mt-3 cursor-pointer relative overflow-hidden" 
                            style={{ maxHeight: '60px' }}
                            onClick={(e) => {
                              const target = e.currentTarget;
                              if (target.style.maxHeight === '60px') {
                                target.style.maxHeight = '1000px';
                              } else {
                                target.style.maxHeight = '60px';
                              }
                            }}
                          >
                            <div className="relative">
                              {plant.notes}
                              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent dark:from-gray-700/50"></div>
                            </div>
                            <div className="flex justify-center mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Click to expand</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-2 flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-900/20"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening details modal
                              // Mark as watered
                              if (user && plant) {
                                updatePlantData(user.uid, plant.id, {
                                  lastWatered: Date.now()
                                }).then(() => {
                                  refreshProfile();
                                  toast({
                                    title: "Plant watered",
                                    description: `${plant.name} has been marked as watered.`
                                  });
                                });
                              }
                            }}
                          >
                            <Droplet className="h-3.5 w-3.5 mr-1" />
                            Water
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 dark:text-gray-300"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening details modal
                              openPhotoDialog(plant);
                            }}
                          >
                            <Camera className="h-3.5 w-3.5 mr-1" />
                            Photo
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/20 px-1"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening details modal
                              handleDeletePlant(plant.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      
      {/* Plant Type Selector Dialog */}
      <Dialog open={showPlantTypeSelector} onOpenChange={setShowPlantTypeSelector}>
        <DialogContent className="sm:max-w-[80vw] md:max-w-[700px] p-0">
          <PlantTypeSelector 
            onSelect={handlePlantTypeSelect}
            onClose={() => setShowPlantTypeSelector(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Plant Photo Upload Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Plant Photo</DialogTitle>
            <DialogDescription>
              Upload a photo of your plant for identification and care advice
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="upload" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Photo</TabsTrigger>
              <TabsTrigger value="result" disabled={!analysisResult}>Analysis Result</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-4 space-y-4">
              {photoPreview ? (
                <div className="relative w-full h-64 rounded-md overflow-hidden">
                  <img 
                    src={photoPreview} 
                    alt="Plant preview" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-white dark:bg-black bg-opacity-70 dark:bg-opacity-70"
                    onClick={() => {
                      setPhotoPreview(null);
                      setPhotoFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="flex space-x-4">
                      <div className="flex flex-col items-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                          <Upload className="h-8 w-8 text-green-500" />
                        </div>
                        <span className="text-sm font-medium">Upload</span>
                      </div>
                      
                      <div className="flex flex-col items-center cursor-pointer" onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.capture = "environment";
                          fileInputRef.current.click();
                        }
                      }}>
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                          <Camera className="h-8 w-8 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium">Camera</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                      Upload or take a photo of your plant for AI analysis
                    </p>
                  </div>
                  {/* File input is now located in the main component */}
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setPhotoDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePhotoUpload}
                  disabled={!photoFile || uploadingPhoto || analyzingPhoto}
                  className="bg-green-600 hover:bg-green-700 relative"
                >
                  {(uploadingPhoto || analyzingPhoto) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {uploadingPhoto 
                    ? "Uploading..." 
                    : analyzingPhoto 
                      ? "Analyzing..." 
                      : "Upload & Analyze"
                  }
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="result" className="mt-4 space-y-4">
              {analysisResult && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={
                        analysisResult.confidence === 'high' 
                          ? 'bg-green-500' 
                          : analysisResult.confidence === 'medium' 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }>
                        {analysisResult.confidence.charAt(0).toUpperCase() + analysisResult.confidence.slice(1)} confidence
                      </Badge>
                    </div>
                    
                    <div className="grid gap-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Species</h4>
                        <p className="text-lg font-medium">{analysisResult.species}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Common Name</h4>
                        <p className="text-lg font-medium">{analysisResult.commonName}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Health Assessment</h4>
                        <p className="text-lg font-medium">{analysisResult.healthAssessment}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Care Instructions</h4>
                        <p className="text-md">{analysisResult.careInstructions}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPhotoDialogOpen(false)}
                    >
                      Close
                    </Button>
                    {analysisResult.confidence !== 'low' && selectedPlant && (
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={async () => {
                          if (!user || !selectedPlant) return;
                          
                          try {
                            await updatePlantData(user.uid, selectedPlant.id, {
                              species: analysisResult.species,
                              notes: selectedPlant.notes 
                                ? `${selectedPlant.notes}\n\nAI Analysis: ${analysisResult.careInstructions}` 
                                : `AI Analysis: ${analysisResult.careInstructions}`
                            });
                            
                            toast({
                              title: "Plant updated",
                              description: "Your plant information has been updated with the analysis results."
                            });
                            
                            await refreshProfile();
                            setPhotoDialogOpen(false);
                          } catch (error) {
                            console.error('Error updating plant:', error);
                            toast({
                              title: "Update failed",
                              description: "Failed to update plant information.",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Apply Changes
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Plant Details Dialog with Metrics */}
      <Dialog open={plantDetailsOpen} onOpenChange={setPlantDetailsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          {selectedPlant && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl font-bold">{selectedPlant.name}</DialogTitle>
                  <Badge className={getHealthColor(selectedPlant.health)}>
                    {selectedPlant.health || 'Unknown'}
                  </Badge>
                </div>
                <DialogDescription className="text-lg">{selectedPlant.species}</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="aspect-square overflow-hidden rounded-lg">
                  {selectedPlant.imageUrl ? (
                    <img 
                      src={selectedPlant.imageUrl} 
                      alt={selectedPlant.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Leaf className="h-20 w-20 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">Current Metrics</h3>
                    
                    {sensorData ? (
                      <div className="space-y-3">
                        {/* Temperature */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3">
                              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Temperature</div>
                              <div className="font-medium">{sensorData.temperature}°C</div>
                            </div>
                          </div>
                          <Badge 
                            className={
                              sensorData.temperature > 30 ? "bg-red-500" : 
                              sensorData.temperature < 10 ? "bg-blue-500" : 
                              "bg-green-500"
                            }
                          >
                            {sensorData.temperature > 30 ? "High" : 
                             sensorData.temperature < 10 ? "Low" : 
                             "Optimal"}
                          </Badge>
                        </div>
                        
                        {/* Humidity */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                              <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Humidity</div>
                              <div className="font-medium">{sensorData.humidity}%</div>
                            </div>
                          </div>
                          <Badge 
                            className={
                              sensorData.humidity > 70 ? "bg-blue-500" : 
                              sensorData.humidity < 30 ? "bg-yellow-500" : 
                              "bg-green-500"
                            }
                          >
                            {sensorData.humidity > 70 ? "High" : 
                             sensorData.humidity < 30 ? "Low" : 
                             "Optimal"}
                          </Badge>
                        </div>
                        
                        {/* Light */}
                        {sensorData.light !== undefined && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mr-3">
                                <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="5" />
                                  <line x1="12" y1="1" x2="12" y2="3" />
                                  <line x1="12" y1="21" x2="12" y2="23" />
                                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                  <line x1="1" y1="12" x2="3" y2="12" />
                                  <line x1="21" y1="12" x2="23" y2="12" />
                                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Light</div>
                                <div className="font-medium">{sensorData.light} lux</div>
                              </div>
                            </div>
                            <Badge 
                              className={
                                sensorData.light > 3000 ? "bg-orange-500" : 
                                sensorData.light < 800 ? "bg-indigo-500" : 
                                "bg-green-500"
                              }
                            >
                              {sensorData.light > 3000 ? "Bright" : 
                               sensorData.light < 800 ? "Low" : 
                               "Good"}
                            </Badge>
                          </div>
                        )}
                        
                        {/* Water Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                              <Droplet className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Last Watered</div>
                              <div className="font-medium">{getDaysSinceWatered(selectedPlant.lastWatered)}</div>
                            </div>
                          </div>
                          <Badge 
                            className={
                              !selectedPlant.lastWatered ? "bg-red-500" :
                              (Date.now() - selectedPlant.lastWatered) > (1000 * 60 * 60 * 24 * 5) ? "bg-yellow-500" : 
                              "bg-green-500"
                            }
                          >
                            {!selectedPlant.lastWatered ? "Never Watered" :
                             (Date.now() - selectedPlant.lastWatered) > (1000 * 60 * 60 * 24 * 5) ? "Needs Water" : 
                             "Good"}
                          </Badge>
                        </div>
                        
                        {/* NPK Levels (simulated for demo) */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                              <Leaf className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Nutrient Levels</div>
                              <div className="font-medium">N: Medium, P: High, K: Low</div>
                            </div>
                          </div>
                          <Badge className="bg-yellow-500">
                            Needs Potassium
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Health Assessment */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-1">AI Health Assessment</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Based on current environmental conditions
                    </p>
                    
                    <div className="text-sm mt-2">
                      {sensorData ? (
                        <div>
                          {sensorData.temperature > 30 && (
                            <div className="flex items-start mb-2">
                              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                              <p>Temperature is too high, consider moving to a cooler location.</p>
                            </div>
                          )}
                          {sensorData.temperature < 10 && (
                            <div className="flex items-start mb-2">
                              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                              <p>Temperature is too low, consider moving to a warmer location.</p>
                            </div>
                          )}
                          {sensorData.humidity < 30 && (
                            <div className="flex items-start mb-2">
                              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                              <p>Humidity is too low, consider misting the plant or using a humidifier.</p>
                            </div>
                          )}
                          {sensorData.humidity > 70 && (
                            <div className="flex items-start mb-2">
                              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                              <p>Humidity is high, ensure good air circulation to prevent fungal issues.</p>
                            </div>
                          )}
                          {sensorData.light !== undefined && sensorData.light < 800 && (
                            <div className="flex items-start mb-2">
                              <AlertCircle className="h-4 w-4 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
                              <p>Light levels are low, consider moving to a brighter location.</p>
                            </div>
                          )}
                          {selectedPlant.lastWatered && (Date.now() - selectedPlant.lastWatered) > (1000 * 60 * 60 * 24 * 5) && (
                            <div className="flex items-start mb-2">
                              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                              <p>Plant hasn't been watered in over 5 days, consider watering soon.</p>
                            </div>
                          )}
                          
                          {/* If everything is optimal */}
                          {sensorData.temperature >= 10 && sensorData.temperature <= 30 &&
                           sensorData.humidity >= 30 && sensorData.humidity <= 70 &&
                           (sensorData.light === undefined || sensorData.light >= 800) &&
                           (selectedPlant.lastWatered && (Date.now() - selectedPlant.lastWatered) <= (1000 * 60 * 60 * 24 * 5)) && (
                            <div className="flex items-start mb-2">
                              <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                              <p>All metrics are within optimal ranges. Your plant is healthy!</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex justify-center items-center h-20">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setPlantDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    // Mark as watered
                    if (user && selectedPlant) {
                      updatePlantData(user.uid, selectedPlant.id, {
                        lastWatered: Date.now()
                      }).then(() => {
                        refreshProfile();
                        toast({
                          title: "Plant watered",
                          description: `${selectedPlant.name} has been marked as watered.`
                        });
                      });
                    }
                  }}
                >
                  <Droplet className="mr-2 h-4 w-4" />
                  Mark as Watered
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}