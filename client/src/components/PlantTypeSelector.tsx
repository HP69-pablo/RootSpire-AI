import { useState, useEffect, useCallback } from 'react';
import { PlantTypeInfo, plantCategories, getAllPlants, getPlantsByCategory, searchPlants } from '@/lib/plantDatabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Leaf, X, ImageIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useDevice } from '@/hooks/use-device';
import { fetchPlantImage } from '@/lib/gemini';

interface PlantTypeSelectorProps {
  onSelect: (plant: PlantTypeInfo) => void;
  onClose: () => void;
}

export function PlantTypeSelector({ onSelect, onClose }: PlantTypeSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('houseplant');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<PlantTypeInfo[]>([]);
  const [displayedPlants, setDisplayedPlants] = useState<PlantTypeInfo[]>([]);
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [plantImages, setPlantImages] = useState<Record<string, string>>({});
  const { isMobileDevice } = useDevice();

  // Function to load plant image using Gemini
  const loadPlantImage = useCallback(async (plant: PlantTypeInfo) => {
    // Skip if plant already has an image or if we're already loading it
    if (plant.imageUrl || loadingImages[plant.id] || plantImages[plant.id]) {
      return;
    }
    
    // Mark this plant as loading an image
    setLoadingImages(prev => ({ ...prev, [plant.id]: true }));
    
    try {
      // Use plant name and scientific name for better search results
      const searchTerm = `${plant.name} (${plant.scientificName}) plant`;
      const imageUrl = await fetchPlantImage(searchTerm);
      
      if (imageUrl) {
        // Store the image URL in state
        setPlantImages(prev => ({ ...prev, [plant.id]: imageUrl }));
      }
    } catch (error) {
      console.error(`Error loading image for ${plant.name}:`, error);
    } finally {
      // Mark loading as complete regardless of result
      setLoadingImages(prev => ({ ...prev, [plant.id]: false }));
    }
  }, [loadingImages, plantImages]);
  
  // Initialize with default category plants
  useEffect(() => {
    if (isSearchActive && searchQuery) {
      setDisplayedPlants(searchResults);
    } else {
      setDisplayedPlants(getPlantsByCategory(selectedCategory));
    }
  }, [selectedCategory, searchResults, isSearchActive, searchQuery]);
  
  // Effect to load images for displayed plants
  useEffect(() => {
    // Only load first 9 plant images to avoid overwhelming the API
    const plantsWithoutImages = displayedPlants
      .filter(plant => !plant.imageUrl && !plantImages[plant.id] && !loadingImages[plant.id])
      .slice(0, 9);
      
    // For each plant without an image, trigger image loading
    plantsWithoutImages.forEach(plant => {
      loadPlantImage(plant);
    });
  }, [displayedPlants, loadPlantImage, plantImages, loadingImages]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setIsSearchActive(false);
      setSearchResults([]);
      return;
    }
    
    setIsSearchActive(true);
    const results = searchPlants(query);
    setSearchResults(results);
  };

  // Handle clear search
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchActive(false);
    setSearchResults([]);
  };

  // Handle plant selection
  const handlePlantSelect = (plant: PlantTypeInfo) => {
    // If we've generated an image for this plant, include it in the selection
    const selectedPlant = { 
      ...plant,
      // If we found an image via Gemini but the plant doesn't have one, use ours
      imageUrl: plant.imageUrl || plantImages[plant.id] || undefined
    };
    onSelect(selectedPlant);
    onClose();
  };

  // Format care difficulty and requirements for display
  const getDisplayInfo = (info: 'low' | 'medium' | 'high') => {
    switch (info) {
      case 'low':
        return { label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
      case 'medium':
        return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' };
      case 'high':
        return { label: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
    }
  };

  const getCareDifficultyInfo = (difficulty: 'easy' | 'moderate' | 'difficult') => {
    switch (difficulty) {
      case 'easy':
        return { label: 'Easy', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
      case 'moderate':
        return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' };
      case 'difficult':
        return { label: 'Difficult', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Select Plant Type</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="mb-4 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for plants..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 rounded-full"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {isSearchActive && (
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
          </div>
        )}
      </div>
      
      {!isSearchActive && (
        <Tabs defaultValue="houseplant" value={selectedCategory} onValueChange={setSelectedCategory} className="mb-4">
          <ScrollArea className="w-full">
            <div className="pb-4 overflow-x-auto">
              <TabsList className="mb-2 w-auto inline-flex">
                {plantCategories.map(category => (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    className="min-w-max"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </ScrollArea>
        </Tabs>
      )}

      <ScrollArea className={`${isMobileDevice ? 'h-[400px]' : 'h-[500px]'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedPlants.map((plant) => {
            const careInfo = getCareDifficultyInfo(plant.careDifficulty);
            const lightInfo = getDisplayInfo(plant.light);
            const waterInfo = getDisplayInfo(plant.water);
            
            return (
              <motion.div
                key={plant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="cursor-pointer overflow-hidden hover:shadow-md transition-shadow" 
                  onClick={() => handlePlantSelect(plant)}
                >
                  <CardContent className="p-3">
                    <div className="flex gap-3 items-start">
                      <div className="h-16 w-16 rounded-full flex items-center justify-center overflow-hidden">
                        {plant.imageUrl || plantImages[plant.id] ? (
                          <img 
                            src={plant.imageUrl || plantImages[plant.id]} 
                            alt={plant.name} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // If image fails to load, show the leaf icon instead
                              e.currentTarget.style.display = 'none';
                              // Mark this plant as not having an image
                              setPlantImages(prev => {
                                const newState = {...prev};
                                delete newState[plant.id];
                                return newState;
                              });
                            }}
                          />
                        ) : loadingImages[plant.id] ? (
                          <div className="h-full w-full bg-green-50 dark:bg-green-950 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 text-green-600 dark:text-green-400 animate-spin" />
                          </div>
                        ) : (
                          <div className="h-full w-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{plant.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-2">{plant.scientificName}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge variant="outline" className={careInfo.color}>
                            {careInfo.label}
                          </Badge>
                          <Badge variant="outline" className={lightInfo.color}>
                            Light: {lightInfo.label}
                          </Badge>
                          <Badge variant="outline" className={waterInfo.color}>
                            Water: {waterInfo.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {plant.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          
          {displayedPlants.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              {isSearchActive 
                ? "No plants found matching your search." 
                : "No plants found in this category."}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}