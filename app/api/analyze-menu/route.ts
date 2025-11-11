import { NextRequest, NextResponse } from 'next/server';
import { chatWithGroq, calculateGroqCost, isGroqConfigured, GROQ_MODELS } from '@/lib/groq';
import PizZip from 'pizzip';

export const runtime = 'nodejs';
export const maxDuration = 60;

function generateMenuAnalysisPrompt(numarCopii: number) {
  return `Analizează meniul și generează HTML complet pentru ${numarCopii} copii.

CRITIC: Generează TOATE zilele (Luni-Vineri) cu TOATE mesele (6/zi). NU te opri!

HTML: Header + 5 zile (Luni-Vineri) + Footer

FIECARE ZI:
- Titlu: 📅 ZI - Data (24px bold)
- 6 mese: Mic dejun, Gustare dimineață, Prânz, Prânz fel 2, Gustare, Seară

FIECARE MASĂ:
- Titlu: 🌅 Masă ora (20px bold color)
- Pentru fiecare preparat:
  * Layout 2 coloane (60%-40%)
  * Stânga: Nume preparat (16px bold) + ingrediente italic (12px) + tabel (Ingredient|Cant/copil|Total)
  * Dreapta: 4 boxes:
    - Verde (#D1FAE5 bg, #10B981 border): Declarație nutrițională
    - Portocaliu (#FED7AA bg, #F59E0B border): Aditivi
    - Roșu (#FEE2E2 bg, #EF4444 border): Alergeni  
    - Albastru (#DBEAFE bg, #3B82F6 border): Congelate

CSS: Modern, responsive, system-ui font

REGULI:
- Defalcă preparate în ingrediente cu cantități (per copil + total ${numarCopii})
- Valori nutriționale per porție
- Identifică aditivi (E-uri), alergeni (lapte, ouă, gluten, etc), congelate

Răspunde DOAR cu HTML complet, fără markdown.`;
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const zip = new PizZip(buffer);
    const xml = zip.file('word/document.xml')?.asText();
    
    if (!xml) {
      throw new Error('Nu s-a putut extrage textul din document');
    }

    const text = xml
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  } catch (error) {
    throw new Error('Eroare la procesarea documentului DOCX');
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isGroqConfigured()) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const numarCopiiStr = formData.get('numarCopii') as string;
    const numarCopii = parseInt(numarCopiiStr) || 20;

    if (!file) {
      return NextResponse.json(
        { error: 'Fișierul este obligatoriu' },
        { status: 400 }
      );
    }

    if (numarCopii < 1 || numarCopii > 200) {
      return NextResponse.json(
        { error: 'Numărul de copii trebuie să fie între 1 și 200' },
        { status: 400 }
      );
    }

    const allowedTypes = [
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tip fișier invalid. Acceptăm doar .txt și .docx' },
        { status: 400 }
      );
    }

    let menuText = '';

    if (file.type === 'text/plain') {
      menuText = await file.text();
    } else {
      const buffer = Buffer.from(await file.arrayBuffer());
      menuText = await extractTextFromDocx(buffer);
    }

    if (menuText.length > 15000) {
      menuText = menuText.substring(0, 15000);
    }

    const messages = [
      {
        role: 'system' as const,
        content: generateMenuAnalysisPrompt(numarCopii)
      },
      {
        role: 'user' as const,
        content: `Analizează următorul meniu săptămânal și generează HTML-ul complet:\n\n${menuText}`
      }
    ];

    const result = await chatWithGroq(
      messages,
      GROQ_MODELS.LLAMA_3_3_70B,
      {
        temperature: 0.2,
        maxTokens: 8000
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Eroare la analiza meniului' },
        { status: 500 }
      );
    }

    let htmlContent = result.content;
    
    // Clean up markdown if present
    htmlContent = htmlContent
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const cost = result.usage
      ? calculateGroqCost(
          result.usage.prompt_tokens,
          result.usage.completion_tokens,
          GROQ_MODELS.LLAMA_3_3_70B
        )
      : 0;

    return NextResponse.json({
      success: true,
      html: htmlContent,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        numarCopii: numarCopii,
        tokensUsed: result.usage,
        cost: cost.toFixed(6),
        model: GROQ_MODELS.LLAMA_3_3_70B,
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Menu Analysis Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
