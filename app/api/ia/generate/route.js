import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getUserIdFromRequest } from '../../../../lib/jwt';

// POST /api/ia/generate
// Reçoit { messages, system?, max_tokens? } — le même format que les appels
// Anthropic d'origine côté front — et appelle Gemini avec la clé API côté serveur
// (jamais exposée au client), via le SDK officiel (compatible avec les nouvelles
// clés au format "AQ." comme avec l'ancien format "AIzaSy").
// Renvoie { content: [{ type:'text', text:'...' }] } pour rester compatible avec
// le code de parsing déjà écrit côté front.

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { messages, system, max_tokens } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages manquant' }, { status: 400 });
  }

  // Anthropic utilise 'user'/'assistant' ; Gemini utilise 'user'/'model'.
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  try {
    const config = { maxOutputTokens: max_tokens || 1000 };
    if (system) config.systemInstruction = system;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config,
    });

    const text = response.text || '';

    // Forme compatible avec ce qu'attendait le code front (data.content[0].text)
    return NextResponse.json({ content: [{ type: 'text', text }] });
  } catch (err) {
    console.error('IA proxy error', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 502 });
  }
}
