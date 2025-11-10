import { Baby, Building } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Step1Props {
  formData: any;
  gradinite: any[];
  onChange: (field: string, value: any) => void;
}

export default function Step1GradinitaGrupa({ formData, gradinite, onChange }: Step1Props) {
  const [grupe, setGrupe] = useState<any[]>([]);

  // Când se selectează o grădiniță, încarcă grupele ei
  useEffect(() => {
    if (formData.gradinitaId) {
      const selectedGradinita = gradinite.find(g => g.id === formData.gradinitaId);
      if (selectedGradinita?.grupe) {
        setGrupe(selectedGradinita.grupe);
      } else {
        setGrupe([]);
      }
    } else {
      setGrupe([]);
    }
  }, [formData.gradinitaId, gradinite]);

  const programe = [
    { value: 'Normal', label: 'Normal (8:00-16:00)' },
    { value: 'Prelungit', label: 'Prelungit (7:00-18:00)' },
    { value: 'Săptămânal', label: 'Săptămânal (cu cazare)' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Baby className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Selectează Grădinița și Grupa</h2>
        <p className="text-gray-600">Alege grădinița și grupa în care va fi înscris copilul</p>
      </div>

      {/* Selectare Grădiniță */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Selectează Grădinița *
        </label>
        <div className="space-y-3">
          {gradinite.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              Nu ai grădinițe adăugate. Te rugăm să adaugi o grădiniță mai întâi.
            </div>
          ) : (
            gradinite.map((gradinita) => (
              <label
                key={gradinita.id}
                className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition ${
                  formData.gradinitaId === gradinita.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="gradinita"
                  value={gradinita.id}
                  checked={formData.gradinitaId === gradinita.id}
                  onChange={(e) => onChange('gradinitaId', e.target.value)}
                  className="w-5 h-5 text-blue-600"
                />
                <Building className="w-6 h-6 text-blue-600" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{gradinita.name}</p>
                  <p className="text-sm text-gray-600">{gradinita.address}</p>
                </div>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Selectare Grupă */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Selectează Grupa *
        </label>
        {!formData.gradinitaId ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
            Selectează mai întâi o grădiniță
          </div>
        ) : grupe.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            Această grădiniță nu are grupe create. Te rugăm să adaugi grupe mai întâi.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {grupe.map((grupa) => (
              <label
                key={grupa.id}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                  formData.grupa === grupa.nume
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="grupa"
                  value={grupa.nume}
                  checked={formData.grupa === grupa.nume}
                  onChange={(e) => onChange('grupa', e.target.value)}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-2xl">{grupa.emoji || '🎨'}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{grupa.nume}</p>
                  <p className="text-xs text-gray-600">{grupa.varsta}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Selectare Program */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Selectează Programul *
        </label>
        <div className="space-y-3">
          {programe.map((program) => (
            <label
              key={program.value}
              className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.program === program.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="program"
                  value={program.value}
                  checked={formData.program === program.value}
                  onChange={(e) => onChange('program', e.target.value)}
                  className="w-5 h-5 text-blue-600"
                />
                <p className="font-semibold text-gray-900">{program.label}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
