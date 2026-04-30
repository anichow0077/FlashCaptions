import { GoogleGenAI, Type } from "@google/genai";

// Initialize AI lazily or safely to prevent crash if key is missing on static deploy
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. AI features will not work.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface CaptionResult {
  captions: string[];
}

export async function generateCaptions(
  fileBase64: string,
  mimeType: string,
  userPrompt: string = ""
): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("No API key found. Please set your GEMINI_API_KEY in the environment.");
  }

  const ai = getAI();
  const mediaPart = {
    inlineData: {
      mimeType,
      data: fileBase64.split(",")[1] || fileBase64,
    },
  };

  const textPart = {
    text: `Analyze this ${mimeType.startsWith("video") ? "video" : "photo"} and generate exactly 3 creative capturing options. 
    The user's additional context/language preference is: "${userPrompt || "Any language"}". 
    If a specific language is requested, provide captions in that language. 
    Format the output as a JSON array of 3 strings.`,
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [mediaPart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            captions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 3 caption options",
            },
          },
          required: ["captions"],
        },
      },
    });

    const result = JSON.parse(response.text || '{"captions": []}') as CaptionResult;
    return result.captions.slice(0, 3);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to generate captions. Please try a different file.");
  }
}
