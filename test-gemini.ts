import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function runLocalTest() {
  console.log("Testing Gemini API locally...");
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents:
        'Respond with a valid JSON: {"test": "success", "message": "Gemini is working locally!"}',
      config: {
        responseMimeType: "application/json",
      },
    });

    console.log("Result from Gemini:");
    console.log(response.text);
  } catch (error: any) {
    console.error("Gemini Test Error:", error?.message || error);
  }
}

runLocalTest();
