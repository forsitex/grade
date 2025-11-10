/**
 * API Route: Analiză Contract cu OpenAI
 * 
 * POST /api/analyze-contract
 * 
 * Primește un PDF în Base64 și returnează câmpurile detectate de AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { openai, MODELS, checkApiKey } from '@/lib/openai';
import { 
  AnalyzeContractRequest, 
  ContractAnalysisResponse,
  ANALYSIS_PROMPTS 
} from '@/types/template';

export async function POST(request: NextRequest) {
  try {
    // Verifică API key la runtime
    checkApiKey();

    // 1. Parse request body
    const body: AnalyzeContractRequest = await request.json();
    const { pdfBase64, organizationType, templateName } = body;

    // 2. Validări
    if (!pdfBase64) {
      return NextResponse.json(
        { error: 'PDF Base64 lipsește' },
        { status: 400 }
      );
    }

    if (!organizationType) {
      return NextResponse.json(
        { error: 'Tipul organizației lipsește' },
        { status: 400 }
      );
    }

    // 3. Convertim Base64 → Buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    
    // 4. Extragem doar primele 5000 bytes ca text aproximativ
    // (suficient pentru a detecta structura câmpurilor)
    const pdfText = pdfBuffer.toString('binary', 0, Math.min(pdfBuffer.length, 5000))
      .replace(/[^\x20-\x7E\n]/g, ' ') // Curățăm caractere non-printabile
      .substring(0, 3000); // Limităm la 3000 caractere
    
    // 5. Obține prompt-ul specific pentru tipul de organizație
    const prompt = ANALYSIS_PROMPTS[organizationType] || ANALYSIS_PROMPTS.camin;

    console.log('🤖 Trimitere la OpenAI pentru analiză text...');

    // 6. Apel către OpenAI GPT-4o (text-only pentru detectare câmpuri)
    const response = await openai.chat.completions.create({
      model: MODELS.GPT_4O,
      messages: [
        {
          role: 'user',
          content: `${prompt}

Analizează următorul text extras din PDF și detectează toate câmpurile care trebuie completate:

${pdfText}

Răspunde DOAR cu JSON valid în formatul:
\`\`\`json
{
  "fields": [
    {
      "name": "nume_camp",
      "label": "Label vizibil",
      "type": "text|number|date|select",
      "required": true|false,
      "page": 1,
      "options": ["opțiune1", "opțiune2"]
    }
  ],
  "totalPages": 1,
  "confidence": 0.95,
  "notes": ["Observații opționale"]
}\`\`\`
`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    // 5. Parse răspunsul
    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error('OpenAI nu a returnat un răspuns');
    }

    console.log('✅ Răspuns primit de la OpenAI');
    console.log('📊 Tokens folosiți:', response.usage?.total_tokens);

    // 6. Extrage JSON din răspuns (poate conține text înainte/după)
    let analysisResult: ContractAnalysisResponse;
    
    try {
      let cleanContent = content;
      
      // Curăță markdown code blocks (```json ... ```)
      if (cleanContent.includes('```json')) {
        cleanContent = cleanContent.replace(/```json\s*/g, '');
        cleanContent = cleanContent.replace(/```\s*/g, '');
      } else if (cleanContent.includes('```')) {
        cleanContent = cleanContent.replace(/```\s*/g, '');
      }
      
      // Extrage doar JSON-ul (între { și })
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        analysisResult = JSON.parse(cleanContent);
      }
      
      console.log('✅ JSON parsat cu succes');
    } catch (parseError) {
      console.error('❌ Eroare la parsarea JSON:', parseError);
      console.error('📄 Răspuns OpenAI:', content);
      
      return NextResponse.json(
        { 
          error: 'Răspunsul AI nu este în format JSON valid',
          rawResponse: content 
        },
        { status: 500 }
      );
    }

    // 7. Validare rezultat
    if (!analysisResult.fields || !Array.isArray(analysisResult.fields)) {
      return NextResponse.json(
        { error: 'Răspunsul AI nu conține câmpuri valide' },
        { status: 500 }
      );
    }

    console.log('✨ Analiză completă!');
    console.log('📝 Câmpuri detectate:', analysisResult.fields.length);

    // 8. Returnează rezultatul
    return NextResponse.json({
      success: true,
      data: analysisResult,
      metadata: {
        tokensUsed: response.usage?.total_tokens,
        model: MODELS.GPT_4O,
        organizationType,
        templateName,
        analyzedAt: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('❌ Eroare în analyze-contract:', error);

    // Gestionare erori specifice OpenAI
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'API Key OpenAI invalid. Verifică configurația.' },
        { status: 401 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit depășit. Încearcă din nou în câteva secunde.' },
        { status: 429 }
      );
    }

    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'Credit OpenAI epuizat. Adaugă credit în contul tău.' },
        { status: 402 }
      );
    }

    // Eroare generică
    return NextResponse.json(
      { 
        error: 'Eroare la analiza contractului',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
