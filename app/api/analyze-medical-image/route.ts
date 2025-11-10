import { NextRequest, NextResponse } from 'next/server';
import { anthropic, checkAnthropicApiKey, CLAUDE_MODELS } from '@/lib/anthropic';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    checkAnthropicApiKey();
    console.log('🔬 API analyze-medical-image apelat');

    const body = await request.json();
    const { image, fileName, fileType, residentCnp } = body;

    if (!image) {
      return NextResponse.json({ error: 'Lipsește imaginea' }, { status: 400 });
    }

    console.log('📄 Fișier:', fileName);
    console.log('📋 Tip:', fileType);
    console.log('👤 Rezident CNP:', residentCnp);

    // Determinăm media type
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
    if (fileType.includes('png')) mediaType = 'image/png';
    else if (fileType.includes('gif')) mediaType = 'image/gif';
    else if (fileType.includes('webp')) mediaType = 'image/webp';

    console.log('🤖 Trimit la Claude Vision...');

    // Apel Claude Vision
    const claudeResponse = await anthropic.messages.create({
      model: CLAUDE_MODELS.SONNET_3_5,
      max_tokens: 2000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: image
              }
            },
            {
              type: 'text',
              text: `Analizează această imagine medicală FOARTE DETALIAT și oferă explicații complete.

🎯 STRUCTURĂ RĂSPUNS:

1. **TIP DOCUMENT:**
   - Ce fel de document este? (analize sânge, radiografie, ecografie, rețetă, etc.)

2. **DATE GENERALE:**
   - Nume pacient (dacă e vizibil)
   - Data documentului
   - Instituție medicală

3. **VALORI ANALIZE (dacă există):**
   Pentru FIECARE valoare găsită:
   - Nume analiză
   - Valoare găsită + unitate măsură
   - Interval normal de referință
   - Status: ✅ NORMAL sau ⚠️ ANORMAL

4. **EXPLICAȚII DETALIATE pentru valori ANORMALE:**
   Pentru fiecare valoare în afara limitelor normale:
   
   ⚠️ [NUME ANALIZĂ]: [VALOARE]
   
   📊 Ce înseamnă:
   - Explicație simplă ce reprezintă această analiză
   - De ce este importantă
   
   🚨 De ce e problematic:
   - Ce efecte are valoarea ridicată/scăzută
   - Ce riscuri aduce pentru organism
   - Simptome posibile
   
   💡 RECOMANDĂRI DETALIATE (FOARTE IMPORTANTE!):
   
   🍽️ ALIMENTAȚIE:
   - Ce alimente să CONSUME (specifice pentru această problemă)
   - Ce alimente să EVITE complet
   - Cantități recomandate și frecvență mese
   - Exemple de meniuri zilnice
   
   💊 SUPLIMENTE/TRATAMENT:
   - Ce suplimente pot ajuta
   - Când să ia medicamentele (dacă sunt prescrise)
   - Interacțiuni de evitat
   
   🏃 ACTIVITATE FIZICĂ:
   - Tip de exerciții recomandate
   - Durata și frecvența
   - Precauții
   
   💧 HIDRATARE:
   - Câtă apă să bea zilnic
   - Ce băuturi să evite
   
   😴 STIL DE VIAȚĂ:
   - Ore de somn necesare
   - Reducere stress
   - Alte schimbări importante
   
   📅 MONITORIZARE:
   - Cât de des să repete analizele
   - Ce simptome să urmărească
   - Când să meargă URGENT la medic
   
   🎯 OBIECTIVE CONCRETE:
   - Ce valori să atingă în 1 lună
   - Ce valori să atingă în 3 luni
   - Plan de acțiune pas cu pas

5. **DIAGNOSTIC (dacă există):**
   - Diagnostic menționat în document
   - Explicație în termeni simpli

6. **MEDICAMENTE (dacă există):**
   - Lista completă medicamente prescrise
   - Dozaj și frecvență
   - Pentru ce este fiecare medicament

7. **REZUMAT GENERAL:**
   - Starea generală a pacientului
   - Prioritate acțiuni (urgent/normal/monitorizare)
   - Ce trebuie să știe îngrijitorul

⚠️ IMPORTANT:
- Fii FOARTE PRECIS cu cifrele
- Explică TOTUL în limbaj simplu, accesibil
- Pentru fiecare valoare anormală, explică IMPACTUL asupra sănătății
- Dacă nu poți citi ceva, spune "Necitibil"
- NU inventa informații

📝 EXEMPLU RECOMANDĂRI COMPLETE (pentru glicemie ridicată):

💡 RECOMANDĂRI DETALIATE:

🍽️ ALIMENTAȚIE:
- CONSUME: legume verzi (spanac, broccoli), pește gras (somon, macrou), nuci, semințe, cereale integrale, fasole, linte
- EVITE: zahăr alb, dulciuri, sucuri, pâine albă, paste albe, cartofi prăjiți, fast-food
- Cantități: 5-6 mese mici pe zi, porții de 200-250g
- Exemplu meniu: Dimineață - ovăz cu nuci, Prânz - pește cu salată, Seară - supă de legume

💊 SUPLIMENTE/TRATAMENT:
- Crom (200mcg/zi) - ajută la reglarea glicemiei
- Magneziu (400mg/zi) - îmbunătățește sensibilitatea la insulină
- Vitamina D - dacă e deficit
- Medicația actuală (dacă există) - continuați conform prescripției

🏃 ACTIVITATE FIZICĂ:
- Plimbări zilnice 30 minute după masă
- Exerciții ușoare de rezistență 3x/săptămână
- Evitați efortul intens brusc

💧 HIDRATARE:
- 2-2.5 litri apă/zi
- EVITAȚI: sucuri, băuturi carbogazoase, alcool

😴 STIL DE VIAȚĂ:
- 7-8 ore somn/noapte
- Reducere stress (meditație, hobby-uri)
- Renunțare fumat (dacă fumează)

📅 MONITORIZARE:
- Glicemie: verificare săptămânală acasă
- Analize complete: peste 1 lună
- Simptome URGENTE: sete excesivă, vedere încețoșată, amețeli → MEDIC IMEDIAT

🎯 OBIECTIVE:
- 1 lună: glicemie sub 130 mg/dL
- 3 luni: glicemie 90-110 mg/dL (normal)
- Plan: Dietă strictă + activitate fizică + monitorizare`
            }
          ]
        }
      ]
    });

    const analysis = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '';
    
    console.log('✅ Analiză completă!');
    console.log('📊 Lungime răspuns:', analysis.length, 'caractere');

    // Aici ar trebui să salvezi în Firebase
    // TODO: Salvare în Firestore

    return NextResponse.json({
      success: true,
      analysis,
      fileName,
      residentCnp,
      analyzedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Eroare:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
