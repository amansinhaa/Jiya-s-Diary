import { GoogleGenAI } from "@google/genai";
import { GeminiModel } from "../types";

let ai: GoogleGenAI | null = null;

const getAIClient = (): GoogleGenAI | null => {
  if (ai) return ai;

  // 1. Try Local Storage (User entered key in Settings)
  const storedKey = localStorage.getItem('jiya_gemini_api_key');
  
  // 2. Try Environment Variable (Local development fallback)
  const envKey = process.env.API_KEY;

  const keyToUse = storedKey || envKey;

  if (keyToUse) {
    ai = new GoogleGenAI({ apiKey: keyToUse });
    return ai;
  }
  
  return null;
};

export const updateAIKey = (newKey: string) => {
  localStorage.setItem('jiya_gemini_api_key', newKey);
  ai = new GoogleGenAI({ apiKey: newKey });
};

/**
 * Generates a sassy, supportive "Bestie" response.
 */
export const getBestieAdvice = async (userMessage: string): Promise<string> => {
  try {
    const client = getAIClient();
    if (!client) return "Bestie, you need to add your API Key in Settings (Gear Icon) first! 🔑";

    const response = await client.models.generateContent({
      model: GeminiModel.CHAT_BASIC,
      contents: userMessage,
      config: {
        systemInstruction: `You are Jiya's ultra-supportive, sassy, and intelligent best friend. 
        Jiya is an undergrad student aiming for a 9.5 CGPA, preparing for CAT to get into IIM, and believes in 'Lucky Girl Syndrome'.
        
        Your persona:
        - Use Gen-Z slang (slay, queen, period, manifesting).
        - Be strictly encouraging but realistic about hard work (the 'do it tired' mentality).
        - Keep responses short, punchy, and funny.
        - If she talks about stress, remind her she's an academic weapon.
        `,
      },
    });
    return response.text || "Bestie, the wifi is acting up, but you're still doing great!";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Oops! My crystal ball is foggy. Check your API Key or try again!";
  }
};

/**
 * Uses Gemini Pro with Thinking to create a study plan.
 */
export const generateStudyPlan = async (topic: string): Promise<string> => {
  try {
    const client = getAIClient();
    if (!client) return "Please add your API Key in Settings first! 🔑";

    const response = await client.models.generateContent({
      model: GeminiModel.STUDY_PLANNER,
      contents: `Create a concise, actionable study plan for Jiya regarding: ${topic}. 
      She is targeting CAT (IIM) and maintaining a 9.5 CGPA.
      Focus on efficiency. Output in Markdown.`,
      config: {
        thinkingConfig: { thinkingBudget: 2048 }, // Moderate thinking budget for planning
      },
    });
    return response.text || "Could not generate a plan right now.";
  } catch (error) {
    console.error("Gemini Study Plan Error:", error);
    return "Study session interrupted. Let's try that again.";
  }
};

/**
 * Generates an image for the vision board.
 */
export const generateManifestationImage = async (prompt: string): Promise<string | null> => {
  try {
    const client = getAIClient();
    if (!client) {
      alert("Please set your API Key in Settings first!");
      return null;
    }

    const response = await client.models.generateContent({
      model: GeminiModel.IMAGE_GEN,
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
};