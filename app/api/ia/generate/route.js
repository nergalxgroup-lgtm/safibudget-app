import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../lib/jwt';

// POST /api/ia/generate
// Reçoit { messages, system?, max_tokens? } — le même format que les appels
// Anthropic d'origine côté front — et appelle Gemini avec la clé API côté serveur
// (jamais exposée au client). Renvoie { content: [{ type:'text', text:'...' }] }
// pour rester compatible avec le code de parsing déjà écrit côté front.
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

  const body = {
    contents,
    generationConfig: { maxOutputTokens: max_tokens || 1000 },
  };
  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('Gemini error', data);
      return NextResponse.json({ error: data.error?.message || 'Erreur Gemini' }, { status: 502 });
    }

    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';

    // Forme compatible avec ce qu'attendait le code front (data.content[0].text)
    return NextResponse.json({ content: [{ type: 'text', text }] });
  } catch (err) {
    console.error('IA proxy error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
