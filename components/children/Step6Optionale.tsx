import { DollarSign, Plus, X } from 'lucide-react';

interface Step6Props {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const optionaleDisponibile = [
  { id: 'engleza', nume: 'Engleză', costDefault: 150, tip: 'lunar' },
  { id: 'dans', nume: 'Dans', costDefault: 30, tip: 'sedinta' },
  { id: 'karate', nume: 'Karate', costDefault: 200, tip: 'lunar' },
  { id: 'sah', nume: 'Șah', costDefault: 100, tip: 'lunar' },
  { id: 'logopedie', nume: 'Logopedie', costDefault: 50, tip: 'sedinta' },
  { id: 'educatie-financiara', nume: 'Educație Financiară', costDefault: 120, tip: 'lunar' }
];

export default function Step6Optionale({ formData, onChange }: Step6Props) {
  const optionale = formData.optionale || [];
  const altele = formData.alteleOptionale || [];

  const handleToggleOptional = (optional: any) => {
    const exists = optionale.find((o: any) => o.id === optional.id);
    
    if (exists) {
      // Remove
      onChange('optionale', optionale.filter((o: any) => o.id !== optional.id));
    } else {
      // Add
      onChange('optionale', [...optionale, {
        id: optional.id,
        nume: optional.nume,
        tip: optional.tip,
        cost: optional.costDefault,
        sedinte: optional.tip === 'sedinta' ? 8 : 0,
        activ: true
      }]);
    }
  };

  const handleUpdateOptional = (id: string, field: string, value: any) => {
    onChange('optionale', optionale.map((o: any) => 
      o.id === id ? { ...o, [field]: value } : o
    ));
  };

  const handleAddAltele = () => {
    onChange('alteleOptionale', [...altele, {
      id: `custom-${Date.now()}`,
      nume: '',
      tip: 'lunar',
      cost: 0,
      sedinte: 0
    }]);
  };

  const handleUpdateAltele = (id: string, field: string, value: any) => {
    onChange('alteleOptionale', altele.map((a: any) => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const handleRemoveAltele = (id: string) => {
    onChange('alteleOptionale', altele.filter((a: any) => a.id !== id));
  };

  const calculateTotal = () => {
    let total = formData.taxaMensualitate || 0;
    
    optionale.forEach((opt: any) => {
      if (opt.tip === 'lunar') {
        total += opt.cost;
      } else {
        total += opt.cost * opt.sedinte;
      }
    });

    altele.forEach((alt: any) => {
      if (alt.tip === 'lunar') {
        total += alt.cost;
      } else {
        total += alt.cost * alt.sedinte;
      }
    });

    return total;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Opționale și Costuri</h2>
        <p className="text-gray-600">Selectează opționalele pentru acest copil</p>
      </div>

      {/* Taxa Mensualizare */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Taxa Mensualizare (RON) *
        </label>
        <input
          type="number"
          value={formData.taxaMensualitate || 0}
          onChange={(e) => onChange('taxaMensualitate', parseFloat(e.target.value) || 0)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
          placeholder="800"
        />
      </div>

      {/* Opționale Disponibile */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Opționale Disponibile</h3>
        <div className="space-y-3">
          {optionaleDisponibile.map((optional) => {
            const isSelected = optionale.find((o: any) => o.id === optional.id);
            
            return (
              <div
                key={optional.id}
                className={`border-2 rounded-lg p-4 transition ${
                  isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={!!isSelected}
                    onChange={() => handleToggleOptional(optional)}
                    className="w-5 h-5 text-green-600 rounded"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{optional.nume}</p>
                    <p className="text-sm text-gray-600">
                      {optional.costDefault} RON / {optional.tip === 'lunar' ? 'lună' : 'ședință'}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="pl-8 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Cost (RON)
                      </label>
                      <input
                        type="number"
                        value={isSelected.cost}
                        onChange={(e) => handleUpdateOptional(optional.id, 'cost', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500"
                      />
                    </div>
                    {optional.tip === 'sedinta' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Ședințe/lună
                        </label>
                        <input
                          type="number"
                          value={isSelected.sedinte}
                          onChange={(e) => handleUpdateOptional(optional.id, 'sedinte', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Altele (Custom) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Altele (Opționale Custom)</h3>
          <button
            type="button"
            onClick={handleAddAltele}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            <Plus className="w-4 h-4" />
            Adaugă
          </button>
        </div>

        {altele.length > 0 && (
          <div className="space-y-3">
            {altele.map((alt: any) => (
              <div key={alt.id} className="border-2 border-purple-200 bg-purple-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nume Opțional
                    </label>
                    <input
                      type="text"
                      value={alt.nume}
                      onChange={(e) => handleUpdateAltele(alt.id, 'nume', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500"
                      placeholder="Ex: Pian, Pictură, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Tip
                    </label>
                    <select
                      value={alt.tip}
                      onChange={(e) => handleUpdateAltele(alt.id, 'tip', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500"
                    >
                      <option value="lunar">Lunar</option>
                      <option value="sedinta">Per Ședință</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Cost (RON)
                    </label>
                    <input
                      type="number"
                      value={alt.cost}
                      onChange={(e) => handleUpdateAltele(alt.id, 'cost', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500"
                    />
                  </div>
                </div>

                {alt.tip === 'sedinta' && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Ședințe/lună
                    </label>
                    <input
                      type="number"
                      value={alt.sedinte}
                      onChange={(e) => handleUpdateAltele(alt.id, 'sedinte', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveAltele(alt.id)}
                  className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
                >
                  <X className="w-4 h-4" />
                  Șterge
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total Lunar */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm mb-1">Total Lunar</p>
            <p className="text-4xl font-bold">{calculateTotal()} RON</p>
          </div>
          <DollarSign className="w-16 h-16 text-white/30" />
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/80">Mensualizare:</p>
              <p className="font-bold">{formData.taxaMensualitate || 0} RON</p>
            </div>
            <div>
              <p className="text-white/80">Opționale:</p>
              <p className="font-bold">{calculateTotal() - (formData.taxaMensualitate || 0)} RON</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
