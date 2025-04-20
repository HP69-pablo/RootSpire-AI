// Initial agricultural context for the chatbot
export const INITIAL_PROMPT = `
You are a helpful plant care assistant with expertise in horticulture, gardening, and plant science. Your purpose is to assist users with:

1. Plant identification and selection
2. Optimal growing conditions and care instructions
3. Troubleshooting plant health issues
4. Gardening techniques and best practices
5. Seasonal plant care guidance

You have access to a comprehensive plant database containing information about thousands of plant species, including:
- Scientific and common names
- Growth requirements (light, water, temperature, humidity)
- Hardiness zones
- Soil preferences
- Propagation methods
- Common pests and diseases
- Special care instructions

When providing plant care advice:
- Be specific and give actionable recommendations
- Consider the user's indicated expertise level (beginner, intermediate, advanced, expert)
- Adapt your advice to seasonal conditions when relevant
- For plant identification requests, ask clarifying questions if information is insufficient
- When suggesting care regimens, explain the reasoning behind your recommendations

For Smart Plant Monitor users:
- Recommend optimal temperature, humidity, and light settings for their plants
- Suggest watering schedules based on plant species and environmental conditions
- Explain how to interpret sensor readings from their monitoring system
- If they want to add a new plant to their system, provide the recommended configuration settings

Always start by considering the specific needs of different plants. Keep responses concise, friendly, and practical.
`;

// Plant database types for enhanced functionality
export interface PlantDatabaseEntry {
  id: string;
  commonName: string;
  scientificName: string;
  family?: string;
  careLevel: 'easy' | 'moderate' | 'difficult';
  light: string;
  water: string;
  temperature: {
    min: number;
    max: number;
    unit: 'C' | 'F';
  };
  humidity: {
    min: number;
    max: number;
  };
  soil: string;
  propagation: string[];
  pests?: string[];
  diseases?: string[];
  notes?: string;
}

// This function would fetch plant data from external API
// Currently stubbed to prevent unauthorized API access until proper APIs are selected
export async function searchPlantDatabase(query: string): Promise<PlantDatabaseEntry[]> {
  try {
    // This would be replaced with an actual API call
    console.log(`Searching for plant data: ${query}`);
    
    // In a real implementation, we would connect to:
    // - Trefle.io API (https://trefle.io/)
    // - Perenual API (https://perenual.com/docs/api)
    // - Open Farm API (https://docs.openfarm.cc/en/master/)
    
    return [];
  } catch (error) {
    console.error('Error searching plant database:', error);
    return [];
  }
}

// This function would extract plant care settings for Smart Plant Monitor
export function extractPlantCareSettings(plantData: PlantDatabaseEntry): {
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  lightLevel: string;
  wateringSchedule: string;
} {
  return {
    tempMin: plantData.temperature.min,
    tempMax: plantData.temperature.max,
    humidityMin: plantData.humidity.min,
    humidityMax: plantData.humidity.max,
    lightLevel: plantData.light,
    wateringSchedule: plantData.water
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface ChatHistory {
  messages: ChatMessage[];
}

// Initialize a chat session
export async function startChatSession(): Promise<ChatHistory> {
  // Create a new chat history with the initial system message
  const chatHistory: ChatHistory = {
    messages: [
      {
        role: 'model',
        content: "I'm ready to help with your plant care and gardening questions. What would you like to know about today?"
      }
    ]
  };
  
  return chatHistory;
}

// Send a message to Gemini API
export async function sendMessage(chatHistory: ChatHistory, message: string): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is missing');
    }
    
    // Construct the API payload with context and the new message
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    // Create a payload with the initial prompt and chat history
    let prompt = INITIAL_PROMPT + "\n\nHere's the conversation history:\n";
    
    // Add history but limit to last 10 messages to avoid token limits
    const recentMessages = chatHistory.messages.slice(-10);
    recentMessages.forEach(msg => {
      prompt += `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}\n`;
    });
    
    prompt += `Human: ${message}\nAssistant:`;
    
    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };
    
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Update chat history with new message
    chatHistory.messages.push({
      role: 'user',
      content: message
    });
    
    // Extract the response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.";
    
    // Update chat history with model response
    chatHistory.messages.push({
      role: 'model',
      content: responseText
    });
    
    return responseText;
  } catch (error) {
    console.error('Error sending message to Gemini API:', error);
    return "Sorry, I had trouble connecting to the plant intelligence. Please check your connection and try again.";
  }
}

// Analyze a plant photo using Gemini's vision capabilities
export interface PlantAnalysisResult {
  species: string;
  commonName: string;
  careInstructions: string;
  healthAssessment: string;
  confidence: 'high' | 'medium' | 'low';
}

