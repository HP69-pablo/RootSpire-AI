import { getDatabase, ref, set, push, get, query, orderByChild, equalTo } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { GrowthEvent, GrowthEventType } from '@/components/PlantGrowthTimeline';
import { GrowthEventFormValues } from '@/components/AddGrowthEventForm';

/**
 * Create a new growth event for a plant
 * @param userId The user ID
 * @param plantId The plant ID
 * @param eventType The type of event
 * @param eventData The event data
 * @param imageFile Optional image file to upload
 * @returns The created growth event
 */
export async function createGrowthEvent(
  userId: string,
  plantId: string,
  eventType: GrowthEventType,
  eventData: GrowthEventFormValues,
  imageFile?: File
): Promise<GrowthEvent> {
  try {
    const db = getDatabase();
    const storage = getStorage();
    
    // Create a new event reference with a unique ID
    const eventsRef = ref(db, `users/${userId}/plants/${plantId}/growthEvents`);
    const newEventRef = push(eventsRef);
    const eventId = newEventRef.key as string;
    
    // Initialize the event object
    let eventObject: GrowthEvent = {
      id: eventId,
      plantId,
      timestamp: Date.now(),
      type: eventType,
      ...(eventData.notes ? { notes: eventData.notes } : {}),
      ...(eventData.height !== undefined ? { height: eventData.height } : {}),
      ...(eventData.width !== undefined ? { width: eventData.width } : {}),
      ...(eventData.leafCount !== undefined ? { leafCount: eventData.leafCount } : {}),
      ...(eventData.healthRating !== undefined ? { 
        healthRating: eventData.healthRating as 1 | 2 | 3 | 4 | 5 
      } : {})
    };
    
    // If there's an image file, upload it to Firebase Storage
    if (imageFile) {
      const imageStoragePath = `users/${userId}/plants/${plantId}/growth-events/${eventId}`;
      const imageRef = storageRef(storage, imageStoragePath);
      
      // Upload the image file
      await uploadBytes(imageRef, imageFile);
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(imageRef);
      
      // Add the image URL to the event object
      eventObject.imageUrl = downloadUrl;
    }
    
    // Write the event data to the database
    await set(newEventRef, eventObject);
    
    return eventObject;
  } catch (error) {
    console.error('Error creating growth event:', error);
    throw new Error('Failed to create growth event');
  }
}

/**
 * Get all growth events for a plant
 * @param userId The user ID
 * @param plantId The plant ID
 * @returns An array of growth events
 */
export async function getPlantGrowthEvents(userId: string, plantId: string): Promise<GrowthEvent[]> {
  try {
    const db = getDatabase();
    const eventsRef = ref(db, `users/${userId}/plants/${plantId}/growthEvents`);
    
    // Get all events for this plant
    const snapshot = await get(eventsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    // Convert the snapshot to an array of events
    const events: GrowthEvent[] = [];
    snapshot.forEach((childSnapshot) => {
      const eventData = childSnapshot.val() as GrowthEvent;
      events.push(eventData);
    });
    
    // Sort events by timestamp (newest first)
    return events.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting growth events:', error);
    return [];
  }
}

/**
 * Delete a growth event
 * @param userId The user ID
 * @param plantId The plant ID
 * @param eventId The event ID
 * @returns A boolean indicating success
 */
export async function deleteGrowthEvent(userId: string, plantId: string, eventId: string): Promise<boolean> {
  try {
    const db = getDatabase();
    const eventRef = ref(db, `users/${userId}/plants/${plantId}/growthEvents/${eventId}`);
    
    // Set the value to null to delete it
    await set(eventRef, null);
    
    return true;
  } catch (error) {
    console.error('Error deleting growth event:', error);
    return false;
  }
}

/**
 * Update a growth event
 * @param userId The user ID
 * @param plantId The plant ID
 * @param eventId The event ID
 * @param eventData The updated event data
 * @returns A boolean indicating success
 */
export async function updateGrowthEvent(
  userId: string,
  plantId: string,
  eventId: string,
  eventData: Partial<GrowthEvent>
): Promise<boolean> {
  try {
    const db = getDatabase();
    const eventRef = ref(db, `users/${userId}/plants/${plantId}/growthEvents/${eventId}`);
    
    // Get the current event data
    const snapshot = await get(eventRef);
    if (!snapshot.exists()) {
      return false;
    }
    
    const currentEvent = snapshot.val() as GrowthEvent;
    
    // Update with new data
    const updatedEvent = {
      ...currentEvent,
      ...eventData
    };
    
    // Write the updated event to the database
    await set(eventRef, updatedEvent);
    
    return true;
  } catch (error) {
    console.error('Error updating growth event:', error);
    return false;
  }
}

/**
 * Get the most recent measurements for a plant
 * @param userId The user ID
 * @param plantId The plant ID
 * @returns The most recent measurement data
 */
export async function getMostRecentMeasurements(userId: string, plantId: string): Promise<{
  height?: number;
  width?: number;
  leafCount?: number;
  timestamp: number;
} | null> {
  try {
    const db = getDatabase();
    const eventsRef = ref(db, `users/${userId}/plants/${plantId}/growthEvents`);
    
    // Query for measurement events
    const snapshot = await get(eventsRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    // Find the most recent measurement event
    const events: GrowthEvent[] = [];
    snapshot.forEach((childSnapshot) => {
      const eventData = childSnapshot.val() as GrowthEvent;
      if (eventData.type === 'measurement') {
        events.push(eventData);
      }
    });
    
    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp - a.timestamp);
    
    // Return the most recent measurement or null if none exists
    if (events.length > 0) {
      const mostRecent = events[0];
      return {
        height: mostRecent.height,
        width: mostRecent.width,
        leafCount: mostRecent.leafCount,
        timestamp: mostRecent.timestamp
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting most recent measurements:', error);
    return null;
  }
}

/**
 * Get the growth history for a plant
 * @param userId The user ID
 * @param plantId The plant ID
 * @returns An array of measurement events over time
 */
export async function getGrowthHistory(userId: string, plantId: string): Promise<{
  heights: Array<{ timestamp: number, value: number }>;
  widths: Array<{ timestamp: number, value: number }>;
  leafCounts: Array<{ timestamp: number, value: number }>;
}> {
  try {
    const db = getDatabase();
    const eventsRef = ref(db, `users/${userId}/plants/${plantId}/growthEvents`);
    
    // Get all measurement events
    const snapshot = await get(eventsRef);
    
    const heights: Array<{ timestamp: number, value: number }> = [];
    const widths: Array<{ timestamp: number, value: number }> = [];
    const leafCounts: Array<{ timestamp: number, value: number }> = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const eventData = childSnapshot.val() as GrowthEvent;
        if (eventData.type === 'measurement') {
          if (eventData.height !== undefined) {
            heights.push({ timestamp: eventData.timestamp, value: eventData.height });
          }
          if (eventData.width !== undefined) {
            widths.push({ timestamp: eventData.timestamp, value: eventData.width });
          }
          if (eventData.leafCount !== undefined) {
            leafCounts.push({ timestamp: eventData.timestamp, value: eventData.leafCount });
          }
        }
      });
    }
    
    // Sort by timestamp (oldest first for charting)
    heights.sort((a, b) => a.timestamp - b.timestamp);
    widths.sort((a, b) => a.timestamp - b.timestamp);
    leafCounts.sort((a, b) => a.timestamp - b.timestamp);
    
    return { heights, widths, leafCounts };
  } catch (error) {
    console.error('Error getting growth history:', error);
    return { heights: [], widths: [], leafCounts: [] };
  }
}