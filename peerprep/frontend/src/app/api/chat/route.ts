import { convertToModelMessages, ModelMessage, streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export async function POST(req: Request) {
  try {
    let { messages } = await req.json();
 
    const latestMessage = messages[messages.length - 1];
    const metadata = latestMessage?.metadata;

    const questionContext = metadata?.questionContext;
    const codeContext = metadata?.codeContext;

    let promptMessages: ModelMessage[] = convertToModelMessages(messages);

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return new Response('API key not configured', { status: 500 });
    }
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const instructions = `
    You are a limited AI chatbot for Peerprep, a practice app that allows two users to answer a coding interview question together.
    - The app provides a collaborative workspace where the users write pseudo-code together, and that's where they can give you prompts.
    - Provide a succinct response based on the given question and code contexts. The code provided is pseudo-code.
    - Do not give suggested answers to the question. If the user asks, give them a hint instead.
    - Do not give actual code or pseudo-code.
    - The purpose of the chatbot is to provide hints and clarification, not to answer the question for the users.
    - The users are allowed only 3 freeform prompts (implementation not handled by you), so give small hints even if you cannot answer fully/properly.
    - The users are allowed unlimited predetermined prompts: "Provide a brief explanation of the code." and "Provide a brief explanation of the question."
    - If there is a technical error that prevents you from answering properly, please politely respond that the Peerprep AI is currently unavailable.`;
    
    const combinedInstructions = `
    Context to be used for this response:
    - Question: ${questionContext}
    - Currently written code (Psuedo-code): ${codeContext}

    Instructions for persona:
    ${instructions}
    `.trim();

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: combinedInstructions,
      messages: promptMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response('Internal server error', { status: 500 });
  }
}