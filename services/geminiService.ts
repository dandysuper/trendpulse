import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TrendCluster, TrendInsight, ContentIdea } from '../types';

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key is missing. Please ensure process.env.API_KEY is available.");
    }
    return new GoogleGenAI({ apiKey });
}

export const analyzeTrend = async (trend: TrendCluster): Promise<TrendInsight> => {
  const ai = getClient();
  
  const prompt = `
    Analyze the following video trend cluster:
    Name: ${trend.name}
    Category: ${trend.category}
    Top Videos:
    ${trend.videos.map(v => `- ${v.title} (${v.platform}, ${v.views} views)`).join('\n')}

    Provide a deep dive analysis on why this is trending right now, identify the common "hook" patterns used in titles/intros, describe the typical video structure, and identify the core audience.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      whyTrending: { type: Type.STRING, description: "Explanation of the trend's popularity" },
      hooks: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of common hook patterns"
      },
      structure: { type: Type.STRING, description: "Typical video structure description" },
      audience: { type: Type.STRING, description: "Target audience description" }
    },
    required: ["whyTrending", "hooks", "structure", "audience"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as TrendInsight;
    }
    throw new Error("No text response from Gemini");
    
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateContentIdeas = async (trend: TrendCluster, insight: TrendInsight): Promise<ContentIdea[]> => {
  const ai = getClient();

  const prompt = `
    Based on the trend "${trend.name}" and the following analysis:
    Why Trending: ${insight.whyTrending}
    Hooks: ${insight.hooks.join(', ')}
    Structure: ${insight.structure}

    Generate 3 unique, high-potential content ideas for a creator.
    Vary the formats (Short vs Long-form).
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      ideas: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            hook: { type: Type.STRING },
            outline: { type: Type.STRING },
            format: { type: Type.STRING, enum: ['Short', 'Long-form', 'Carousel'] }
          },
          required: ["title", "hook", "outline", "format"]
        }
      }
    },
    required: ["ideas"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.8 // Slightly higher for creativity
      }
    });

    if (response.text) {
        const data = JSON.parse(response.text) as { ideas: ContentIdea[] };
        return data.ideas;
    }
    throw new Error("No text response from Gemini");

  } catch (error) {
    console.error("Gemini Idea Gen Error:", error);
    throw error;
  }
};