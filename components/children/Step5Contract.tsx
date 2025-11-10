import { FileText, Calendar, DollarSign, Utensils } from 'lucide-react';

interface Step5Props {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export default function Step5Contract({ formData, onChange }: Step5Props) {
  const handleMeseChange = (meal: string, checked: boolean) => {
    onChange('meseIncluse', {
      ...formData.meseIncluse,
      [meal]: checked
    });
  };

  const costPerProgram = {
    'Normal': 800,
    'Prelungit': 1000,
    'Săptămânal': 1500
  };

  const costSuggested = costPerProgram[formData.program as keyof typeof costPerProgram] || 800;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Date Contract</h2>
        <p className="text-gray-600">Completează detaliile contractului de înscriere</p>
      </div>

      {/* Data Început */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Data Început Contract *
          </div>
        </label>
        <input
          type="date"
          value={formData.dataInceput}
          onChange={(e) => onChange('dataInceput', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
          required
        />
      </div>

      {/* Durată Contract */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Durată Contract *
        </label>
        <div className="space-y-3">
          <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
            formData.durata === 'nedeterminata'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}>
            <input
              type="radio"
              name="durata"
              value="nedeterminata"
              checked={formData.durata === 'nedeterminata'}
              onChange={(e) => onChange('durata', e.target.value)}
              className="w-5 h-5 text-blue-600"
            />
            <div>
              <p className="font-semibold text-gray-900">Nedeterminată</p>
              <p className="text-sm text-gray-600">Contractul nu are dată de sfârșit</p>
            </div>
          </label>

          <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
            formData.durata === 'determinata'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}>
            <input
              type="radio"
              name="durata"
              value="determinata"
              checked={formData.durata === 'determinata'}
              onChange={(e) => onChange('durata', e.target.value)}
              className="w-5 h-5 text-blue-600"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Determinată</p>
              <p className="text-sm text-gray-600 mb-2">Specifică data de sfârșit</p>
              {formData.durata === 'determinata' && (
                <input
                  type="date"
                  value={formData.dataSfarsit}
                  onChange={(e) => onChange('dataSfarsit', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                  required
                />
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Cost Lunar */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Cost Lunar (RON) *
          </div>
        </label>
        <div className="relative">
          <input
            type="number"
            value={formData.costLunar}
            onChange={(e) => onChange('costLunar', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            placeholder={`ex: ${costSuggested}`}
            min="0"
            step="10"
            required
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
            RON/lună
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          💡 Cost sugerat pentru program {formData.program}: <span className="font-semibold text-blue-600">{costSuggested} RON/lună</span>
        </p>
      </div>

      {/* Tip Abonament */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tip Abonament *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {['Normal', 'Prelungit', 'Săptămânal'].map((tip) => (
            <label
              key={tip}
              className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.tipAbonament === tip
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <input
                type="radio"
                name="tipAbonament"
                value={tip}
                checked={formData.tipAbonament === tip}
                onChange={(e) => onChange('tipAbonament', e.target.value)}
                className="w-5 h-5 text-blue-600"
              />
              <span className="font-medium text-gray-900">{tip}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Mese Incluse */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            Mese Incluse *
          </div>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className={`flex items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition ${
            formData.meseIncluse.micDejun
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}>
            <input
              type="checkbox"
              checked={formData.meseIncluse.micDejun}
              onChange={(e) => handleMeseChange('micDejun', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <div>
              <p className="font-medium text-gray-900">🥐 Mic dejun</p>
            </div>
          </label>

          <label className={`flex items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition ${
            formData.meseIncluse.pranz
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}>
            <input
              type="checkbox"
              checked={formData.meseIncluse.pranz}
              onChange={(e) => handleMeseChange('pranz', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <div>
              <p className="font-medium text-gray-900">🍽️ Prânz</p>
            </div>
          </label>

          <label className={`flex items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition ${
            formData.meseIncluse.gustare
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}>
            <input
              type="checkbox"
              checked={formData.meseIncluse.gustare}
              onChange={(e) => handleMeseChange('gustare', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <div>
              <p className="font-medium text-gray-900">🍎 Gustare</p>
            </div>
          </label>

          <label className={`flex items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition ${
            formData.meseIncluse.cina
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          } ${formData.tipAbonament !== 'Săptămânal' ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              checked={formData.meseIncluse.cina}
              onChange={(e) => handleMeseChange('cina', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
              disabled={formData.tipAbonament !== 'Săptămânal'}
            />
            <div>
              <p className="font-medium text-gray-900">🌙 Cină</p>
              {formData.tipAbonament !== 'Săptămânal' && (
                <p className="text-xs text-gray-500">Doar săptămânal</p>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Rezumat */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Rezumat Contract</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Data început:</span>
            <span className="font-semibold text-gray-900">
              {formData.dataInceput || 'Nu este setată'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Durată:</span>
            <span className="font-semibold text-gray-900">
              {formData.durata === 'nedeterminata' ? 'Nedeterminată' : `Până la ${formData.dataSfarsit || '...'}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Program:</span>
            <span className="font-semibold text-gray-900">{formData.program}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tip abonament:</span>
            <span className="font-semibold text-gray-900">{formData.tipAbonament}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="text-gray-600">Cost lunar:</span>
            <span className="font-bold text-blue-600 text-lg">
              {formData.costLunar || '0'} RON/lună
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Mese incluse:</span>
            <span className="font-semibold text-gray-900">
              {Object.entries(formData.meseIncluse)
                .filter(([_, value]) => value)
                .map(([key]) => {
                  const labels: any = {
                    micDejun: 'Mic dejun',
                    pranz: 'Prânz',
                    gustare: 'Gustare',
                    cina: 'Cină'
                  };
                  return labels[key];
                })
                .join(', ') || 'Nicio masă selectată'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
