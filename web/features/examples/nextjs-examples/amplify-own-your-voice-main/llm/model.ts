import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { GOOGLE_API_KEY } from "@/lib/env";

export const getSingleAPIKey = () => {
  if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not set");
  }
  
  const keys = GOOGLE_API_KEY.split(",");
  const index = Math.floor(Math.random() * keys.length);
  const key = keys[index];

  return { key, index };
};

export const GeminiModel = () => {
  const { key, index } = getSingleAPIKey();
  const gemini = createGoogleGenerativeAI({
    apiKey: key,
  });

  const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
  const randomModel = models[Math.floor(Math.random() * models.length)];

  console.log(`[Gemini] Using API Key #${index} (${key.substring(0, 4)}...) | Model: ${randomModel}`);

  return gemini(randomModel);
};