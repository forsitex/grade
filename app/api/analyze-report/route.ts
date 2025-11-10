import { NextRequest, NextResponse } from 'next/server';
import PizZip from 'pizzip';
import { openai, checkApiKey } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    // Verifică API key la runtime
    checkApiKey();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const organizationType = formData.get('organizationType') as string || 'camin';
    const userRequest = formData.get('userRequest') as string || '';

    if (!file) {
      return NextResponse.json(
        { error: 'Fișier lipsă' },
        { status: 400 }
      );
    }

    if (!userRequest.trim()) {
      return NextResponse.json(
        { error: 'Vă rugăm să specificați ce doriți să analizeze AI-ul' },
        { status: 400 }
      );
    }

    // Citește fișierul DOCX
    const arrayBuffer = await file.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    
    // Extrage textul din document.xml
    const documentXml = zip.file('word/document.xml')?.asText();
    
    if (!documentXml) {
      return NextResponse.json(
        { error: 'Nu s-a putut citi conținutul documentului' },
        { status: 400 }
      );
    }

    // Extrage textul din XML (elimină tag-urile)
    const textContent = documentXml
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Creează prompt-ul pentru GPT bazat pe tipul organizației și cerința utilizatorului
    const prompt = getAnalysisPrompt(organizationType, textContent, userRequest);

    // Analizează cu GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Ești un expert contabil și financiar care analizează rapoarte financiare și bilanțuri. Răspunde DOAR în format JSON valid, fără text suplimentar.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const analysisText = completion.choices[0].message.content || '{}';
    const analysis = JSON.parse(analysisText);

    return NextResponse.json({
      success: true,
      analysis: {
        summary: analysis.summary || 'Analiză completă a documentului financiar.',
        keyMetrics: analysis.keyMetrics || [],
        insights: analysis.insights || [],
        recommendations: analysis.recommendations || [],
      },
    });

  } catch (error) {
    console.error('Error analyzing report:', error);
    return NextResponse.json(
      { error: 'Eroare la procesarea raportului' },
      { status: 500 }
    );
  }
}

function getAnalysisPrompt(organizationType: string, textContent: string, userRequest: string): string {
  const industryContext = {
    camin: 'cămin de bătrâni',
    gradinita: 'grădiniță',
    spital: 'spital/clinică',
    hotel: 'hotel/pensiune',
  }[organizationType] || 'organizație';

  return `
Analizează următorul document financiar pentru o ${industryContext}.

DOCUMENT:
${textContent.substring(0, 15000)} ${textContent.length > 15000 ? '...(text trunchiat)' : ''}

CERINȚA UTILIZATORULUI:
${userRequest}

INSTRUCȚIUNI:
1. Răspunde EXACT la cerința utilizatorului de mai sus
2. Identifică și extrage toate valorile financiare menționate în cerință
3. Efectuează toate calculele solicitate de utilizator
4. Oferă informațiile în formatul cerut

RĂSPUNDE ÎN FORMAT JSON CU URMĂTOAREA STRUCTURĂ:
{
  "summary": "Rezumat care răspunde direct la cerința utilizatorului (2-3 propoziții)",
  "keyMetrics": [
    {
      "label": "Indicator solicitat de utilizator (ex: Profit Net, Marjă Profit, etc.)",
      "value": "Valoare calculată cu unitate (ex: 1.250.000 RON, 15.5%)",
      "trend": "up/down/neutral (dacă este relevant)"
    }
  ],
  "insights": [
    "Observație relevantă pentru cerința utilizatorului",
    "Analiză detaliată a datelor solicitate",
    "Context și interpretare a rezultatelor"
  ],
  "recommendations": [
    "Recomandare bazată pe analiza efectuată",
    "Acțiune concretă pentru îmbunătățire",
    "Sugestie pentru optimizare"
  ]
}

REGULI IMPORTANTE:
- PRIORITATE MAXIMĂ: Răspunde EXACT la cerința utilizatorului
- Extrage și calculează DOAR informațiile solicitate în cerință
- Pentru keyMetrics, include TOȚI indicatorii menționați în cerința utilizatorului
- Dacă utilizatorul cere calcule (ex: profit net, marjă), efectuează-le și explică formula
- Pentru insights, analizează datele în contextul cererii utilizatorului
- Pentru recommendations, oferă sugestii relevante pentru cerința specificată
- Toate valorile financiare în RON (lei) sau procente unde e cazul
- Dacă lipsesc date pentru cerința utilizatorului, menționează explicit în summary
- Folosește terminologie specifică pentru ${industryContext}

EXEMPLU DE CERINȚĂ ȘI RĂSPUNS:
Cerință: "Calculează profitul net și marja de profit. Identifică cele mai mari 3 cheltuieli."
Răspuns keyMetrics: 
- "Profit Net": "125.000 RON" (Venituri 500.000 - Cheltuieli 375.000)
- "Marjă de Profit": "25%" (Profit Net / Venituri × 100)
- "Cheltuială #1 - Salarii": "200.000 RON"
- "Cheltuială #2 - Utilități": "100.000 RON"
- "Cheltuială #3 - Materiale": "75.000 RON"

RĂSPUNDE DOAR CU JSON-ul, FĂRĂ TEXT SUPLIMENTAR!
`;
}
