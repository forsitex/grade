import { Users, Phone, Mail, MapPin, CreditCard } from 'lucide-react';

interface Step4Props {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export default function Step4Parinte2({ formData, onChange }: Step4Props) {
  const relatii = ['Tată', 'Mamă', 'Tutore legal', 'Bunic', 'Bunică', 'Altul'];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-10 h-10 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Date Părinte 2</h2>
        <p className="text-gray-600">Adaugă al doilea părinte (opțional)</p>
      </div>

      {/* Checkbox Adaugă Părinte 2 */}
      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.addParinte2}
            onChange={(e) => onChange('addParinte2', e.target.checked)}
            className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-200"
          />
          <div>
            <p className="font-semibold text-gray-900">Adaugă al doilea părinte</p>
            <p className="text-sm text-gray-600">Bifează dacă vrei să adaugi informații despre al doilea părinte</p>
          </div>
        </label>
      </div>

      {formData.addParinte2 && (
        <>
          {/* Nume Complet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nume Complet *
            </label>
            <input
              type="text"
              value={formData.parinte2Nume}
              onChange={(e) => onChange('parinte2Nume', e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition uppercase"
              placeholder="ex: POPESCU ION"
              required={formData.addParinte2}
            />
          </div>

          {/* CNP și Relație */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CNP *
              </label>
              <input
                type="text"
                value={formData.parinte2Cnp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').substring(0, 13);
                  onChange('parinte2Cnp', value);
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                placeholder="ex: 1800520123456"
                maxLength={13}
                required={formData.addParinte2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relație cu Copilul *
              </label>
              <select
                value={formData.parinte2Relatie}
                onChange={(e) => onChange('parinte2Relatie', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                required={formData.addParinte2}
              >
                {relatii.map(relatie => (
                  <option key={relatie} value={relatie}>{relatie}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Telefon și Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefon *
                </div>
              </label>
              <input
                type="tel"
                value={formData.parinte2Telefon}
                onChange={(e) => onChange('parinte2Telefon', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                placeholder="ex: 0721234568"
                required={formData.addParinte2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email *
                </div>
              </label>
              <input
                type="email"
                value={formData.parinte2Email}
                onChange={(e) => onChange('parinte2Email', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                placeholder="ex: ion.popescu@email.com"
                required={formData.addParinte2}
              />
            </div>
          </div>

          {/* Adresă */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Adresă (opțional)
              </div>
            </label>
            <input
              type="text"
              value={formData.parinte2Adresa}
              onChange={(e) => onChange('parinte2Adresa', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
              placeholder="Lasă gol dacă e aceeași cu a copilului"
            />
            <p className="mt-1 text-xs text-gray-500">
              Dacă adresa este diferită de cea a copilului, completează aici
            </p>
          </div>

          {/* CI (opțional) */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Carte de Identitate (opțional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serie CI
                </label>
                <input
                  type="text"
                  value={formData.parinte2CiSerie}
                  onChange={(e) => onChange('parinte2CiSerie', e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition uppercase"
                  placeholder="ex: RT"
                  maxLength={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Număr CI
                </label>
                <input
                  type="text"
                  value={formData.parinte2CiNumar}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').substring(0, 7);
                    onChange('parinte2CiNumar', value);
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                  placeholder="ex: 654321"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {!formData.addParinte2 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">
            Al doilea părinte nu a fost adăugat
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Poți adăuga aceste informații mai târziu dacă este necesar
          </p>
        </div>
      )}
    </div>
  );
}
