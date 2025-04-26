import { useState, useRef } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlant } from '@/lib/auth';
import { GrowthEventType } from './PlantGrowthTimeline';
import { Camera, Upload, X } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

interface AddGrowthEventFormProps {
  plant: UserPlant;
  eventType: GrowthEventType;
  onSubmit: (data: GrowthEventFormValues, imageFile?: File) => Promise<void>;
  onCancel: () => void;
}

export type GrowthEventFormValues = {
  notes?: string;
  height?: number;
  width?: number;
  leafCount?: number;
  healthRating?: number;
};

export function AddGrowthEventForm({ plant, eventType, onSubmit, onCancel }: AddGrowthEventFormProps) {
  const { toast } = useToast();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create a dynamic form schema based on the event type
  const getFormSchema = () => {
    const baseSchema = z.object({
      notes: z.string().optional(),
    });

    switch (eventType) {
      case 'photo':
        return baseSchema.extend({
          notes: z.string().optional(),
        });
      case 'measurement':
        return baseSchema.extend({
          height: z.coerce.number().min(0.1).optional(),
          width: z.coerce.number().min(0.1).optional(),
          leafCount: z.coerce.number().min(1).optional(),
        });
      case 'watering':
      case 'fertilizing':
      case 'repotting':
      case 'pruning':
        return baseSchema.extend({
          notes: z.string().optional(),
          healthRating: z.number().min(1).max(5).optional(),
        });
      default:
        return baseSchema;
    }
  };

  // Create the form
  const form = useForm<GrowthEventFormValues>({
    resolver: zodResolver(getFormSchema()),
    defaultValues: {
      notes: '',
      height: undefined,
      width: undefined,
      leafCount: undefined,
      healthRating: 3,
    },
  });

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setPhotoFile(file);
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  // Remove photo
  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleFormSubmit = async (data: GrowthEventFormValues) => {
    try {
      setIsSubmitting(true);
      
      await onSubmit(data, photoFile || undefined);
      
      toast({
        title: "Event added",
        description: `${eventType.charAt(0).toUpperCase() + eventType.slice(1)} event has been added to your plant's timeline`,
      });
    } catch (error) {
      console.error('Error adding growth event:', error);
      toast({
        title: "Failed to add event",
        description: "There was a problem adding your event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get form title based on event type
  const getFormTitle = () => {
    switch (eventType) {
      case 'photo':
        return 'Add Plant Photo';
      case 'measurement':
        return 'Add Growth Measurements';
      case 'watering':
        return 'Record Watering';
      case 'fertilizing':
        return 'Record Fertilizing';
      case 'repotting':
        return 'Record Repotting';
      case 'pruning':
        return 'Record Pruning';
      case 'note':
        return 'Add Note';
      default:
        return 'Add Event';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold text-gray-800 dark:text-white">
        {getFormTitle()}: {plant.name}
      </div>
      
      {/* Photo Upload Section (Only for photo event or optional for others) */}
      {(eventType === 'photo' || eventType === 'measurement') && (
        <div className="mb-6">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handlePhotoSelect}
            className="hidden"
          />
          
          {photoPreview ? (
            <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <img
                src={photoPreview}
                alt="Plant preview"
                className="w-full h-64 object-cover"
              />
              <Button
                variant="outline"
                size="icon"
                className="absolute top-2 right-2 bg-white dark:bg-gray-900 bg-opacity-80 dark:bg-opacity-80 h-8 w-8 p-1.5"
                onClick={removePhoto}
              >
                <X className="h-full w-full" />
              </Button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-green-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-medium">
                    {eventType === 'photo' ? 'Upload a photo of your plant' : 'Add an optional photo'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click to browse or drag and drop
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {eventType === 'photo' && !photoFile && (
            <div className="mt-2 text-sm text-amber-600 dark:text-amber-500">
              *Photo is required for this event type
            </div>
          )}
        </div>
      )}
      
      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Measurements (for measurement events) */}
          {eventType === 'measurement' && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="Plant height in cm" {...field} />
                    </FormControl>
                    <FormDescription>
                      Record the current height of your plant in centimeters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Width (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="Plant width in cm" {...field} />
                    </FormControl>
                    <FormDescription>
                      Record the current width or spread of your plant in centimeters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="leafCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Leaves</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Number of leaves" {...field} />
                    </FormControl>
                    <FormDescription>
                      Count the number of leaves on your plant
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          
          {/* Health Rating (for care events) */}
          {['watering', 'fertilizing', 'repotting', 'pruning'].includes(eventType) && (
            <FormField
              control={form.control}
              name="healthRating"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Plant Health Rating</FormLabel>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                      <span>Poor</span>
                      <span>Fair</span>
                      <span>Good</span>
                      <span>Great</span>
                      <span>Excellent</span>
                    </div>
                    <FormControl>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[value || 3]}
                        onValueChange={([newValue]) => onChange(newValue)}
                        {...field}
                        className="py-4"
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Rate the overall health of your plant after this {eventType}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {/* Notes (for all events) */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={`Add details about this ${eventType} event...`}
                    className="min-h-24 resize-y"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Add any observations or details about your plant's condition
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (eventType === 'photo' && !photoFile)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? 'Saving...' : 'Save Event'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}