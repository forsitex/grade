import { NextRequest, NextResponse } from 'next/server';
import { chatWithGroq, calculateGroqCost, isGroqConfigured, GROQ_MODELS } from '@/lib/groq';

export const runtime = 'nodejs';
export const maxDuration = 60;

function generateDayAnalysisPrompt(numarCopii: number, zi: string, menuText: string) {
  return `Analizează meniul pentru ${zi} și generează HTML pentru ${numarCopii} copii.

Structură HTML:

<h2 style="font-size:24px;font-weight:bold;text-align:center;margin:20px 0">📅 ${zi.toUpperCase()} - [DATA]</h2>

<h3 style="font-size:20px;font-weight:bold;color:#f97316;margin:20px 0 10px 0">🌅 Mic dejun (8:00-8:30)</h3>

<h4 style="font-size:16px;font-weight:bold;margin:15px 0 5px 0">[Nume preparat]</h4>
<p style="font-size:12px;font-style:italic;color:#6b7280;margin:0 0 10px 0">[ingrediente]</p>

<div style="display:grid;grid-template-columns:60% 40%;gap:20px;margin-bottom:20px">
  <div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr style="background:#f3f4f6">
        <th style="border:1px solid #d1d5db;padding:8px;text-align:left">Ingredient</th>
        <th style="border:1px solid #d1d5db;padding:8px;text-align:left">Cant/copil</th>
        <th style="border:1px solid #d1d5db;padding:8px;text-align:left">Total</th>
      </tr>
      <tr>
        <td style="border:1px solid #d1d5db;padding:8px">[ingredient]</td>
        <td style="border:1px solid #d1d5db;padding:8px">[cant]</td>
        <td style="border:1px solid #d1d5db;padding:8px">[total]</td>
      </tr>
    </table>
  </div>
  <div>
    <div style="background:#D1FAE5;border:2px solid #10B981;padding:12px;border-radius:8px;margin-bottom:8px;font-size:13px"><strong>Declarație nutrițională:</strong><br>Calorii: Xkcal, Proteine: Xg, Carbohidrați: Xg, Grăsimi: Xg, Fibre: Xg, Zaharuri: Xg, Sare: Xg</div>
    <div style="background:#FED7AA;border:2px solid #F59E0B;padding:12px;border-radius:8px;margin-bottom:8px;font-size:13px"><strong>Aditivi:</strong> [lista sau nu]</div>
    <div style="background:#FEE2E2;border:2px solid #EF4444;padding:12px;border-radius:8px;margin-bottom:8px;font-size:13px"><strong>Alergeni:</strong> [lista]</div>
    <div style="background:#DBEAFE;border:2px solid #3B82F6;padding:8px;border-radius:8px;font-size:13px"><strong>Congelate:</strong> [lista sau nu]</div>
  </div>
</div>

Repetă pentru toate cele 6 mese: Mic dejun, Gustare dimineață, Prânz, Prânz fel 2, Gustare, Seară.
Defalcă preparate în ingrediente cu cantități per copil + total ${numarCopii}.

Răspunde DOAR cu HTML, fără explicații, fără markdown.`;
}

export async function POST(request: NextRequest) {
  try {
    if (!isGroqConfigured()) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { zi, menuText, numarCopii } = body;

    if (!zi || !menuText) {
      return NextResponse.json(
        { error: 'Zi și menuText sunt obligatorii' },
        { status: 400 }
      );
    }

    const messages = [
      {
        role: 'system' as const,
        content: generateDayAnalysisPrompt(numarCopii || 20, zi, menuText)
      },
      {
        role: 'user' as const,
        content: `Generează HTML pentru ${zi}:\n\n${menuText}`
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
        { error: result.error || 'Eroare la analiza zilei' },
        { status: 500 }
      );
    }

    let htmlContent = result.content
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
      zi: zi,
      metadata: {
        numarCopii: numarCopii,
        tokensUsed: result.usage,
        cost: cost.toFixed(6),
        model: GROQ_MODELS.LLAMA_3_3_70B
      }
    });

  } catch (error: any) {
    console.error('Day Analysis Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
