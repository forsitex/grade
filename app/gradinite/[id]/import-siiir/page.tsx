'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Users, Loader2, Trash2 } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, getDocs, updateDoc, collection, writeBatch } from 'firebase/firestore';
import { parseSIIIRExcel } from '@/utils/siiirParser';
import { createGrupeFromSIIIR, getGrupeLipsa } from '@/utils/grupaDetector';

export default function ImportSIIIRPage() {
  const router = useRouter();
  const params = useParams();
  const gradinitaId = params.id as string;

  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  const handleDeleteAllChildren = async () => {
    if (!confirm('⚠️ ATENȚIE! Vrei să ștergi TOȚI copiii din baza de date? Această acțiune NU poate fi anulată!')) {
      return;
    }

    setDeleting(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      // Încarcă toți copiii
      const childrenRef = collection(db, 'organizations', user.uid, 'locations', gradinitaId, 'children');
      const childrenSnap = await getDocs(childrenRef);

      // Șterge în batch
      const batch = writeBatch(db);
      childrenSnap.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      alert(`✅ ${childrenSnap.size} copii șterși cu succes!`);
      
    } catch (error: any) {
      console.error('Eroare ștergere:', error);
      alert(`❌ Eroare: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setPreview(null);
    setResult(null);

    try {
      // Parse fișier pentru preview
      const parsed = await parseSIIIRExcel(uploadedFile);
      setPreview({
        totalCopii: parsed.copii.length,
        grupeUnice: parsed.grupeUnice,
        primiiCopii: parsed.copii.slice(0, 5),
        errors: parsed.errors
      });
    } catch (error: any) {
      alert(`Eroare citire fișier: ${error.message}`);
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      // Parse fișier complet
      const parsed = await parseSIIIRExcel(file);

      // Încarcă grădinița
      const gradinitaRef = doc(db, 'organizations', user.uid, 'locations', gradinitaId);
      const gradinitaSnap = await getDoc(gradinitaRef);

      if (!gradinitaSnap.exists()) {
        throw new Error('Grădinița nu a fost găsită');
      }

      const gradinitaData = gradinitaSnap.data();
      const grupeExistente = gradinitaData.grupe || [];

      // Verifică ce grupe trebuie create
      const grupeLipsa = getGrupeLipsa(parsed.grupeUnice, grupeExistente);
      const grupeNoi = createGrupeFromSIIIR(grupeLipsa);

      // Update grupe în Firebase (dacă sunt grupe noi)
      if (grupeNoi.length > 0) {
        await updateDoc(gradinitaRef, {
          grupe: [...grupeExistente, ...grupeNoi]
        });
      }

      // Verifică duplicate CNP
      const childrenRef = collection(db, 'organizations', user.uid, 'locations', gradinitaId, 'children');
      const childrenSnap = await getDocs(childrenRef);
      const existingCNPs = new Set(
        childrenSnap.docs.map((doc: any) => doc.id)
      );

      // Filtrează copii noi (skip duplicate)
      const copiiNoi = parsed.copii.filter(copil => !existingCNPs.has(copil.cnp));
      const copiiDuplicate = parsed.copii.filter(copil => existingCNPs.has(copil.cnp));

      // Import copii în Firebase (batch write)
      const batch = writeBatch(db);

      copiiNoi.forEach(copil => {
        const copilRef = doc(db, 'organizations', user.uid, 'locations', gradinitaId, 'children', copil.cnp);
        batch.set(copilRef, copil);
      });

      await batch.commit();

      // Rezultat
      setResult({
        success: true,
        totalImportat: copiiNoi.length,
        totalDuplicate: copiiDuplicate.length,
        grupeNoi: grupeNoi.length,
        grupeCreate: grupeNoi.map(g => g.nume),
        errors: parsed.errors
      });

    } catch (error: any) {
      console.error('Eroare import:', error);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Import Listă SIIIR
            </h1>
            <p className="text-gray-600 mt-1">
              Importă copiii din fișierul exportat din SIIIR
            </p>
          </div>
        </div>

        {/* Buton Ștergere Copii */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-red-900 mb-1">⚠️ Zonă Periculoasă</h3>
              <p className="text-sm text-red-700">Șterge toți copiii din baza de date (pentru re-import)</p>
            </div>
            <button
              onClick={handleDeleteAllChildren}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Se șterge...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Șterge Toți Copiii
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instrucțiuni */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Cum exportezi din SIIIR:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Deschide <strong>SIIIR</strong> în alt tab browser</li>
            <li>Login cu contul grădiniței</li>
            <li>Modul <strong>"Elevi"</strong> → <strong>"Listă elevi"</strong></li>
            <li>Click <strong>"Export"</strong> sau <strong>"Salvează"</strong></li>
            <li>Descarcă fișierul <code className="bg-blue-100 px-2 py-1 rounded">.xls</code></li>
            <li>Revino aici și upload fișierul</li>
          </ol>
        </div>

        {/* Upload Zone - Colorat și Vizibil */}
        {!result && (
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl shadow-2xl p-8 mb-6 border-2 border-blue-200">
            <input
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={importing}
            />
            <label
              htmlFor="file-upload"
              className={`border-4 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all block ${
                file
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-[0_8px_0_rgb(34,197,94),0_12px_24px_rgba(34,197,94,0.3)] hover:shadow-[0_4px_0_rgb(34,197,94),0_8px_20px_rgba(34,197,94,0.4)]'
                  : 'border-blue-400 bg-gradient-to-br from-blue-100 to-purple-100 shadow-[0_8px_0_rgb(59,130,246),0_12px_24px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_0_rgb(59,130,246),0_8px_20px_rgba(59,130,246,0.4)] hover:border-purple-500'
              }`}
            >
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                file ? 'bg-green-500' : 'bg-gradient-to-br from-blue-500 to-purple-600'
              } shadow-lg`}>
                <FileSpreadsheet className="w-10 h-10 text-white" />
              </div>
              {file ? (
                <div>
                  <p className="text-2xl font-bold text-green-600 mb-2">✓ {file.name}</p>
                  <p className="text-sm text-green-700 font-semibold">Click pentru a schimba fișierul</p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3">
                    📁 Click pentru a selecta fișier Excel
                  </p>
                  <p className="text-lg font-semibold text-blue-700 mb-2">Exportat din SIIIR</p>
                  <p className="text-sm text-gray-600 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">
                    Acceptă: .xls, .xlsx
                  </p>
                </div>
              )}
            </label>
          </div>
        )}

        {/* Preview */}
        {preview && !result && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Preview Date
            </h3>

            {/* Statistici */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 mb-1">Total Copii</p>
                <p className="text-2xl font-bold text-purple-900">{preview.totalCopii}</p>
              </div>
              <div className="bg-pink-50 rounded-lg p-4">
                <p className="text-sm text-pink-600 mb-1">Grupe</p>
                <p className="text-2xl font-bold text-pink-900">{preview.grupeUnice.length}</p>
              </div>
            </div>

            {/* Grupe */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Grupe găsite:</p>
              <div className="flex flex-wrap gap-2">
                {preview.grupeUnice.map((grupa: string) => (
                  <span key={grupa} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {grupa}
                  </span>
                ))}
              </div>
            </div>

            {/* Primii copii */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Primii 5 copii:</p>
              <div className="space-y-2">
                {preview.primiiCopii.map((copil: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{copil.nume} {copil.prenume}</p>
                      <p className="text-sm text-gray-600">CNP: {copil.cnp}</p>
                    </div>
                    <span className="text-sm text-purple-600">{copil.grupa}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Erori */}
            {preview.errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Avertizări ({preview.errors.length} rânduri cu probleme):
                </p>
                <div className="text-xs text-yellow-700 max-h-32 overflow-y-auto">
                  {preview.errors.slice(0, 5).map((err: any, idx: number) => (
                    <p key={idx}>• Rând {err.row}: {err.message}</p>
                  ))}
                  {preview.errors.length > 5 && (
                    <p className="mt-1 font-semibold">... și încă {preview.errors.length - 5} erori</p>
                  )}
                </div>
                <p className="text-xs text-yellow-600 mt-2">
                  Rândurile cu erori vor fi ignorate. Copiii valizi vor fi importați.
                </p>
              </div>
            )}

            {/* Buton Import - Colorat și Vizibil */}
            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white py-6 rounded-2xl font-bold text-xl shadow-[0_8px_0_rgb(34,197,94),0_12px_24px_rgba(34,197,94,0.4)] hover:shadow-[0_4px_0_rgb(34,197,94),0_8px_20px_rgba(34,197,94,0.5)] hover:translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border-2 border-green-400"
            >
              {importing ? (
                <>
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <span>Se importă...</span>
                </>
              ) : (
                <>
                  <Upload className="w-7 h-7" />
                  <span>🚀 Confirmă Import</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Rezultat */}
        {result && (
          <div className={`rounded-xl shadow-lg p-8 text-center ${
            result.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
          }`}>
            {result.success ? (
              <>
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <h3 className="text-2xl font-bold text-green-900 mb-4">
                  ✅ Import Finalizat cu Succes!
                </h3>
                <div className="space-y-3 text-left max-w-md mx-auto">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Copii importați:</p>
                    <p className="text-3xl font-bold text-green-600">{result.totalImportat}</p>
                  </div>
                  {result.totalDuplicate > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-sm text-yellow-700">Copii duplicate (ignorați):</p>
                      <p className="text-2xl font-bold text-yellow-600">{result.totalDuplicate}</p>
                    </div>
                  )}
                  {result.grupeNoi > 0 && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-700 mb-2">Grupe create automat:</p>
                      <p className="text-xl font-bold text-purple-600 mb-2">{result.grupeNoi}</p>
                      <div className="flex flex-wrap gap-2">
                        {result.grupeCreate.map((grupa: string) => (
                          <span key={grupa} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            {grupa}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 justify-center mt-6">
                  <button
                    onClick={() => router.push(`/gradinite/${gradinitaId}`)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Înapoi la Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      setResult(null);
                    }}
                    className="px-6 py-3 bg-white text-green-600 border-2 border-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                  >
                    Import Nou
                  </button>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
                <h3 className="text-2xl font-bold text-red-900 mb-4">
                  ❌ Eroare Import
                </h3>
                <p className="text-red-700 mb-6">{result.error}</p>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setResult(null);
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Încearcă Din Nou
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
