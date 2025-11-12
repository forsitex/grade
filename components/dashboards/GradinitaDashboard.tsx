import Link from 'next/link';
import { Building, Baby, Palette, Calendar, Users, Plus, TrendingUp, Activity, Utensils, DollarSign } from 'lucide-react';
import { getLocationDetailsUrl, getAddLocationUrl, getAddPersonUrl, getAddPersonLabel } from '@/lib/location-helpers';

interface GradinitaDashboardProps {
  locations: any[];
  onDelete: (id: string, name: string) => void;
}

export default function GradinitaDashboard({ locations, onDelete }: GradinitaDashboardProps) {
  const totalLocations = locations.length;
  const totalCapacity = locations.reduce((sum, loc) => sum + (loc.capacity || 0), 0);
  
  return (
    <div className="space-y-6">
      {/* Statistici Cards - 3D */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(37,99,235),0_13px_25px_rgba(37,99,235,0.4)] hover:shadow-[0_4px_0_rgb(37,99,235),0_8px_20px_rgba(37,99,235,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-blue-400">
          <div className="flex items-center justify-between mb-3">
            <Building className="w-10 h-10 text-white" />
            <span className="text-3xl font-bold text-white">{totalLocations}</span>
          </div>
          <h3 className="text-blue-100 text-xs font-semibold mb-1">Total Grădinițe</h3>
          <p className="text-sm text-blue-50">Active</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(236,72,153),0_13px_25px_rgba(236,72,153,0.4)] hover:shadow-[0_4px_0_rgb(236,72,153),0_8px_20px_rgba(236,72,153,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-pink-400">
          <div className="flex items-center justify-between mb-3">
            <Baby className="w-10 h-10 text-white" />
            <span className="text-3xl font-bold text-white">{totalCapacity}</span>
          </div>
          <h3 className="text-pink-100 text-xs font-semibold mb-1">Capacitate Totală</h3>
          <p className="text-sm text-pink-50">Locuri disponibile</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(22,163,74),0_13px_25px_rgba(22,163,74,0.4)] hover:shadow-[0_4px_0_rgb(22,163,74),0_8px_20px_rgba(22,163,74,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-green-400">
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-10 h-10 text-white" />
            <span className="text-3xl font-bold text-white">0</span>
          </div>
          <h3 className="text-green-100 text-xs font-semibold mb-1">Copii Înscriși</h3>
          <p className="text-sm text-green-50">Soon</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(147,51,234),0_13px_25px_rgba(147,51,234,0.4)] hover:shadow-[0_4px_0_rgb(147,51,234),0_8px_20px_rgba(147,51,234,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-purple-400">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-10 h-10 text-white" />
            <span className="text-3xl font-bold text-white">0%</span>
          </div>
          <h3 className="text-purple-100 text-xs font-semibold mb-1">Prezență Azi</h3>
          <p className="text-sm text-purple-50">Soon</p>
        </div>
      </div>

      {/* Acțiuni Rapide Globale - Butoane 3D */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          ⚡ Acțiuni Rapide Globale
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href={getAddLocationUrl('gradinita')}
            className="group relative"
          >
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-5 shadow-[0_6px_0_rgb(37,99,235),0_10px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_3px_0_rgb(37,99,235),0_6px_15px_rgba(37,99,235,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-blue-400">
              <div className="flex flex-col items-center gap-2">
                <Building className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-white text-center">Adaugă Grădiniță</span>
              </div>
            </div>
          </Link>
          <Link
            href="/reports/financial"
            className="group relative"
          >
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-5 shadow-[0_6px_0_rgb(22,163,74),0_10px_20px_rgba(22,163,74,0.4)] hover:shadow-[0_3px_0_rgb(22,163,74),0_6px_15px_rgba(22,163,74,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-green-400">
              <div className="flex flex-col items-center gap-2">
                <DollarSign className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-white text-center">Raport Financiar</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Lista Grădinițe */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Grădinițele Tale</h2>
          <Link
            href={getAddLocationUrl('gradinita')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Adaugă Grădiniță
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location, index) => (
            <div 
              key={`location-${location.id}-${index}`} 
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  Activ
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{location.name}</h3>
              <p className="text-gray-600 text-sm mb-1">{location.address}</p>
              <div className="space-y-1 mb-4">
                <p className="text-gray-500 text-xs">👶 Capacitate: {location.capacity || 0} copii</p>
                {location.numarGrupe && (
                  <p className="text-gray-500 text-xs">🎨 Grupe: {location.numarGrupe}</p>
                )}
                {location.program && (
                  <p className="text-gray-500 text-xs">🕐 Program: {location.program}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Link
                  href={getLocationDetailsUrl('gradinita', location.id)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-center font-semibold hover:bg-blue-700 transition"
                >
                  Vezi detalii
                </Link>
                <button
                  onClick={() => onDelete(location.id, location.name)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                  title="Șterge grădiniță"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
