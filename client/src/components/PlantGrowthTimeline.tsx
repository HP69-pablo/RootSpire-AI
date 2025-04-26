import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Plus, Camera, Droplet, Sun, Sprout } from 'lucide-react';
import { UserPlant } from '@/lib/auth';

// Define growth event types
export type GrowthEventType = 'photo' | 'measurement' | 'watering' | 'fertilizing' | 'repotting' | 'pruning' | 'note';

// Define growth event interface
export interface GrowthEvent {
  id: string;
  plantId: string;
  timestamp: number;
  type: GrowthEventType;
  imageUrl?: string;
  height?: number;
  width?: number;
  leafCount?: number;
  notes?: string;
  healthRating?: 1 | 2 | 3 | 4 | 5;
}

interface PlantGrowthTimelineProps {
  plant: UserPlant;
  events?: GrowthEvent[];
  onAddEvent?: (plantId: string, eventType: GrowthEventType) => void;
}

export function PlantGrowthTimeline({ plant, events = [], onAddEvent }: PlantGrowthTimelineProps) {
  const [currentEvent, setCurrentEvent] = useState<number>(events.length > 0 ? events.length - 1 : -1);
  const [showAddEventMenu, setShowAddEventMenu] = useState<boolean>(false);
  
  // Sort events by timestamp descending (most recent first)
  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);
  
  const hasEvents = sortedEvents.length > 0;
  const canGoForward = currentEvent > 0;
  const canGoBack = currentEvent < sortedEvents.length - 1;
  
  // Format date for display
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Get icon for event type
  const getEventIcon = (type: GrowthEventType) => {
    switch(type) {
      case 'photo':
        return <Camera className="h-5 w-5 text-blue-500" />;
      case 'measurement':
        return <TrendingUp className="h-5 w-5 text-purple-500" />;
      case 'watering':
        return <Droplet className="h-5 w-5 text-blue-500" />;
      case 'fertilizing':
        return <Sprout className="h-5 w-5 text-green-500" />;
      case 'repotting':
        return <Sprout className="h-5 w-5 text-brown-500" />;
      case 'pruning':
        return <Sprout className="h-5 w-5 text-red-500" />;
      case 'note':
        return <Calendar className="h-5 w-5 text-gray-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get badge color for event type
  const getEventColor = (type: GrowthEventType): string => {
    switch(type) {
      case 'photo':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'measurement':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      case 'watering':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300';
      case 'fertilizing':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'repotting':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300';
      case 'pruning':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'note':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  // Handle navigation
  const goToPrevious = () => {
    if (canGoBack) {
      setCurrentEvent(currentEvent + 1);
    }
  };
  
  const goToNext = () => {
    if (canGoForward) {
      setCurrentEvent(currentEvent - 1);
    }
  };
  
  // Handle adding new event
  const handleAddEvent = (eventType: GrowthEventType) => {
    if (onAddEvent) {
      onAddEvent(plant.id, eventType);
      setShowAddEventMenu(false);
    }
  };
  
  // If no events, show empty state
  if (!hasEvents) {
    return (
      <Card className="w-full mt-4 overflow-hidden">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Sprout className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">No Growth Timeline Yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            Track your plant's growth journey by adding photos, measurements, and care events.
          </p>
          <Button 
            variant="default" 
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setShowAddEventMenu(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add First Event
          </Button>
          
          {showAddEventMenu && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 w-full">
              <Button variant="outline" size="sm" className={getEventColor('photo')} onClick={() => handleAddEvent('photo')}>
                <Camera className="mr-2 h-4 w-4" />
                Photo
              </Button>
              <Button variant="outline" size="sm" className={getEventColor('measurement')} onClick={() => handleAddEvent('measurement')}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Measurement
              </Button>
              <Button variant="outline" size="sm" className={getEventColor('watering')} onClick={() => handleAddEvent('watering')}>
                <Droplet className="mr-2 h-4 w-4" />
                Watering
              </Button>
              <Button variant="outline" size="sm" className={getEventColor('fertilizing')} onClick={() => handleAddEvent('fertilizing')}>
                <Sprout className="mr-2 h-4 w-4" />
                Fertilizing
              </Button>
              <Button variant="outline" size="sm" className={getEventColor('repotting')} onClick={() => handleAddEvent('repotting')}>
                <Sprout className="mr-2 h-4 w-4" />
                Repotting
              </Button>
              <Button variant="outline" size="sm" className={getEventColor('note')} onClick={() => handleAddEvent('note')}>
                <Calendar className="mr-2 h-4 w-4" />
                Note
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Display timeline with events
  const currentEventData = sortedEvents[currentEvent];
  
  return (
    <Card className="w-full mt-4 overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {/* Timeline Navigation */}
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              disabled={!canGoBack}
              className={!canGoBack ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Older
            </Button>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">{formatDate(currentEventData.timestamp)}</span>
              <Badge className={getEventColor(currentEventData.type)}>
                {currentEventData.type.charAt(0).toUpperCase() + currentEventData.type.slice(1)}
              </Badge>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              disabled={!canGoForward}
              className={!canGoForward ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Newer
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          {/* Event Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentEventData.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-5"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left column: Image if available */}
                {currentEventData.imageUrl && (
                  <div className="w-full md:w-1/2">
                    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                      <img 
                        src={currentEventData.imageUrl} 
                        alt={`Plant on ${formatDate(currentEventData.timestamp)}`}
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  </div>
                )}
                
                {/* Right column: Event details */}
                <div className={`w-full ${currentEventData.imageUrl ? 'md:w-1/2' : ''}`}>
                  <div className="flex items-start mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                      {getEventIcon(currentEventData.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {currentEventData.type.charAt(0).toUpperCase() + currentEventData.type.slice(1)} Event
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(currentEventData.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Event specific details */}
                  {currentEventData.type === 'measurement' && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {currentEventData.height && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Height</div>
                          <div className="text-xl font-medium">{currentEventData.height} cm</div>
                        </div>
                      )}
                      {currentEventData.width && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Width</div>
                          <div className="text-xl font-medium">{currentEventData.width} cm</div>
                        </div>
                      )}
                      {currentEventData.leafCount && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Leaf Count</div>
                          <div className="text-xl font-medium">{currentEventData.leafCount}</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Notes section */}
                  {currentEventData.notes && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                        {currentEventData.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Timeline dots */}
          <div className="flex items-center justify-center py-4 space-x-1">
            {sortedEvents.map((event, index) => (
              <button
                key={event.id}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentEvent 
                    ? 'bg-green-500 transform scale-150' 
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
                onClick={() => setCurrentEvent(index)}
                aria-label={`View event from ${formatDate(event.timestamp)}`}
              />
            ))}
          </div>
          
          {/* Add new event button */}
          <div className="flex justify-center pb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddEventMenu(!showAddEventMenu)}
              className="text-green-700 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-900/30 dark:hover:bg-green-900/20"
            >
              <Plus className="mr-2 h-4 w-4" />
              {showAddEventMenu ? 'Cancel' : 'Add New Event'}
            </Button>
          </div>
          
          {/* Add event menu */}
          {showAddEventMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-4"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className={getEventColor('photo')} onClick={() => handleAddEvent('photo')}>
                  <Camera className="mr-2 h-4 w-4" />
                  Photo
                </Button>
                <Button variant="outline" size="sm" className={getEventColor('measurement')} onClick={() => handleAddEvent('measurement')}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Measurement
                </Button>
                <Button variant="outline" size="sm" className={getEventColor('watering')} onClick={() => handleAddEvent('watering')}>
                  <Droplet className="mr-2 h-4 w-4" />
                  Watering
                </Button>
                <Button variant="outline" size="sm" className={getEventColor('fertilizing')} onClick={() => handleAddEvent('fertilizing')}>
                  <Sprout className="mr-2 h-4 w-4" />
                  Fertilizing
                </Button>
                <Button variant="outline" size="sm" className={getEventColor('repotting')} onClick={() => handleAddEvent('repotting')}>
                  <Sprout className="mr-2 h-4 w-4" />
                  Repotting
                </Button>
                <Button variant="outline" size="sm" className={getEventColor('note')} onClick={() => handleAddEvent('note')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Note
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}