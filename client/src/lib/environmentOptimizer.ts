// import environment variables directly

// Define the optimal environment values interface
export interface OptimalEnvironmentValues {
  temperature: {
    min: number;
    max: number;
    unit: 'C' | 'F';
  };
  humidity: {
    min: number;
    max: number;
  };
  light: {
    min: number;
    max: number;
    description: string;
  };
  soilMoisture: {
    min: number;
    max: number;
    description: string;
  };
  recommendations: string[];
}

// Get AI recommendations for optimal environment values
export async function getOptimalEnvironmentValues(plantName: string): Promise<OptimalEnvironmentValues> {
  try {
    // Import API key from file-based config
    const { getGeminiApiKey } = await import('../config/api-keys');
    const apiKey = getGeminiApiKey();

    // Construct the API endpoint
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    // Create the prompt for plant environment optimization
    const prompt = `
    I need precise optimal environmental values for a ${plantName} plant.
    
    Please provide a detailed analysis of the ideal growing conditions including:
    
    1. Temperature range (in Celsius)
    2. Humidity range (percentage)
    3. Light level range (percentage, where 0% is complete darkness and 100% is full direct sunlight)
    4. Soil moisture level range (percentage, where 0% is completely dry and 100% is fully saturated)
    
    Format your answer as a valid JSON object with these exact fields:
    {
      "temperature": {
        "min": number,
        "max": number,
        "unit": "C"
      },
      "humidity": {
        "min": number,
        "max": number
      },
      "light": {
        "min": number,
        "max": number,
        "description": "string description of light requirements"
      },
      "soilMoisture": {
        "min": number,
        "max": number,
        "description": "string description of watering requirements"
      },
      "recommendations": [
        "string with specific advice"
      ]
    }
    
    Provide the most scientifically accurate values. Be sure the JSON is valid with all numeric values (not strings).
    `;
    
    // Prepare the payload
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
    
    // Extract the response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error('No response received from Gemini API');
    }
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }
    
    try {
      // Parse the JSON data
      const environmentData = JSON.parse(jsonMatch[0]) as OptimalEnvironmentValues;
      console.log('Optimal environment values:', environmentData);
      return environmentData;
    } catch (jsonError) {
      console.error('Error parsing JSON:', jsonError);
      throw new Error('Invalid JSON in API response');
    }
  } catch (error) {
    console.error('Error getting optimal environment values:', error);
    // Return default values as fallback
    return {
      temperature: {
        min: 18,
        max: 24,
        unit: 'C',
      },
      humidity: {
        min: 40,
        max: 60,
      },
      light: {
        min: 30,
        max: 70,
        description: "Medium indirect light",
      },
      soilMoisture: {
        min: 30,
        max: 60,
        description: "Allow top inch of soil to dry between watering",
      },
      recommendations: [
        "Maintain consistent environment without sudden changes",
        "Ensure proper drainage for plant health",
        "Consider the plant's native habitat for best results"
      ]
    };
  }
}