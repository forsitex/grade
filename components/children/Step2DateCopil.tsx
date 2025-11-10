import { Baby, Calendar, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Step2Props {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export default function Step2DateCopil({ formData, onChange }: Step2Props) {
  const [cnpError, setCnpError] = useState('');

  // Validare și extragere dată naștere din CNP
  useEffect(() => {
    if (formData.cnp.length === 13) {
      const primaCifra = parseInt(formData.cnp[0]);
      const an = parseInt(formData.cnp.substring(1, 3));
      const luna = parseInt(formData.cnp.substring(3, 5));
      const zi = parseInt(formData.cnp.substring(5, 7));

      // Validare lună și zi
      if (luna < 1 || luna > 12 || zi < 1 || zi > 31) {
        setCnpError('CNP invalid: lună sau zi incorectă');
        return;
      }

      // Calculare an complet
      let anNastere = an;
      if (primaCifra === 1 || primaCifra === 2) {
        anNastere += 1900;
      } else if (primaCifra === 5 || primaCifra === 6) {
        anNastere += 2000;
      } else {
        setCnpError('CNP invalid: prima cifră trebuie să fie 1, 2, 5 sau 6');
        return;
      }

      // Formatare dată
      const dataNasterii = `${anNastere}-${luna.toString().padStart(2, '0')}-${zi.toString().padStart(2, '0')}`;
      onChange('dataNasterii', dataNasterii);
      setCnpError('');
    } else if (formData.cnp.length > 0) {
      setCnpError('CNP-ul trebuie să aibă exact 13 cifre');
    } else {
      setCnpError('');
      onChange('dataNasterii', '');
    }
  }, [formData.cnp]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Baby className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Date Copil</h2>
        <p className="text-gray-600">Completează informațiile despre copil</p>
      </div>

      {/* Nume Complet */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nume Complet *
        </label>
        <input
          type="text"
          value={formData.nume}
          onChange={(e) => onChange('nume', e.target.value.toUpperCase())}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition uppercase"
          placeholder="ex: POPESCU ANDREI"
          required
        />
      </div>

      {/* CNP */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CNP *
        </label>
        <input
          type="text"
          value={formData.cnp}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').substring(0, 13);
            onChange('cnp', value);
          }}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 transition ${
            cnpError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
          }`}
          placeholder="ex: 5230415123456"
          maxLength={13}
          required
        />
        {cnpError && (
          <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            {cnpError}
          </div>
        )}
        {formData.cnp.length === 13 && !cnpError && (
          <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
            <Calendar className="w-4 h-4" />
            CNP valid - Data nașterii: {formData.dataNasterii}
          </div>
        )}
      </div>

      {/* Data Nașterii (auto-completată) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Data Nașterii (auto-completată din CNP)
        </label>
        <input
          type="date"
          value={formData.dataNasterii}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
          disabled
        />
      </div>

      {/* Adresă */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Adresă Completă *
        </label>
        <input
          type="text"
          value={formData.adresa}
          onChange={(e) => onChange('adresa', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
          placeholder="ex: Strada Primăverii nr. 5, București, Sector 2"
          required
        />
      </div>

      {/* Alergii Alimentare */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Alergii Alimentare (opțional)
        </label>
        <textarea
          value={formData.alergii}
          onChange={(e) => onChange('alergii', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
          placeholder="ex: Alergic la nuci, lactate, ou"
          rows={2}
        />
        <p className="mt-1 text-xs text-gray-500">
          Specifică orice alergii alimentare pentru a genera meniu adaptat
        </p>
      </div>

      {/* Condiții Medicale */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Condiții Medicale (opțional)
        </label>
        <textarea
          value={formData.conditiiMedicale}
          onChange={(e) => onChange('conditiiMedicale', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
          placeholder="ex: Astm ușor, necesită inhalator"
          rows={2}
        />
      </div>

      {/* Foto Copil */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Foto Copil (opțional)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // TODO: Upload la Firebase Storage
                console.log('Upload foto:', file);
              }
            }}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 transition"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Formatul acceptat: JPG, PNG (max 5MB)
        </p>
      </div>
    </div>
  );
}
