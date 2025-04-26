import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Droplet,
  Leaf,
  Activity,
  Settings,
  History,
  X,
  Camera,
  TrendingUp,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { UserPlant } from '@/lib/auth';
import { useAuth } from '@/lib/AuthProvider';
import { PlantGrowthTimeline, GrowthEvent, GrowthEventType } from './PlantGrowthTimeline';
import { AddGrowthEventForm, GrowthEventFormValues } from './AddGrowthEventForm';
import { GrowthVisualization } from './GrowthVisualization';
import { useToast } from '@/hooks/use-toast';
import {
  createGrowthEvent,
  getPlantGrowthEvents,
  getGrowthHistory,
} from '@/lib/growthEvents';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PlantDetailsDialogProps {
  plant: UserPlant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeletePlant?: (plantId: string) => Promise<void>;
}

export function PlantDetailsDialog({
  plant,
  open,
  onOpenChange,
  onDeletePlant
}: PlantDetailsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [growthEvents, setGrowthEvents] = useState<GrowthEvent[]>([]);
  const [growthData, setGrowthData] = useState<{
    heights: Array<{ timestamp: number; value: number }>;
    widths: Array<{ timestamp: number; value: number }>;
    leafCounts: Array<{ timestamp: number; value: number }>;
  }>({
    heights: [],
    widths: [],
    leafCounts: []
  });
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
  const [addEventType, setAddEventType] = useState<GrowthEventType | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  
  // Format date for display
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
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
  
  // Load growth events when the dialog opens and plant changes
  useEffect(() => {
    const loadGrowthEvents = async () => {
      if (open && plant && user) {
        setIsLoadingEvents(true);
        
        try {
          // Load growth events
          const events = await getPlantGrowthEvents(user.uid, plant.id);
          setGrowthEvents(events);
          
          // Load growth history data
          const history = await getGrowthHistory(user.uid, plant.id);
          setGrowthData(history);
        } catch (error) {
          console.error('Error loading growth events:', error);
          toast({
            title: 'Error',
            description: 'Failed to load plant growth data',
            variant: 'destructive'
          });
        } finally {
          setIsLoadingEvents(false);
        }
      }
    };
    
    loadGrowthEvents();
  }, [open, plant, user, toast]);
  
  // Reset the active tab when the dialog opens
  useEffect(() => {
    if (open) {
      setActiveTab('overview');
      setAddEventType(null);
    }
  }, [open]);
  
  // Handle adding a new growth event
  const handleAddEvent = (plantId: string, eventType: GrowthEventType) => {
    setAddEventType(eventType);
    setActiveTab('add-event');
  };
  
  // Handle saving the growth event
  const handleSaveEvent = async (data: GrowthEventFormValues, imageFile?: File) => {
    if (!user || !plant || !addEventType) return;
    
    try {
      // Create the growth event
      const newEvent = await createGrowthEvent(
        user.uid,
        plant.id,
        addEventType,
        data,
        imageFile
      );
      
      // Add the new event to the state
      setGrowthEvents(prev => [newEvent, ...prev]);
      
      // If it's a measurement event, update the growth data
      if (addEventType === 'measurement') {
        // Update heights if present
        if (data.height !== undefined) {
          setGrowthData(prev => ({
            ...prev,
            heights: [...prev.heights, { timestamp: newEvent.timestamp, value: data.height! }]
          }));
        }
        
        // Update widths if present
        if (data.width !== undefined) {
          setGrowthData(prev => ({
            ...prev,
            widths: [...prev.widths, { timestamp: newEvent.timestamp, value: data.width! }]
          }));
        }
        
        // Update leaf counts if present
        if (data.leafCount !== undefined) {
          setGrowthData(prev => ({
            ...prev,
            leafCounts: [...prev.leafCounts, { timestamp: newEvent.timestamp, value: data.leafCount! }]
          }));
        }
      }
      
      // Return to the timeline tab
      setAddEventType(null);
      setActiveTab('timeline');
      
      toast({
        title: 'Event added',
        description: `${addEventType.charAt(0).toUpperCase() + addEventType.slice(1)} event has been added to your plant's timeline`
      });
    } catch (error) {
      console.error('Error adding growth event:', error);
      toast({
        title: 'Error',
        description: 'Failed to add growth event',
        variant: 'destructive'
      });
    }
  };
  
  // Handle plant deletion
  const handleDeletePlant = async () => {
    if (!plant || !onDeletePlant) return;
    
    try {
      await onDeletePlant(plant.id);
      setDeleteConfirmOpen(false);
      onOpenChange(false);
      toast({
        title: 'Plant deleted',
        description: `${plant.name} has been removed from your collection`
      });
    } catch (error) {
      console.error('Error deleting plant:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete plant',
        variant: 'destructive'
      });
    }
  };
  
  // If no plant is selected, don't render anything
  if (!plant) return null;
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">{plant.name}</DialogTitle>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  // Edit functionality could be added here
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {addEventType ? (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAddEventType(null);
                  setActiveTab('timeline');
                }}
                className="mb-4"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              
              <AddGrowthEventForm
                plant={plant}
                eventType={addEventType}
                onSubmit={handleSaveEvent}
                onCancel={() => {
                  setAddEventType(null);
                  setActiveTab('timeline');
                }}
              />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Growth Timeline</TabsTrigger>
                <TabsTrigger value="visualization">Visualization</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left column: Plant image and basic info */}
                  <div>
                    <div className="rounded-lg border overflow-hidden mb-4 max-h-[400px] bg-gray-100 dark:bg-gray-800">
                      {plant.imageUrl ? (
                        <img 
                          src={plant.imageUrl} 
                          alt={plant.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                          <Leaf className="h-16 w-16 text-gray-400 mb-4" />
                          <p className="text-gray-500 text-center px-4">
                            No image available for this plant
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <span>Added on {formatDate(plant.addedAt)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Droplet className="h-5 w-5 text-blue-500" />
                        <span>Last watered {getDaysSinceWatered(plant.lastWatered)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-green-500" />
                        <span className="flex items-center">
                          Health: 
                          <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                            {plant.health || 'Unknown'}
                          </Badge>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right column: Species info and notes */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Species</h3>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <span className="font-semibold">{plant.species}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Notes</h3>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md min-h-[200px]">
                        {plant.notes ? (
                          <div className="whitespace-pre-line">{plant.notes}</div>
                        ) : (
                          <div className="text-gray-500">No notes available</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center pt-4">
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setActiveTab('timeline')}
                  >
                    <History className="mr-2 h-4 w-4" />
                    View Growth Timeline
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="timeline" className="mt-4 space-y-4">
                {/* Growth Timeline */}
                <PlantGrowthTimeline
                  plant={plant}
                  events={growthEvents}
                  onAddEvent={handleAddEvent}
                />
              </TabsContent>
              
              <TabsContent value="visualization" className="mt-4 space-y-4">
                {/* Growth Visualization */}
                <GrowthVisualization
                  userId={user?.uid || ''}
                  plantId={plant.id}
                  plantName={plant.name}
                  growthData={growthData}
                  isLoading={isLoadingEvents}
                />
                
                <div className="flex justify-center pt-4">
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => {
                      setAddEventType('measurement');
                      setActiveTab('add-event');
                    }}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Add Measurement
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {plant.name} from your collection.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDeletePlant}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}