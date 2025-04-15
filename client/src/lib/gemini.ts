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