import { useState, useEffect } from 'react';
import { PlantTypeInfo, plantCategories, getAllPlants, getPlantsByCategory, searchPlants } from '@/lib/plantDatabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Leaf, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useDevice } from '@/hooks/use-device';

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
  const { isMobileDevice } = useDevice();

  // Initialize with default category plants
  useEffect(() => {
    if (isSearchActive && searchQuery) {
      setDisplayedPlants(searchResults);
    } else {
      setDisplayedPlants(getPlantsByCategory(selectedCategory));
    }
  }, [selectedCategory, searchResults, isSearchActive, searchQuery]);

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
    onSelect(plant);
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
                        {plant.imageUrl ? (
                          <img 
                            src={plant.imageUrl} 
                            alt={plant.name} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <Leaf className="h-10 w-10 text-green-600 dark:text-green-400" />
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