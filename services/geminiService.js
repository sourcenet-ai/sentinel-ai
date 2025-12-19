
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeThreats(alerts) {
  if (!alerts || alerts.length === 0) return null;

  const promptText = alerts.map(a => `Title: ${a.title}\nSummary: ${a.summary}`).join('\n\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these cybersecurity alerts from Heise.de and provide a high-level briefing.
      Format the output as JSON with fields: 'overview' (string), 'riskLevel' (string: Low, Medium, High, Critical), 'recommendations' (array of strings).
      
      Alerts:
      ${promptText}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            riskLevel: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['overview', 'riskLevel', 'recommendations']
        }
      }
    });

    if (!response.text) return null;
    return JSON.parse(response.text);
  } catch (error) {
    console.error('AI analysis error:', error);
    return null;
  }
}
