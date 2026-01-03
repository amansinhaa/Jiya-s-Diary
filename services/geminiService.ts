import { GoogleGenAI } from "@google/genai";
import { GeminiModel } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Please check your environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates a sassy, supportive "Bestie" response.
 */
export const getBestieAdvice = async (userMessage: string): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) return "Bestie, the API key is missing! Check your settings.";

    const response = await ai.models.generateContent({
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
    return "Oops! My crystal ball is foggy. Try again later!";
  }
};

/**
 * Uses Gemini Pro with Thinking to create a study plan.
 */
export const generateStudyPlan = async (topic: string): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) return "Cannot generate plan: API Key missing.";

    const response = await ai.models.generateContent({
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
    const ai = getAiClient();
    if (!ai) {
      alert("API Key is missing!");
      return null;
    }

    const response = await ai.models.generateContent({
      model: GeminiModel.IMAGE_GEN,
      contents: {
        parts: [
          { text: prompt }
        ]
      },
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