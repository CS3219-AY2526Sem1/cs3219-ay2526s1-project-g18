import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// This file is just to test the Google Gemini API is working properly for you. 
// Please delete it once you have confirmed that it is working.
// You may follow a similar structure when you implement your actual AI service.

//import the env variables from the .env file
dotenv.config();

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

main();