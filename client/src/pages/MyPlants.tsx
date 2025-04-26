import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
import { 
  uploadPlantPhoto, 
  updatePlantData, 
  subscribeSensorData, 
  setWateringActive,
  SensorData 
} from '@/lib/firebase';
import { getDatabase, ref, set } from 'firebase/database';
import { analyzePlantPhoto, PlantAnalysisResult, fetchPlantImage } from '@/lib/gemini';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlantTypeSelector } from '@/components/PlantTypeSelector';
import { PlantTypeInfo } from '@/lib/plantDatabase';
import { PlantDetailsDialog } from '@/components/PlantDetailsDialog';

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
  const [wateringDisabled, setWateringDisabled] = useState(false);

  // Handle authentication state
  useEffect(() => {
    // Don't redirect immediately, let the component render the login prompt
    // This is intentional to provide a better user experience with a message
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
  
  // Get days since last watered
  const getDaysSinceWatered = (lastWatered?: number): string => {
    if (!lastWatered) return 'Never';
    
    const now = Date.now();
    const diffMs = now - lastWatered;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        return 'Just now';
      }
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffDays} days ago`;
    }
  };
  
  // Get color for health badge
  const getHealthColor = (health?: string): string => {
    switch (health?.toLowerCase()) {
      case 'excellent':
        return 'bg-green-500 hover:bg-green-600';
      case 'good':
        return 'bg-green-400 hover:bg-green-500';
      case 'fair':
        return 'bg-yellow-400 hover:bg-yellow-500';
      case 'poor':
        return 'bg-red-400 hover:bg-red-500';
      default:
        return 'bg-gray-400 hover:bg-gray-500';
    }
  };
  
  // Handle photo upload
  const handlePhotoUpload = async () => {
    if (!photoFile || !selectedPlant || !user) return;
    
    setUploadingPhoto(true);
    
    try {
      // Upload the photo to Firebase Storage
      const downloadUrl = await uploadPlantPhoto(user.uid, selectedPlant.id, photoFile);
      
      // Update the plant data with the image URL
      await updatePlantData(user.uid, selectedPlant.id, {
        imageUrl: downloadUrl
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
          }
        } catch (error) {
          console.error('Error analyzing plant photo:', error);
          toast({
            title: "Analysis failed",
            description: "We uploaded your photo but couldn't analyze it.",
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
      
      // Refresh the profile to show updated data
      await refreshProfile();
      
      toast({
        title: "Photo uploaded",
        description: "Your plant photo has been uploaded."
      });
    } catch (error) {
      console.error('Error uploading plant photo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload your plant photo.",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
    }
  };
  
  // User plants
  const userPlants = (profile?.plants && typeof profile.plants === 'object')
    ? Object.values(profile.plants)
    : [];
    
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
        toast({
          title: "Error",
          description: "Failed to process the image for analysis",
          variant: "destructive"
        });
        setAnalyzingNewPlantPhoto(false);
      };
    } catch (error) {
      console.error('Error analyzing plant photo:', error);
      toast({
        title: "Analysis failed",
        description: "We couldn't analyze your plant photo. Please try again.",
        variant: "destructive"
      });
      setAnalyzingNewPlantPhoto(false);
    }
  };

  // Handle login prompt
  const handleLoginPrompt = () => {
    setLocation('/auth');
  };

  // If user is not logged in, show a prompt to log in
  if (!loading && !user) {
    return (
      <div className="min-h-screen font-sans transition-colors duration-300 ease-out bg-gradient-to-br from-slate-50 to-white text-slate-900 dark:from-slate-900 dark:to-slate-800 dark:text-white flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Login Required</CardTitle>
            <CardDescription>
              You need to be logged in to view and manage your plants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Leaf className="h-12 w-12 text-green-500 dark:text-green-400" />
                </div>
              </div>
              <p className="text-center">
                Please log in to access your plant collection and monitoring tools
              </p>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 mt-4"
                onClick={handleLoginPrompt}
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans transition-colors duration-300 ease-out bg-black text-white">
      {/* Hidden file input for direct photo upload from plant cards */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoSelect}
      />
      
      <main className="container mx-auto px-4 py-6 md:py-10 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col justify-center items-center gap-4 mb-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-3xl font-bold mb-2 text-white">My Plants</h1>
              <div className="h-1 w-16 bg-primary rounded-full mx-auto mt-2 mb-4"></div>
            </motion.div>
            
            <Dialog open={showAddPlant} onOpenChange={setShowAddPlant}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-black font-medium">
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
                    className="bg-primary hover:bg-primary/90 text-black font-medium"
                  >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {saving ? "Saving..." : "Add Plant"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {userPlants.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-md mx-auto"
            >
              <Card 
                className="fitness-card border border-neutral-700 overflow-hidden"
                style={{ 
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
                }}
              >
                <div className="h-1 bg-primary" />
                <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                  <motion.div 
                    className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center mb-6 border border-neutral-700"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                  >
                    <Leaf className="h-12 w-12 text-primary" />
                  </motion.div>
                  
                  <motion.h3 
                    className="text-2xl font-semibold mb-3 tracking-tight sf-pro-display"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    Your Plant Collection
                  </motion.h3>
                  
                  <motion.p 
                    className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm leading-relaxed sf-pro-display"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    Add your first plant to start monitoring its health and get personalized care recommendations through our AI-powered system.
                  </motion.p>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  >
                    <Button
                      onClick={() => setShowAddPlant(true)}
                      className="bg-primary hover:bg-primary/90 text-black border-0 shadow-lg px-6 py-6 h-auto transition-all duration-300"
                      size="lg"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      <span className="font-medium">Add Your First Plant</span>
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="flex justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {userPlants.map((plant) => (
                  <motion.div
                    key={plant.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ 
                      scale: 1.03,
                      boxShadow: "0 15px 35px rgba(0, 150, 136, 0.15), 0 5px 15px rgba(0, 0, 0, 0.05)",
                      y: -5
                    }}
                    transition={{ duration: 0.4, ease: [0.19, 1.0, 0.22, 1.0] }}
                    className="w-full aspect-[0.8]"
                  >
                    <Card 
                      className="overflow-hidden fitness-card cursor-pointer group w-full h-full flex flex-col border-white/10 dark:border-neutral-700 shadow-lg bg-white dark:bg-gray-800"
                      onClick={() => openPlantDetails(plant)}
                    >
                      {plant.imageUrl ? (
                        <div className="w-full h-3/5 overflow-hidden relative">
                          <img 
                            src={plant.imageUrl} 
                            alt={plant.name} 
                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 transform-gpu" 
                          />
                          <div 
                            className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300"
                          />
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="font-bold text-xl text-white drop-shadow-md mb-1 truncate">{plant.name}</h3>
                            <p className="text-white/90 text-sm truncate drop-shadow-md">{plant.species}</p>
                          </div>
                          <div className="absolute top-3 right-3 bg-white/85 dark:bg-slate-800/85 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold shadow-md border border-white/10 dark:border-slate-700/10">
                            {plant.health === 'excellent' ? '⭐ Excellent' : 
                             plant.health === 'good' ? '✓ Good' : 
                             plant.health === 'fair' ? '⚠️ Fair' : '⚠️ Poor'}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-3/5 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex flex-col items-center justify-center relative overflow-hidden">
                          {speciesReferenceImages[plant.species] ? (
                            <div className="relative w-full h-full">
                              <img 
                                src={speciesReferenceImages[plant.species]} 
                                alt={plant.species} 
                                className="w-full h-full object-cover opacity-70 transition-all duration-700 group-hover:scale-110 group-hover:opacity-75"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/20 flex flex-col items-center justify-center backdrop-blur-[1px]">
                                <div className="px-3 py-1.5 bg-black/60 rounded-lg mb-2 backdrop-blur-sm text-center">
                                  <p className="text-white text-sm font-medium">Reference Image</p>
                                </div>
                                <div className="px-3 py-1.5 bg-green-600/70 rounded-lg backdrop-blur-sm">
                                  <p className="text-white text-xs font-medium">Upload your own photo</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center px-4 h-full">
                              <div className="w-16 h-16 rounded-full bg-gray-200/70 dark:bg-gray-700/70 backdrop-blur-sm flex items-center justify-center mb-3 shadow-inner">
                                <Camera className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                              </div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">No image yet</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Upload a photo to track your plant's growth</p>
                            </div>
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
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white">{plant.name}</CardTitle>
                          <Badge className={getHealthColor(plant.health)}>
                            {plant.health || 'Unknown'}
                          </Badge>
                        </div>
                        <CardDescription className="text-gray-600 dark:text-gray-300">{plant.species}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <Calendar className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                            <span>Added {new Date(plant.addedAt).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <Droplet className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                            <span>Last watered: {getDaysSinceWatered(plant.lastWatered)}</span>
                          </div>
                          
                          {plant.notes && (
                            <div 
                              className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-md text-sm mt-3 cursor-pointer relative overflow-hidden border border-emerald-100 dark:border-emerald-800/30 shadow-sm" 
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
                              <div className="relative text-gray-700 dark:text-gray-200">
                                {plant.notes}
                                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-emerald-50 to-transparent dark:from-emerald-900/20"></div>
                              </div>
                              <div className="flex justify-center mt-1">
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Click to expand</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="pt-2 flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50 dark:hover:bg-blue-800/50 shadow-sm"
                              disabled={wateringDisabled}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening details modal
                                
                                // First, activate the watering system in Firebase
                                if (user && plant) {
                                  setWateringDisabled(true);
                                  
                                  // Activate the watering system
                                  setWateringActive(true)
                                    .then(() => {
                                      toast({
                                        title: "Watering...",
                                        description: `Watering system activated for ${plant.name}.`
                                      });
                                      
                                      // After 3 seconds, turn off the watering system
                                      setTimeout(() => {
                                        setWateringActive(false)
                                          .then(() => {
                                            console.log('Watering system deactivated');
                                            
                                            // Now update the plant's last watered timestamp
                                            return updatePlantData(user.uid, plant.id, {
                                              lastWatered: Date.now()
                                            });
                                          })
                                          .then(() => {
                                            refreshProfile();
                                            toast({
                                              title: "Plant watered",
                                              description: `${plant.name} has been marked as watered.`
                                            });
                                            
                                            // Add a cooldown to prevent button spamming
                                            setTimeout(() => {
                                              setWateringDisabled(false);
                                            }, 5000);
                                          })
                                          .catch((error) => {
                                            console.error('Error updating plant watering status:', error);
                                            setWateringDisabled(false);
                                          });
                                      }, 3000);
                                    })
                                    .catch((error) => {
                                      console.error('Error activating watering system:', error);
                                      toast({
                                        title: "Error",
                                        description: "Couldn't activate watering system. Please try again.",
                                        variant: "destructive"
                                      });
                                      setWateringDisabled(false);
                                    });
                                }
                              }}
                            >
                              {wateringDisabled ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <Droplet className="h-3.5 w-3.5 mr-1" />
                              )}
                              Water
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50 dark:hover:bg-emerald-800/50 shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening details modal
                                openPhotoDialog(plant);
                              }}
                            >
                              <Camera className="h-3.5 w-3.5 mr-1" />
                              Photo
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
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
                        </div>
                        
                        {/* Humidity */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                              <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
                                <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Humidity</div>
                              <div className="font-medium">{sensorData.humidity}%</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Light */}
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
                              <div className="font-medium">{sensorData.light || 'N/A'} lux</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Soil Moisture */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8 16a5 5 0 0 1 10 0" />
                                <line x1="2" y1="16" x2="22" y2="16" />
                                <line x1="2" y1="20" x2="22" y2="20" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Soil Moisture</div>
                              <div className="font-medium">{sensorData.soilMoisture || 'N/A'}%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">Loading sensor data...</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => openPhotoDialog(selectedPlant)}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Update Photo
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-500 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/20"
                      onClick={async () => {
                        if (!user || !selectedPlant) return;
                        
                        try {
                          // Remove plant from user profile 
                          // We're just setting it to null in the database, which Firebase will interpret as a delete
                          const db = getDatabase();
                          const plantRef = ref(db, `users/${user.uid}/plants/${selectedPlant.id}`);
                          await set(plantRef, null);
                          
                          toast({
                            title: "Plant removed",
                            description: `${selectedPlant.name} has been removed from your collection`,
                          });
                          
                          // Refresh profile and close the dialog
                          await refreshProfile();
                          setPlantDetailsOpen(false);
                        } catch (error) {
                          console.error('Error deleting plant:', error);
                          toast({
                            title: "Error",
                            description: "Failed to remove plant from your collection",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Plant
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-3">Notes</h3>
                {selectedPlant.notes ? (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg whitespace-pre-line">
                    {selectedPlant.notes}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-gray-500 dark:text-gray-400 text-center">
                    No notes added for this plant
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setPlantDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    // Close the dialog and navigate to Analytics page when implemented
                    toast({
                      title: "Coming Soon",
                      description: "Detailed analytics view is under development"
                    });
                  }}
                >
                  View Detailed Analytics
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}