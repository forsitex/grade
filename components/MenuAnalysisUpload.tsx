'use client';

import { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Download, Save } from 'lucide-react';

interface MenuAnalysisUploadProps {
  onAnalysisComplete?: (analysis: any) => void;
  onSaveMenu?: (htmlContent: string, metadata: any) => void;
}

export default function MenuAnalysisUpload({ onAnalysisComplete, onSaveMenu }: MenuAnalysisUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [numarCopii, setNumarCopii] = useState<number>(20);
  const [progressiveHtml, setProgressiveHtml] = useState<string>('');
  const [currentDay, setCurrentDay] = useState<string>('');
  const [generatingDays, setGeneratingDays] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setAnalysis(null);
    }
  }

  async function handleAnalyze() {
    if (!file) {
      setError('Te rugăm să selectezi un fișier');
      return;
    }

    if (numarCopii < 1 || numarCopii > 200) {
      setError('Numărul de copii trebuie să fie între 1 și 200');
      return;
    }

    setGeneratingDays(true);
    setLoading(true);
    setError(null);
    setProgressiveHtml('');
    setAnalysis(null);

    try {
      const menuText = await file.text();
      const zile = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri'];
      
      let fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: system-ui; max-width: 1200px; margin: 0 auto; padding: 20px; }
            .day-card { margin-bottom: 30px; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; }
          </style>
        </head>
        <body>
          <h1>Meniu Săptămânal Grădiniță</h1>
          <p>Număr de copii: ${numarCopii}</p>
      `;
      
      let totalCost = 0;

      for (const zi of zile) {
        setCurrentDay(zi);
        
        const response = await fetch('/api/analyze-menu-day', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zi: zi,
            menuText: menuText,
            numarCopii: numarCopii
          })
        });

        const data = await response.json();

        if (data.success) {
          fullHtml += `<div class="day-card">${data.html}</div>`;
          setProgressiveHtml(fullHtml + '</body></html>');
          totalCost += parseFloat(data.metadata.cost || 0);
        } else {
          setError(`Eroare la generarea zilei ${zi}: ${data.error}`);
          break;
        }
      }

      fullHtml += '</body></html>';
      
      setAnalysis({
        html: fullHtml,
        metadata: {
          numarCopii: numarCopii,
          cost: totalCost.toFixed(6),
          model: 'llama-3.3-70b-versatile',
          analyzedAt: new Date().toISOString()
        }
      });

      if (onAnalysisComplete) {
        onAnalysisComplete({
          html: fullHtml,
          metadata: {
            numarCopii: numarCopii,
            cost: totalCost.toFixed(6),
            model: 'llama-3.3-70b-versatile'
          }
        });
      }

    } catch (err: any) {
      setError(err.message || 'Eroare de conexiune');
    } finally {
      setLoading(false);
      setGeneratingDays(false);
      setCurrentDay('');
    }
  }

  function exportToJSON() {
    if (!analysis) return;

    const dataStr = JSON.stringify(analysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analiza-meniu-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-6 h-6 text-blue-600" />
          Upload Meniu Săptămânal
        </h2>
        
        <div className="space-y-4">
          {/* Număr Copii */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              👶 Număr de copii în grădiniță:
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={numarCopii}
              onChange={(e) => setNumarCopii(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg font-semibold text-center"
              placeholder="Ex: 25"
            />
            <p className="text-sm text-gray-600 mt-2">
              AI-ul va calcula gramajele automat pentru {numarCopii} copii
            </p>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition">
            <input
              type="file"
              accept=".txt,.docx"
              onChange={handleFileChange}
              className="hidden"
              id="menu-file-upload"
            />
            <label
              htmlFor="menu-file-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <FileText className="w-16 h-16 text-gray-400" />
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  {file ? file.name : 'Selectează fișier'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Acceptăm .txt și .docx (fără gramaje)
                </p>
              </div>
            </label>
          </div>

          {file && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {generatingDays && currentDay ? (
                    <span>Generez {currentDay}...</span>
                  ) : (
                    <span>Analizez meniul cu AI...</span>
                  )}
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" />
                  Generează cu AI
                </>
              )}
            </button>
          )}

          {generatingDays && currentDay && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <p className="font-bold text-blue-900">Generare progresivă...</p>
                  <p className="text-sm text-blue-700">Se generează: {currentDay}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Progressive HTML Display */}
      {progressiveHtml && !analysis && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">🔄 Generare în curs...</h2>
                <p className="text-white/90">
                  Se generează: {currentDay}
                </p>
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-2xl shadow-xl p-6"
            dangerouslySetInnerHTML={{ __html: progressiveHtml }}
          />
        </div>
      )}

      {/* Analysis Results */}
      {analysis && analysis.html && (
        <div className="space-y-6">
          {/* Header cu Export */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">✅ Analiză Completă</h2>
                <p className="text-white/90">
                  Meniu pentru {analysis.metadata?.numarCopii || 0} copii
                </p>
              </div>
              {onSaveMenu && (
                <button
                  onClick={() => onSaveMenu(analysis.html, analysis.metadata)}
                  className="px-6 py-3 bg-white text-green-600 rounded-lg font-bold hover:bg-green-50 transition flex items-center gap-2 shadow-lg"
                >
                  <CheckCircle className="w-5 h-5" />
                  Salvează Meniu în Săptămână
                </button>
              )}
            </div>
          </div>

          {/* HTML Content */}
          <div 
            className="bg-white rounded-2xl shadow-xl p-6"
            dangerouslySetInnerHTML={{ __html: analysis.html }}
          />

          {/* Save Button at Bottom */}
          {onSaveMenu && (
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <button
                onClick={() => onSaveMenu(analysis.html, analysis.metadata)}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition shadow-lg flex items-center justify-center gap-3 mx-auto"
              >
                <Save className="w-6 h-6" />
                Salvează Meniu în Săptămână
              </button>
              <p className="text-sm text-gray-600 mt-3">
                Meniul va fi salvat în Firebase și va apărea în dashboard-ul Meniuri Săptămânale
              </p>
            </div>
          )}

          {/* Old sections - removed */}
          {false && analysis.rezumatSaptamanal && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">📊 Rezumat Săptămânal</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {analysis.rezumatSaptamanal.totalPreparate}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Preparate</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {analysis.rezumatSaptamanal.totalIngrediente}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Ingrediente</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">
                    {analysis.rezumatSaptamanal.totalAditivi}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Aditivi</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {analysis.rezumatSaptamanal.alergeniComuni?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Alergeni</p>
                </div>
              </div>

              {analysis.rezumatSaptamanal.recomandariFinal && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-2">💡 Recomandări:</h4>
                  <ul className="space-y-1">
                    {analysis.rezumatSaptamanal.recomandariFinal.map((rec: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-700">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Lista Preparate - REMOVED */}
          {false && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">🍽️ Preparate Detaliate</h3>
            <div className="space-y-6">
              {analysis.preparate?.map((preparat: any, idx: number) => (
                <div key={idx} className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition">
                  {/* Header Preparat */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">{preparat.nume}</h4>
                      <div className="flex gap-2 mt-1">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          {preparat.zi}
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                          {preparat.categorie}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ingrediente */}
                  <div className="mb-4">
                    <h5 className="font-bold text-gray-900 mb-2">📋 Ingrediente:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {preparat.ingrediente?.map((ing: any, i: number) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-2 text-sm">
                          <span className="font-semibold">{ing.nume}</span>
                          {ing.cantitate && <span className="text-gray-600"> - {ing.cantitate}</span>}
                          {ing.provenienta === 'congelat' && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              ❄️ Congelat
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Declarație Nutrițională */}
                  {preparat.declaratieNutritională && (
                    <div className="mb-4">
                      <h5 className="font-bold text-gray-900 mb-2">🥗 Declarație Nutrițională:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(preparat.declaratieNutritională).map(([key, value]: [string, any]) => (
                          <div key={key} className="bg-green-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-600 capitalize">{key}</p>
                            <p className="font-bold text-green-700">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Aditivi */}
                  {preparat.aditivi && preparat.aditivi.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-bold text-gray-900 mb-2">⚗️ Aditivi:</h5>
                      <div className="space-y-2">
                        {preparat.aditivi.map((aditiv: any, i: number) => (
                          <div key={i} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-bold text-orange-900">{aditiv.cod}</span>
                                <span className="text-gray-700 ml-2">{aditiv.nume}</span>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                aditiv.risc === 'scăzut' ? 'bg-green-100 text-green-700' :
                                aditiv.risc === 'mediu' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {aditiv.risc}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{aditiv.categorie}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alergeni */}
                  {preparat.alergeni && preparat.alergeni.length > 0 && (
                    <div>
                      <h5 className="font-bold text-gray-900 mb-2">⚠️ Alergeni:</h5>
                      <div className="flex flex-wrap gap-2">
                        {preparat.alergeni.map((alergen: any, i: number) => (
                          <div key={i} className="bg-red-50 border-2 border-red-200 rounded-lg px-3 py-2">
                            <p className="font-bold text-red-700">{alergen.nume}</p>
                            {alergen.descriere && (
                              <p className="text-xs text-red-600">{alergen.descriere}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      {preparat.alergeniPotentiali && preparat.alergeniPotentiali.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">Potențiali:</span>{' '}
                            {preparat.alergeniPotentiali.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
