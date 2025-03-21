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