import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Initialize the Gemini API client
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Create a model
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Initial agricultural context for the chatbot
export const INITIAL_PROMPT = `
You are an expert agricultural assistant that specializes in plant care, gardening, and sustainable agriculture. 
Focus on providing practical advice for home gardeners and plant enthusiasts.
When responding to questions, provide specific, actionable tips related to:
- Plant care and maintenance
- Common plant diseases and remedies
- Optimal growing conditions for different plant species
- Sustainable gardening practices
- Indoor plant care
- Seasonal planting advice
- Organic pest control methods

Always start by considering the specific needs of different plants. Keep responses concise, friendly, and practical.
`;

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

// Initialize a chat session
export async function startChatSession() {
  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: INITIAL_PROMPT }],
      },
      {
        role: "model",
        parts: [{ text: "I'm ready to help with your plant care and gardening questions. What would you like to know about today?" }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 800,
    },
  });
  
  return chat;
}

// Send a message to the chat
export async function sendMessage(chat: any, message: string): Promise<string> {
  try {
    const result = await chat.sendMessage(message);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error sending message to Gemini:', error);
    return "Sorry, I had trouble processing your request. Please try again.";
  }
}