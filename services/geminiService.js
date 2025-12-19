
import { GoogleGenAI, Type } from '@google/genai';

// Initialize with the API key directly from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeThreatLandscape(advisories) {
  if (!advisories || advisories.length === 0) return null;

  const topAdvisories = advisories.slice(0, 8).map(a => `
    Source: ${a.source}
    Title: ${a.title}
    Summary: ${a.summary.substring(0, 300)}...
  `).join('\n---\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following threat advisories and provide a structured briefing for security pros.
      
      Advisories:
      ${topAdvisories}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            riskLevel: { type: Type.STRING },
            topRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['summary', 'riskLevel', 'topRecommendations']
        }
      }
    });

    // Use .text property instead of method call per GenAI SDK specifications
    if (!response.text) return null;
    return JSON.parse(response.text);
  } catch (error) {
    console.error('AI Analysis failed:', error);
    return null;
  }
}
