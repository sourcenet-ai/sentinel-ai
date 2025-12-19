
import { GoogleGenAI, Type } from '@google/genai';
import { Advisory, AIAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function analyzeThreatLandscape(advisories: Advisory[]): Promise<AIAnalysis | null> {
  if (advisories.length === 0) return null;

  // Take the top 8 advisories for a broader context across different sources
  const topAdvisories = advisories.slice(0, 8).map(a => `
    Source: ${a.source}
    Title: ${a.title}
    Summary: ${a.summary.substring(0, 300)}...
  `).join('\n---\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following cybersecurity threat advisories from multiple global sources (including CISA, BSI, Heise, SANS, etc.) and provide a high-level briefing for security professionals. 
      
      Aggregated Advisories:
      ${topAdvisories}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Brief summary of the most critical current global trends and recurring threats.' },
            riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
            topRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Top 3 actionable security recommendations based on these specific threats.'
            }
          },
          required: ['summary', 'riskLevel', 'topRecommendations']
        }
      }
    });

    if (!response.text) throw new Error('Empty AI response');
    return JSON.parse(response.text);
  } catch (error) {
    console.error('AI Analysis failed:', error);
    return null;
  }
}
