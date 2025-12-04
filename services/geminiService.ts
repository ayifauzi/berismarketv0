import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert Retail Business Analyst for a multi-branch minimarket chain. 
Analyze the provided JSON transaction data.
Provide a concise executive summary formatted in Markdown.
Focus on:
1. Total Revenue.
2. Top Selling Product.
3. A brief strategic recommendation for the Branch Manager to improve sales or stock.
Keep the tone professional and helpful.
`;

export const analyzeSales = async (transactions: Transaction[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please set the API_KEY environment variable to use AI features.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Prepare data summary to save tokens
    const summaryData = transactions.map(t => ({
      date: t.date,
      total: t.total,
      items: t.items.map(i => `${i.name} (${i.qty} ${i.selectedUnit})`)
    })).slice(-20); // Last 20 transactions for brevity

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Here is the recent sales data: ${JSON.stringify(summaryData)}. Please analyze this.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate AI insight. Please try again later.";
  }
};

export const findPlaceWithAI = async (query: string): Promise<{ lat?: number, lng?: number, address?: string, raw?: string }> => {
  if (!process.env.API_KEY) return { raw: "API Key missing" };

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find the specific location details for "${query}". 
      I need the Latitude, Longitude, and a formal Address.
      
      CRITICAL: You MUST output the result in this exact string format on a single line:
      LAT: [number] | LNG: [number] | ADDR: [address string]
      
      Example:
      LAT: -6.2088 | LNG: 106.8456 | ADDR: Jl. M.H. Thamrin No.1, Jakarta Pusat`,
      config: {
        tools: [{ googleMaps: {} }],
        temperature: 0,
      }
    });

    const text = response.text || "";
    
    // Simple parsing logic based on requested format
    const latMatch = text.match(/LAT:\s*(-?[\d.]+)/);
    const lngMatch = text.match(/LNG:\s*(-?[\d.]+)/);
    const addrMatch = text.match(/ADDR:\s*(.+)/);

    return {
      lat: latMatch ? parseFloat(latMatch[1]) : undefined,
      lng: lngMatch ? parseFloat(lngMatch[1]) : undefined,
      address: addrMatch ? addrMatch[1].split('|')[0].trim() : undefined,
      raw: text
    };
  } catch (error) {
    console.error("Gemini Map Error:", error);
    return { raw: "Failed to find location." };
  }
};