export async function analyzePlantPhoto(imageUrl: string): Promise<PlantAnalysisResult> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is missing');
    }
    
    // Construct the API payload with the image
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    // Create the prompt for plant identification and analysis
    const prompt = `
    Please analyze this plant image and provide:
    1. Most likely species (scientific name)
    2. Common name
    3. Brief care instructions (light, water, temperature, humidity)
    4. An assessment of the plant's health based on visual cues
    5. Your confidence level in this identification (high, medium, or low)
    
    Format your answer as a JSON object with these fields:
    {
      "species": "Scientific name",
      "commonName": "Common name",
      "careInstructions": "Brief care instructions",
      "healthAssessment": "Health assessment",
      "confidence": "high/medium/low"
    }
    `;
    
    // Prepare the payload with both text and image
    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: imageUrl.split(',')[1] } }
        ]
      }]
    };
    
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error('No response received from Gemini API');
    }
    
    // Extract JSON from the response
    // Find JSON object in the response text using regex
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON response from Gemini API');
    }
    
    try {
      // Parse the JSON response
      const jsonResponse = JSON.parse(jsonMatch[0]);
      
      // Ensure all expected fields are present
      const result: PlantAnalysisResult = {
        species: jsonResponse.species || 'Unknown species',
        commonName: jsonResponse.commonName || 'Unknown',
        careInstructions: jsonResponse.careInstructions || 'No care instructions available',
        healthAssessment: jsonResponse.healthAssessment || 'Health assessment not available',
        confidence: (jsonResponse.confidence?.toLowerCase() as 'high' | 'medium' | 'low') || 'low'
      };
      
      return result;
    } catch (jsonError) {
      console.error('Error parsing JSON from Gemini response:', jsonError);
      throw new Error('Invalid response format from plant analysis');
    }
  } catch (error) {
    console.error('Error analyzing plant photo:', error);
    // Return a default response when the analysis fails
    return {
      species: 'Analysis failed',
      commonName: 'Unable to identify',
      careInstructions: 'Please try uploading a clearer photo of the plant.',
      healthAssessment: 'Assessment not available due to analysis failure.',
      confidence: 'low'
    };
  }
}

// Function to fetch a plant image from online sources with improved reliability
export async function fetchPlantImage(plantName: string): Promise<string | null> {
  if (!plantName) {
    console.error('No plant name provided for image search');
    return null;
  }
  
  console.log(`Searching for image of plant: ${plantName}`);
  
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Gemini API key is missing, using fallback image sources');
      return getPlantImageFallback(plantName);
    }
    
    // More specific prompt to get high-quality, reliable images
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const prompt = `
    You are a specialized plant image search assistant. I need a direct image URL for a high-quality, clear image of "${plantName}".

    Image requirements:
    1. Must be from Wikimedia Commons, Pixabay, Unsplash, or other free-to-use repositories
    2. Must show the plant clearly with good lighting and focus
    3. Should show the whole plant, not just a flower or leaf close-up
    4. Must be a direct image URL ending with .jpg, .jpeg, .png, or .webp
    5. Must be available under a free license or public domain
    6. Prefer images with neutral backgrounds when possible

    Respond ONLY with the direct image URL. No text before or after.
    `;
    
    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: 100, // Limit response size since we only need a URL
        temperature: 0.1 // Lower temperature for more consistent results
      }
    };
    
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.warn(`Gemini API request failed with status: ${response.status}`);
      return getPlantImageFallback(plantName);
    }
    
    const data = await response.json();
    
    // Extract the response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text.trim();
    
    if (!responseText) {
      console.warn('No response received from Gemini API');
      return getPlantImageFallback(plantName);
    }
    
    // Check if response is a valid URL to an image
    if (/^https?:\/\/.*\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(responseText)) {
      console.log(`Found image URL for ${plantName}: ${responseText}`);
      return responseText;
    } else {
      // Try to extract a URL from the response
      const urlMatch = responseText.match(/(https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp|gif)(\?[^\s"']*)?)/i);
      if (urlMatch && urlMatch[0]) {
        console.log(`Extracted image URL for ${plantName}: ${urlMatch[0]}`);
        return urlMatch[0];
      } else {
        console.warn('Could not extract valid image URL from Gemini response');
        return getPlantImageFallback(plantName);
      }
    }
  } catch (error) {
    console.error('Error fetching plant image with Gemini:', error);
    return getPlantImageFallback(plantName);
  }
}

// Fallback function for when Gemini API fails or isn't available
function getPlantImageFallback(plantName: string): string | null {
  console.log(`Using fallback image search for ${plantName}`);
  
  // Define reliable plant image mappings from Wikimedia Commons
  const plantImageMap: Record<string, string> = {
    'sunflower': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/A_sunflower.jpg',
    'rose': 'https://upload.wikimedia.org/wikipedia/commons/5/51/Small_Red_Rose.JPG',
    'aloe vera': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Aloe_vera_flower_inset.png',
    'snake plant': 'https://upload.wikimedia.org/wikipedia/commons/7/73/Snake_Plant_%28Sansevieria_trifasciata_%27Laurentii%27%29.jpg',
    'pothos': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Epipremnum_aureum_31082012.jpg',
    'monstera': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Monstera_deliciosa_at_l%27Auberge_Saint-Gabriel.jpg',
    'peace lily': 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Spathiphyllum_cochlearispathum_RTBG.jpg',
    'spider plant': 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Chlorophytum_comosum_17-08-2009_16-55-49.JPG',
    'fiddle leaf fig': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Ficus_lyrata_1.jpg',
    'tomato': 'https://upload.wikimedia.org/wikipedia/commons/8/89/Tomato_je.jpg',
    'strawberry': 'https://upload.wikimedia.org/wikipedia/commons/6/64/Garden_strawberry_%28Fragaria_%C3%97_ananassa%29_single.jpg',
    'basil': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Basil-Basilico-Ocimum_basilicum-albahaca.jpg',
    'succulent': 'https://upload.wikimedia.org/wikipedia/commons/7/77/Succulent_garden.jpg',
    'cactus': 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Ferocactus_peninsulae_9.jpg',
    'echeveria': 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Echeveria_hybrid.JPG'
  };
  
  // Search for exact match
  if (plantImageMap[plantName.toLowerCase()]) {
    return plantImageMap[plantName.toLowerCase()];
  }
  
  // Search for partial match
  const normalizedName = plantName.toLowerCase();
  for (const [key, url] of Object.entries(plantImageMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return url;
    }
  }
  
  // If no match, return a generic plant image
  return 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Houseplant_overview.jpg';
}