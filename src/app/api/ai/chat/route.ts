import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Only available on the server. Do NOT expose this via NEXT_PUBLIC.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('[api/ai/chat] No Gemini API key configured. Set GEMINI_API_KEY in the environment.');
}

export const runtime = 'nodejs';
export const preferredRegion = ['iad1', 'sfo1', 'fra1'];

interface ChatHistoryItem { role: 'user' | 'model'; content: string; }

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Server not configured with AI key.' }), { status: 500 });
    }

    const { message, history }: { message: string; history?: ChatHistoryItem[] } = await req.json();
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message required.' }), { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build content array: convert history into gemini format.
    const contents = [
      ...(history || []).filter(h => h.content).map(h => ({ role: h.role, parts: [{ text: h.content }] })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const result = await model.generateContent({
      contents,
      systemInstruction: 'You are a specialized financial assistant. ONLY answer questions about the user\'s financial data context. Politely decline unrelated topics.'
    });

    const text = result.response?.text() || '';
    return new Response(JSON.stringify({ text }), { status: 200 });
  } catch (err: any) {
    console.error('[api/ai/chat] Error:', err);
    return new Response(JSON.stringify({ error: 'Generation failed.' }), { status: 500 });
  }
}
