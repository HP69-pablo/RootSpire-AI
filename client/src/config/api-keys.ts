
// API Configuration
// Store your API keys here for easy management

export const API_KEYS = {
  GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || "AIzaSyDYourGeminiAPIKeyHere", // Replace with your actual Gemini API key
};

// Helper function to get API keys
export function getGeminiApiKey(): string {
  const apiKey = API_KEYS.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "AIzaSyDYourGeminiAPIKeyHere") {
    throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY environment variable or update the API_KEYS.GEMINI_API_KEY in /client/src/config/api-keys.ts');
  }
  
  return apiKey;
}
