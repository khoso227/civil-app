import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined. AI features may not work.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const MODELS = {
  text: "gemini-3-flash-preview",
  vision: "gemini-3-flash-preview",
  image: "gemini-2.5-flash-image",
};
