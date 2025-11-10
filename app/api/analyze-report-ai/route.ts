import { NextRequest, NextResponse } from 'next/server';
import { anthropic, checkAnthropicApiKey, CLAUDE_MODELS } from '@/lib/anthropic';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    checkAnthropicApiKey();
    console.log('🤖 API analyze-report-ai apelat');

    const body = await request.json();
    const { copil, perioada, prezenta, mese, somn, activitati } = body;

    if (!copil || !perioada) {
      return NextResponse.json({ error: 'Date lipsă' }, { status: 400 });
    }

    console.log('📊 Analizez raport pentru:', copil.nume);
    console.log('📅 Perioada:', perioada);

    // Construiește prompt-ul pentru Claude
    const prompt = `Ești un expert în dezvoltarea copiilor și psihologie infantilă.
Analizează următorul raport lunar pentru un copil de ${copil.varsta} ani și generează o analiză detaliată în limba română.

📊 RAPORT LUNAR - ${copil.nume}
Perioada: ${perioada}

📅 PREZENȚĂ:
- Zile prezent: ${prezenta.totalPresent || 0}
- Zile absent: ${prezenta.totalAbsent || 0}
- Procent prezență: ${prezenta.percentage || 0}%
- Total zile: ${prezenta.totalDays || 0}

🍽️ MESE:
- Mic Dejun: ${mese.micDejun?.good || 0}/${mese.micDejun?.total || 0} (${mese.micDejun?.total > 0 ? Math.round((mese.micDejun.good / mese.micDejun.total) * 100) : 0}% mâncat bine)
- Prânz: ${mese.pranz?.good || 0}/${mese.pranz?.total || 0} (${mese.pranz?.total > 0 ? Math.round((mese.pranz.good / mese.pranz.total) * 100) : 0}% mâncat bine)
- Gustări: ${mese.gustare?.good || 0}/${mese.gustare?.total || 0} (${mese.gustare?.total > 0 ? Math.round((mese.gustare.good / mese.gustare.total) * 100) : 0}% mâncat bine)

😴 SOMN:
- Zile odihnit: ${somn.odihnit || 0}
- Zile neodihnit: ${somn.neodihnit || 0}
- Total zile: ${somn.total || 0}
- Procent odihnit: ${somn.total > 0 ? Math.round((somn.odihnit / somn.total) * 100) : 0}%

🎨 ACTIVITĂȚI:
- Total activități: ${activitati.total || 0}
- Activități completate: ${activitati.completate || 0}

---

GENEREAZĂ O ANALIZĂ DETALIATĂ ÎN LIMBA ROMÂNĂ care include:

📊 **Rezumat General** (2-3 propoziții)
- Overview rapid și pozitiv despre luna aceasta

✅ **Puncte Forte** (3-5 puncte)
- Ce merge foarte bine
- Aspecte pozitive ale dezvoltării
- Comportamente de lăudat

⚠️ **Arii de Îmbunătățire** (2-3 puncte, DOAR dacă există probleme reale)
- Aspecte care necesită atenție
- Sugestii concrete de îmbunătățire
- Ton constructiv și pozitiv

🎨 **Activități și Participare**
- Cum participă copilul la activități
- Ce îi place să facă
- Beneficiile pentru dezvoltare

💡 **Sfaturi Practice pentru Părinți** (4-6 sfaturi)
- Recomandări concrete și aplicabile
- Sfaturi pentru acasă
- Cum să susțină dezvoltarea copilului
- Încurajări și validări

🌟 **Concluzie Pozitivă și Încurajatoare**
- Mesaj final optimist
- Felicitări pentru progres
- Încurajare pentru viitor

---

REGULI IMPORTANTE:
1. **Ton:** Prietenos, pozitiv, pe înțelesul părinților
2. **Limbaj:** Simplu, fără termeni tehnici
3. **Lungime:** 400-500 cuvinte
4. **Focus:** Pozitiv și constructiv
5. **Personalizat:** Folosește numele copilului (${copil.nume})
6. **Emoji:** Folosește emoji pentru a face textul mai prietenos
7. **Structură:** Folosește secțiunile de mai sus cu bold și emoji
8. **Comparații:** Dacă statisticile sunt bune (>80%), laudă! Dacă sunt sub 70%, oferă sfaturi blânde

IMPORTANT: Răspunde DOAR cu analiza în limba română, fără introduceri sau explicații suplimentare!`;

    console.log('🤖 Trimit la Claude...');

    // Apel Claude
    const claudeResponse = await anthropic.messages.create({
      model: CLAUDE_MODELS.SONNET_3_5,
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const analysis = claudeResponse.content[0].type === 'text' 
      ? claudeResponse.content[0].text 
      : '';

    console.log('✅ Analiză generată cu succes');
    console.log('📊 Tokens folosiți:', claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens);

    return NextResponse.json({
      success: true,
      analysis: analysis,
      metadata: {
        tokensUsed: claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens,
        model: CLAUDE_MODELS.SONNET_3_5,
        copil: copil.nume,
        perioada: perioada,
      }
    });

  } catch (error: any) {
    console.error('❌ Eroare în analyze-report-ai:', error);

    // Gestionare erori specifice Anthropic
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'API Key Anthropic invalid. Verifică configurația.' },
        { status: 401 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit depășit. Încearcă din nou în câteva secunde.' },
        { status: 429 }
      );
    }

    // Eroare generică
    return NextResponse.json(
      { 
        error: 'Eroare la analiza raportului',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
