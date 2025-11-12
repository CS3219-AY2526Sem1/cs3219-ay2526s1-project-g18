import { convertToModelMessages, streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export async function POST(req: Request) {
  try {
    let { messages } = await req.json();
    messages = convertToModelMessages(messages);
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return new Response('API key not configured', { status: 500 });
    }

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: 'You are a helpful assistant named PeerPrep AI that helps users prepare for coding interviews by answering questions, providing explanations, and offering coding examples. Always respond in a concise and clear manner.',
      messages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response('Internal server error', { status: 500 });
  }
}