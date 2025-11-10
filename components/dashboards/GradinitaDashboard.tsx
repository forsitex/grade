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
      {/* Statistici Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Grădinițe</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalLocations}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-pink-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Capacitate Totală</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalCapacity}</p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <Baby className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Copii Înscriși</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
              <p className="text-xs text-gray-500 mt-1">Soon</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Prezență Azi</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">0%</p>
              <p className="text-xs text-gray-500 mt-1">Soon</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Acțiuni Rapide Globale */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Acțiuni Rapide Globale</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={getAddLocationUrl('gradinita')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition flex items-center gap-3"
          >
            <Building className="w-6 h-6" />
            <span className="font-semibold">Adaugă Grădiniță Nouă</span>
          </Link>
          <Link
            href="/reports/financial"
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition flex items-center gap-3"
          >
            <DollarSign className="w-6 h-6" />
            <span className="font-semibold">Raport Financiar (Toate Grădinițele)</span>
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
