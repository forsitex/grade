import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Mesajul este obligatoriu' },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      console.error('GROQ_API_KEY nu este setat în variabilele de mediu');
      return NextResponse.json(
        { error: 'Configurare API incompletă' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Ești un asistent AI pentru educatoare de grădiniță. Îmbunătățește mesajele pentru a fi mai empatice, profesionale și corecte gramatical. Păstrează sensul original. Răspunde DOAR cu mesajul îmbunătățit, fără explicații.'
          },
          {
            role: 'user',
            content: `Îmbunătățește acest mesaj:\n\n${message.trim()}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Eroare Groq API:', errorData);
      return NextResponse.json(
        { error: 'Eroare la apelul Groq API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const improvedText = data.choices[0]?.message?.content?.trim();

    if (!improvedText) {
      return NextResponse.json(
        { error: 'Răspuns invalid de la AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ improvedMessage: improvedText });

  } catch (error) {
    console.error('Eroare server:', error);
    return NextResponse.json(
      { error: 'Eroare internă server' },
      { status: 500 }
    );
  }
}
