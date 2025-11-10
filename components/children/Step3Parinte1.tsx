import { User, Phone, Mail, MapPin, CreditCard, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface Step3Props {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export default function Step3Parinte1({ formData, onChange }: Step3Props) {
  const relatii = ['Mamă', 'Tată', 'Tutore legal', 'Bunic', 'Bunică', 'Altul'];
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Date Părinte 1</h2>
        <p className="text-gray-600">Completează informațiile despre primul părinte (obligatoriu)</p>
      </div>

      {/* Nume Complet */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nume Complet *
        </label>
        <input
          type="text"
          value={formData.parinte1Nume || ''}
          onChange={(e) => onChange('parinte1Nume', e.target.value.toUpperCase())}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition uppercase"
          placeholder="ex: POPESCU MARIA"
          required
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
            value={formData.parinte1Cnp || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').substring(0, 13);
              onChange('parinte1Cnp', value);
            }}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
            placeholder="ex: 2850610123456"
            maxLength={13}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Relație cu Copilul *
          </label>
          <select
            value={formData.parinte1Relatie || 'Mamă'}
            onChange={(e) => onChange('parinte1Relatie', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
            required
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
              Telefon * <span className="text-xs text-green-600 font-semibold">(Principal)</span>
            </div>
          </label>
          <input
            type="tel"
            value={formData.parinte1Telefon || ''}
            onChange={(e) => onChange('parinte1Telefon', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
            placeholder="ex: 0721234567"
            required
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
            value={formData.parinte1Email || ''}
            onChange={(e) => onChange('parinte1Email', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
            placeholder="ex: maria.popescu@email.com"
            required
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
          value={formData.parinte1Adresa || ''}
          onChange={(e) => onChange('parinte1Adresa', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
          placeholder="Lasă gol dacă e aceeași cu a copilului"
        />
        <p className="mt-1 text-xs text-gray-500">
          Dacă adresa este diferită de cea a copilului, completează aici
        </p>
      </div>

      {/* Parolă pentru Portal Părinți */}
      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-2 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          🔐 Acces Portal Părinți
        </h3>
        <p className="text-sm text-purple-700 mb-4">
          Părintele va primi acces la portal pentru a vedea activitățile, prezența și pozele copilului
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parolă (opțional - se generează automat dacă lipsește)
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.parinte1Parola || ''}
              onChange={(e) => onChange('parinte1Parola', e.target.value)}
              className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
              placeholder="Lasă gol pentru generare automată (min. 6 caractere)"
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            💡 Dacă lași gol, se va genera o parolă de 6 caractere automat
          </p>
        </div>
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
              value={formData.parinte1CiSerie || ''}
              onChange={(e) => onChange('parinte1CiSerie', e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition uppercase"
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
              value={formData.parinte1CiNumar || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').substring(0, 7);
                onChange('parinte1CiNumar', value);
              }}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
              placeholder="ex: 123456"
              maxLength={7}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
