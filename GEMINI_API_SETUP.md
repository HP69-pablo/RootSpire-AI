# Gemini API Setup Instructions

## How to Configure Your Gemini API Key

The Gemini AI integration requires a valid API key to function properly. Follow these steps to set it up:

### Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" 
4. Copy the generated API key (it will look like: `AIzaSy...`)

### Step 2: Configure the API Key in Your Project

1. Open the file: `client/src/config/api-keys.ts`
2. Replace `"AIzaSyDYourGeminiAPIKeyHere"` with your actual API key
3. Save the file

```typescript
export const API_KEYS = {
  GEMINI_API_KEY: "AIzaSyBYourActualAPIKeyHere", // Replace with your key
};
```

### Step 3: Verify the Setup

After setting up the API key, you can use these AI features:

- **Chat Assistant**: Click the chat bubble to ask plant care questions
- **Photo Analysis**: Upload plant photos for species identification
- **Current State Analysis**: Ask "based on the current plant state" to get advice using real sensor data
- **Environment Optimization**: Get optimal growing conditions for your plants

### Supported Chat Triggers for Real-time Data

The chatbot will automatically read current sensor data when you use these phrases:
- "based on the current plant state"
- "current plant condition"  
- "current sensor readings"
- "how is my plant right now"

### Security Note

- Keep your API key private and never share it publicly
- The API key is stored locally in your project files
- Consider using environment variables for production deployments

### Troubleshooting

If you see errors like "Gemini API key not configured":
1. Make sure you've replaced the placeholder text in `api-keys.ts`
2. Verify your API key is valid at Google AI Studio
3. Check that there are no extra spaces or characters in the key