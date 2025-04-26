import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserPlant } from '@/lib/auth';
import { Loader2, Plus, Camera, ChevronDown, Ruler, Droplet, Flower, Scissors, FileText, 
  Sprout, RefreshCw, Calendar, ChevronRight, Star, Clock, Activity } from 'lucide-react';

export type GrowthEventType = 'photo' | 'measurement' | 'watering' | 'fertilizing' | 'repotting' | 'pruning' | 'note';

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
  isLoading?: boolean;
  onAddEvent?: (plantId: string, eventType: GrowthEventType) => void;
}

export function PlantGrowthTimeline({ plant, events = [], isLoading = false, onAddEvent }: PlantGrowthTimelineProps) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  
  // Toggle event expansion
  const toggleEventExpansion = (eventId: string) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
    } else {
      setExpandedEventId(eventId);
    }
  };
  
  // Format date for display
  const formatDate = (timestamp: number, includeTime = false): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
    };
    
    return new Date(timestamp).toLocaleDateString('en-US', options);
  };
  
  // Get time elapsed since a timestamp
  const getTimeElapsed = (timestamp: number): string => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
      }
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years === 1 ? '' : 's'} ago`;
    }
  };
  
  // Get icon for event type
  const getEventIcon = (type: GrowthEventType) => {
    switch (type) {
      case 'photo':
        return <Camera className="h-5 w-5" />;
      case 'measurement':
        return <Ruler className="h-5 w-5" />;
      case 'watering':
        return <Droplet className="h-5 w-5" />;
      case 'fertilizing':
        return <Flower className="h-5 w-5" />;
      case 'repotting':
        return <Sprout className="h-5 w-5" />;
      case 'pruning':
        return <Scissors className="h-5 w-5" />;
      case 'note':
        return <FileText className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };
  
  // Get color for event type
  const getEventColor = (type: GrowthEventType): string => {
    switch (type) {
      case 'photo':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'measurement':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'watering':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300';
      case 'fertilizing':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'repotting':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
      case 'pruning':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300';
      case 'note':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  // Handle add event button click
  const handleAddEvent = (eventType: GrowthEventType) => {
    if (onAddEvent) {
      onAddEvent(plant.id, eventType);
    }
  };
  
  // Render health rating stars
  const renderHealthRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1 mt-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Growth Timeline</span>
            <Badge variant="outline" className="ml-2">Loading</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Growth Timeline</CardTitle>
          
          {onAddEvent && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-8 gap-1">
                  <Plus className="h-4 w-4" />
                  <span>Add Event</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAddEvent('photo')}>
                  <Camera className="h-4 w-4 mr-2 text-blue-500" />
                  <span>Add Photo</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddEvent('measurement')}>
                  <Ruler className="h-4 w-4 mr-2 text-purple-500" />
                  <span>Add Measurement</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddEvent('watering')}>
                  <Droplet className="h-4 w-4 mr-2 text-cyan-500" />
                  <span>Record Watering</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddEvent('fertilizing')}>
                  <Flower className="h-4 w-4 mr-2 text-green-500" />
                  <span>Record Fertilizing</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddEvent('repotting')}>
                  <Sprout className="h-4 w-4 mr-2 text-amber-500" />
                  <span>Record Repotting</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddEvent('pruning')}>
                  <Scissors className="h-4 w-4 mr-2 text-rose-500" />
                  <span>Record Pruning</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddEvent('note')}>
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  <span>Add Note</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-2">No Growth Events Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Start tracking your plant's growth journey by adding events like photos, measurements, watering, and more.
            </p>
            
            {onAddEvent && (
              <Button
                className="mt-6 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleAddEvent('photo')}
              >
                <Camera className="mr-2 h-4 w-4" />
                Add First Photo
              </Button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700 ml-2"></div>
            
            {/* Timeline events */}
            <div className="space-y-6">
              {events.map((event) => (
                <div key={event.id} className="relative pl-14">
                  {/* Timeline dot and icon */}
                  <div className={`absolute left-0 top-1 h-9 w-9 rounded-full flex items-center justify-center z-10 ${getEventColor(event.type)}`}>
                    {getEventIcon(event.type)}
                  </div>
                  
                  {/* Event content */}
                  <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
                    {/* Event header */}
                    <div 
                      className="p-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleEventExpansion(event.id)}
                    >
                      <div className="flex items-center">
                        <Badge variant="outline" className={`mr-3 ${getEventColor(event.type)}`}>
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </Badge>
                        
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                          <span>{formatDate(event.timestamp)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{getTimeElapsed(event.timestamp)}</span>
                        <ChevronRight 
                          className={`h-5 w-5 text-gray-500 transition-transform ${expandedEventId === event.id ? 'rotate-90' : ''}`} 
                        />
                      </div>
                    </div>
                    
                    {/* Expanded content */}
                    {expandedEventId === event.id && (
                      <div className="p-4 border-t dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Image if available */}
                          {event.imageUrl && (
                            <div className={`${event.type === 'photo' ? 'md:col-span-2' : ''}`}>
                              <div className="aspect-square md:aspect-auto md:h-48 overflow-hidden rounded-md">
                                <img 
                                  src={event.imageUrl} 
                                  alt={`${plant.name} - ${event.type}`} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Measurements - Layout depends on if there's an image */}
                          {event.type === 'measurement' && (
                            <div className={`${event.imageUrl ? '' : 'md:col-span-2'}`}>
                              <h4 className="text-sm font-medium mb-2">Measurements</h4>
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 grid grid-cols-3 gap-3">
                                {event.height !== undefined && (
                                  <div>
                                    <div className="text-xs text-gray-500">Height</div>
                                    <div className="font-medium">{event.height} cm</div>
                                  </div>
                                )}
                                
                                {event.width !== undefined && (
                                  <div>
                                    <div className="text-xs text-gray-500">Width</div>
                                    <div className="font-medium">{event.width} cm</div>
                                  </div>
                                )}
                                
                                {event.leafCount !== undefined && (
                                  <div>
                                    <div className="text-xs text-gray-500">Leaves</div>
                                    <div className="font-medium">{event.leafCount}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Health Rating (for care events) */}
                          {event.healthRating !== undefined && (
                            <div className={`${event.imageUrl ? '' : 'md:col-span-2'}`}>
                              <h4 className="text-sm font-medium mb-2">Plant Health</h4>
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                                {renderHealthRating(event.healthRating)}
                              </div>
                            </div>
                          )}
                          
                          {/* Notes (if available) */}
                          {event.notes && (
                            <div className="md:col-span-2">
                              <h4 className="text-sm font-medium mb-2">Notes</h4>
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 whitespace-pre-line text-sm">
                                {event.notes}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}