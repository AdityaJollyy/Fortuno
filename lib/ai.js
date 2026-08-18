import OpenAI from "openai";

// Gemini speaks the OpenAI wire format at this endpoint, so the official
// OpenAI SDK works unchanged and swapping providers means changing a URL.
export const ai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const AI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
