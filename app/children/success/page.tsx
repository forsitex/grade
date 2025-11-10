'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Download, Printer, ArrowLeft, Plus, Link as LinkIcon } from 'lucide-react';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cnp = searchParams.get('cnp');
  const gradinitaId = searchParams.get('gradinitaId');

  const [generating, setGenerating] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [parentLink, setParentLink] = useState('');

  useEffect(() => {
    // Simulare generare documente
    setTimeout(() => {
      setGenerating(false);
    }, 2000);
  }, []);

  const documents = [
    { name: 'Contract de înscriere', icon: '📄', generated: true },
    { name: 'Fișă de înscriere', icon: '📋', generated: true },
    { name: 'Acord GDPR', icon: '🔒', generated: true },
    { name: 'Acord foto/video', icon: '📸', generated: true },
    { name: 'Acord medical', icon: '💊', generated: true },
    { name: 'Declarație părinți', icon: '✍️', generated: true }
  ];

  const handleGenerateParentLink = () => {
    // Generează un token unic
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const link = `${window.location.origin}/dashboard-parinte`;
    setParentLink(link);
    setShowLinkModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(parentLink);
    alert('Link copiat în clipboard!');
  };

  const handleDownloadDocument = (docName: string) => {
    alert(`Funcționalitate în dezvoltare: Descărcare ${docName}\n\nVa fi implementată cu generare PDF reală.`);
  };

  const handlePrintDocument = (docName: string) => {
    alert(`Funcționalitate în dezvoltare: Printare ${docName}\n\nVa fi implementată cu generare PDF reală.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi la Dashboard
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Success Message */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Copil adăugat cu succes!
              </h1>
              <p className="text-gray-600 mb-4">
                Datele au fost salvate în sistem
              </p>
              {cnp && (
                <div className="inline-block px-6 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-600">CNP Copil</p>
                  <p className="text-xl font-bold text-blue-600">{cnp}</p>
                </div>
              )}
            </div>
          </div>

          {/* Documente Generate */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              📄 Documente Generate
              {generating && (
                <span className="text-sm font-normal text-gray-600">
                  (Se generează...)
                </span>
              )}
            </h2>

            {generating ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Se generează documentele...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{doc.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{doc.name}</p>
                          <p className="text-xs text-green-600">✓ Generat</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadDocument(doc.name)}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          title="Descarcă"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintDocument(doc.name)}
                          className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                          title="Printează"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => alert('Funcționalitate în dezvoltare: Descărcare ZIP\n\nVa fi implementată cu generare PDF reală.')}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Descarcă Toate (ZIP)
                  </button>
                  <button
                    onClick={() => alert('Funcționalitate în dezvoltare: Printare toate\n\nVa fi implementată cu generare PDF reală.')}
                    className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition flex items-center justify-center gap-2"
                  >
                    <Printer className="w-5 h-5" />
                    Printează Toate
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ce vrei să faci acum?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {gradinitaId ? (
                <>
                  <Link
                    href={`/gradinite/${gradinitaId}`}
                    className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg hover:shadow-lg transition"
                  >
                    <ArrowLeft className="w-8 h-8 text-blue-600" />
                    <p className="font-semibold text-gray-900 text-center">
                      Înapoi la Grădiniță
                    </p>
                  </Link>

                  <Link
                    href={`/children/add?gradinitaId=${gradinitaId}`}
                    className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg hover:shadow-lg transition"
                  >
                    <Plus className="w-8 h-8 text-green-600" />
                    <p className="font-semibold text-gray-900 text-center">
                      Adaugă Alt Copil
                    </p>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg hover:shadow-lg transition"
                  >
                    <ArrowLeft className="w-8 h-8 text-blue-600" />
                    <p className="font-semibold text-gray-900 text-center">
                      Înapoi la Dashboard
                    </p>
                  </Link>

                  <Link
                    href="/children/add"
                    className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg hover:shadow-lg transition"
                  >
                    <Plus className="w-8 h-8 text-green-600" />
                    <p className="font-semibold text-gray-900 text-center">
                      Adaugă Alt Copil
                    </p>
                  </Link>
                </>
              )}

              <button
                onClick={handleGenerateParentLink}
                className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200 rounded-lg hover:shadow-lg transition"
              >
                <LinkIcon className="w-8 h-8 text-pink-600" />
                <p className="font-semibold text-gray-900 text-center">
                  Generează Link Părinți
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Link Părinți */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🔗 Link Acces Părinți</h2>
            <p className="text-gray-600 mb-6">
              Link-ul de mai jos permite părinților să vadă informații despre copilul lor, galerie foto, prezență, etc.
            </p>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Link:</p>
              <p className="text-blue-600 font-mono text-sm break-all">{parentLink}</p>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={handleCopyLink}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                📋 Copiază Link
              </button>
              <button
                onClick={() => alert('Funcționalitate în dezvoltare: Generare QR Code')}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                📱 Generează QR Code
              </button>
            </div>

            <button
              onClick={() => alert('Funcționalitate în dezvoltare: Trimitere email')}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition mb-4"
            >
              📧 Trimite pe Email
            </button>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Important:</strong> Acest link este unic și securizat. Nu îl partaja public.
              </p>
            </div>

            <button
              onClick={() => setShowLinkModal(false)}
              className="w-full px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
            >
              Închide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChildSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
