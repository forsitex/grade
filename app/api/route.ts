import { NextRequest, NextResponse } from 'next/server';
import { openai, checkApiKey } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    // Verifică API key la runtime
    checkApiKey();
    const { ingredients, organizationType } = await request.json();

    if (!ingredients?.trim()) {
      return NextResponse.json(
        { error: 'Cerere lipsă' },
        { status: 400 }
      );
    }

    const prompt = getMenuPrompt(ingredients, organizationType);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Ești un nutriționist expert și chef profesionist care creează meniuri personalizate și echilibrate. Răspunde DOAR în format JSON valid, fără text suplimentar.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content || '{}';
    const result = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      menus: result.menus || [],
    });

  } catch (error) {
    console.error('Error generating menu:', error);
    return NextResponse.json(
      { error: 'Eroare la generarea meniurilor' },
      { status: 500 }
    );
  }
}

function getMenuPrompt(userRequest: string, organizationType: string): string {
  const context = {
    camin: 'cămin de bătrâni',
    gradinita: 'grădiniță',
    spital: 'spital/clinică',
    hotel: 'hotel/pensiune',
  }[organizationType] || 'organizație';

  // Extrage numărul de porții din cerere (default: 1)
  const portionsMatch = userRequest.match(/(\d+)\s*(?:portii|porții|persoane)/i);
  const portions = portionsMatch ? parseInt(portionsMatch[1]) : 1;

  return `
Ești un nutriționist expert și chef profesionist pentru o ${context}.

CEREREA UTILIZATORULUI:
${userRequest}

NUMĂR PORȚII DETECTAT: ${portions} porții

INSTRUCȚIUNI:
1. Analizează cererea utilizatorului și identifică:
   - Ce tipuri de meniuri dorește (normal, diabet, hiposodat, vârstnici, cu carne, etc.)
   - Ce ingrediente are disponibile
   - Orice cerințe speciale (nivel proteine, calorii, restricții dietetice)

2. Creează meniuri complete (mic dejun, prânz, cină) pentru FIECARE tip solicitat

3. Folosește DOAR ingredientele menționate în cerere

4. **IMPORTANT: La masa de PRÂNZ trebuie să incluzi OBLIGATORIU o ciorbă/supă ca preparat principal sau suplimentar**

CERINȚE GENERALE PENTRU MENIURI:

1. **MENIU NORMAL** - Pentru persoane sănătoase
   - Echilibrat în macronutrienți
   - Calorii: 1800-2200 pe zi
   - Proteine: 60-80g pe zi
   - Variat și gustos

2. **MENIU DIABET** - Pentru persoane cu diabet
   - Indice glicemic scăzut
   - Carbohidrați complecși, evită zahărul
   - Calorii: 1600-2000 pe zi
   - Proteine: 70-90g pe zi
   - Fibre: minim 30g pe zi

3. **MENIU HIPOSODAT** - Pentru persoane cu hipertensiune
   - Conținut redus de sodiu (sub 2000mg/zi)
   - Evită sarea adăugată
   - Bogat în potasiu și magneziu
   - Calorii: 1800-2200 pe zi

4. **MENIU VÂRSTNIC** - Optimizat pentru persoane în vârstă
   - Ușor de mestecat și digerat
   - Bogat în calciu, vitamina D, B12
   - Proteine: 80-100g pe zi (pentru menținerea masei musculare)
   - Calorii: 1600-1900 pe zi
   - Hidratare adecvată

5. **MENIU CARNE - 3 VARIANTE** cu niveluri diferite de proteine:
   
   a) **Proteine MICI** (40-50g proteine/zi)
   - Pentru persoane cu activitate redusă
   - Porții mici de carne
   - Calorii: 1500-1700 pe zi
   
   b) **Proteine MEDII** (70-90g proteine/zi)
   - Pentru persoane cu activitate moderată
   - Porții standard de carne
   - Calorii: 1900-2200 pe zi
   
   c) **Proteine MARI** (100-130g proteine/zi)
   - Pentru persoane active sau în recuperare
   - Porții generoase de carne
   - Calorii: 2200-2600 pe zi

RĂSPUNDE ÎN FORMAT JSON CU URMĂTOAREA STRUCTURĂ EXACTĂ:

{
  "menus": [
    {
      "type": "normal",
      "label": "Meniu Normal",
      "color": "#10b981",
      "bgColor": "bg-green-100",
      "description": "Meniu echilibrat pentru persoane sănătoase",
      "micDejun": {
        "name": "Nume preparat",
        "ingredients": ["ingredient1", "ingredient2", "ingredient3"],
        "ingredientsWithQuantities": [
          { "name": "ingredient1", "quantity": "500g" },
          { "name": "ingredient2", "quantity": "300ml" },
          { "name": "ingredient3", "quantity": "200g" }
        ],
        "calories": 400,
        "protein": 20,
        "carbs": 45,
        "fat": 12,
        "preparation": "Mod de preparare scurt (2-3 propoziții)"
      },
      "pranz": {
        "name": "Nume preparat",
        "ingredients": ["ingredient1", "ingredient2", "ingredient3"],
        "ingredientsWithQuantities": [
          { "name": "ingredient1", "quantity": "800g" },
          { "name": "ingredient2", "quantity": "400g" },
          { "name": "ingredient3", "quantity": "300g" }
        ],
        "calories": 600,
        "protein": 35,
        "carbs": 60,
        "fat": 18,
        "preparation": "Mod de preparare scurt"
      },
      "cina": {
        "name": "Nume preparat",
        "ingredients": ["ingredient1", "ingredient2", "ingredient3"],
        "ingredientsWithQuantities": [
          { "name": "ingredient1", "quantity": "600g" },
          { "name": "ingredient2", "quantity": "350g" },
          { "name": "ingredient3", "quantity": "250g" }
        ],
        "calories": 500,
        "protein": 25,
        "carbs": 50,
        "fat": 15,
        "preparation": "Mod de preparare scurt"
      }
    },
    {
      "type": "diabet",
      "label": "Meniu Diabet",
      "color": "#ef4444",
      "bgColor": "bg-red-100",
      "description": "Meniu cu indice glicemic scăzut pentru diabetici",
      "micDejun": { ... },
      "pranz": { ... },
      "cina": { ... }
    },
    {
      "type": "hiposodat",
      "label": "Meniu Hiposodat",
      "color": "#3b82f6",
      "bgColor": "bg-blue-100",
      "description": "Meniu cu conținut redus de sodiu",
      "micDejun": { ... },
      "pranz": { ... },
      "cina": { ... }
    },
    {
      "type": "varstnic",
      "label": "Meniu Vârstnici",
      "color": "#8b5cf6",
      "bgColor": "bg-purple-100",
      "description": "Meniu optimizat pentru nutriție senior",
      "micDejun": { ... },
      "pranz": { ... },
      "cina": { ... }
    },
    {
      "type": "carne",
      "label": "Meniu Carne - Proteine Mici",
      "color": "#f97316",
      "bgColor": "bg-orange-100",
      "description": "Meniu cu carne - nivel proteine mic",
      "proteinLevel": "mic",
      "micDejun": { ... },
      "pranz": { ... },
      "cina": { ... }
    },
    {
      "type": "carne",
      "label": "Meniu Carne - Proteine Medii",
      "color": "#f97316",
      "bgColor": "bg-orange-100",
      "description": "Meniu cu carne - nivel proteine mediu",
      "proteinLevel": "mediu",
      "micDejun": { ... },
      "pranz": { ... },
      "cina": { ... }
    },
    {
      "type": "carne",
      "label": "Meniu Carne - Proteine Mari",
      "color": "#f97316",
      "bgColor": "bg-orange-100",
      "description": "Meniu cu carne - nivel proteine mare",
      "proteinLevel": "mare",
      "micDejun": { ... },
      "pranz": { ... },
      "cina": { ... }
    }
  ]
}

REGULI IMPORTANTE:

1. **Folosește DOAR ingredientele din lista disponibilă**
2. **Fiecare meniu trebuie să aibă 3 mese complete**: mic dejun, prânz, cină
3. **Calculează corect caloriile și macronutrienții** pentru fiecare masă
4. **Respectă restricțiile dietetice** pentru fiecare tip de meniu
5. **FOARTE IMPORTANT: Calculează cantitățile EXACTE pentru ${portions} porții**
   - Fiecare ingredient trebuie să aibă cantitatea specificată (ex: "500g", "300ml", "2 bucăți")
   - Cantitățile trebuie să fie realiste și scalate corect pentru numărul de porții
   - Include TOATE ingredientele cu cantități în array-ul "ingredientsWithQuantities"
6. **Preparatele trebuie să fie realiste și ușor de realizat**
7. **Variază preparatele** între diferitele tipuri de meniu
8. **Pentru meniul carne**, asigură-te că diferențiezi clar cantitățile de proteine
9. **Modul de preparare** trebuie să fie concis (max 3 propoziții)
10. **Ingredientele** trebuie listate exact ca în lista disponibilă
11. **Totalul caloriilor pe zi** trebuie să respecte intervalele specificate

EXEMPLU DE PREPARAT PENTRU ${portions} PORȚII:
{
  "name": "Omletă cu legume și pâine integrală",
  "ingredients": ["ouă", "roșii", "ceapă", "pâine integrală", "ulei de măsline"],
  "ingredientsWithQuantities": [
    { "name": "ouă", "quantity": "${portions * 40}g (${portions * 2} ouă)" },
    { "name": "roșii", "quantity": "${portions * 100}g" },
    { "name": "ceapă", "quantity": "${portions * 50}g" },
    { "name": "pâine integrală", "quantity": "${portions * 60}g (${portions * 2} felii)" },
    { "name": "ulei de măsline", "quantity": "${portions * 10}ml" }
  ],
  "calories": 380,
  "protein": 22,
  "carbs": 35,
  "fat": 14,
  "preparation": "Bate 2 ouă cu puțină apă. Călește ceapa și roșiile tăiate cubulețe. Toarnă ouăle peste legume și gătește la foc mic. Servește cu pâine integrală prăjită."
}

RĂSPUNDE DOAR CU JSON-ul, FĂRĂ TEXT SUPLIMENTAR!
`;
}
