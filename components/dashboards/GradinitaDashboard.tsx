import Link from 'next/link';
import { Building, Baby, Palette, Calendar, Users, Plus, TrendingUp, Activity, Utensils, BarChart3, MessageCircle } from 'lucide-react';
import { getLocationDetailsUrl, getAddLocationUrl, getAddPersonUrl, getAddPersonLabel } from '@/lib/location-helpers';

interface GradinitaDashboardProps {
  locations: any[];
  onDelete: (id: string, name: string) => void;
}

export default function GradinitaDashboard({ locations, onDelete }: GradinitaDashboardProps) {
  const totalLocations = locations.length;
  const totalCapacity = locations.reduce((sum, loc) => sum + (loc.capacity || 0), 0);
  const totalChildren = locations.reduce((sum, loc) => sum + (loc.childrenCount || 0), 0);
  
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
            <span className="text-3xl font-bold text-white">{totalChildren}</span>
          </div>
          <h3 className="text-green-100 text-xs font-semibold mb-1">Copii Înscriși</h3>
          <p className="text-sm text-green-50">Total din toate grădinițele</p>
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
                <div className="text-4xl font-bold text-white group-hover:scale-110 transition-transform">RON</div>
                <span className="text-sm font-bold text-white text-center">Raport Financiar TOTAL</span>
              </div>
            </div>
          </Link>
          <Link
            href="/reports/financial-groups"
            className="group relative"
          >
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-5 shadow-[0_6px_0_rgb(147,51,234),0_10px_20px_rgba(147,51,234,0.4)] hover:shadow-[0_3px_0_rgb(147,51,234),0_6px_15px_rgba(147,51,234,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-purple-400">
              <div className="flex flex-col items-center gap-2">
                <BarChart3 className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-white text-center">Raport Financiar GRUPE</span>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/mesaje"
            className="group relative"
          >
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl p-5 shadow-[0_6px_0_rgb(79,70,229),0_10px_20px_rgba(79,70,229,0.4)] hover:shadow-[0_3px_0_rgb(79,70,229),0_6px_15px_rgba(79,70,229,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-indigo-400">
              <div className="flex flex-col items-center gap-2">
                <MessageCircle className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-white text-center">Mesaje</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Lista Grădinițe */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Grădinițele Tale</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location, index) => (
            <div 
              key={`location-${location.id}-${index}`} 
              className="bg-gradient-to-br from-blue-50 via-white to-pink-50 rounded-3xl p-6 shadow-[0_8px_0_rgba(59,130,246,0.3),0_12px_24px_rgba(59,130,246,0.2)] hover:shadow-[0_4px_0_rgba(59,130,246,0.4),0_8px_20px_rgba(59,130,246,0.3)] hover:translate-y-1 transition-all duration-200 border-2 border-blue-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Building className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-md">
                  ✓ Activ
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{location.name}</h3>
              <p className="text-gray-600 text-sm mb-3 font-medium">{location.address}</p>
              <div className="space-y-2 mb-5 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-blue-100">
                <p className="text-gray-700 text-sm font-semibold flex items-center gap-2">
                  <span className="text-lg">👶</span> Capacitate: <span className="text-blue-600">{location.capacity || 0} copii</span>
                </p>
                <p className="text-gray-700 text-sm font-semibold flex items-center gap-2">
                  <span className="text-lg">✅</span> Înscriși: <span className="text-green-600">{location.childrenCount || 0} copii</span>
                </p>
                {location.numarGrupe > 0 && (
                  <p className="text-gray-700 text-sm font-semibold flex items-center gap-2">
                    <span className="text-lg">🎨</span> Grupe: <span className="text-purple-600">{location.numarGrupe}</span>
                  </p>
                )}
                {location.program && (
                  <p className="text-gray-700 text-sm font-semibold flex items-center gap-2">
                    <span className="text-lg">🕐</span> Program: <span className="text-pink-600">{location.program}</span>
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Link
                  href={getLocationDetailsUrl('gradinita', location.id)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-center font-bold hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl"
                >
                  👁️ Vezi detalii
                </Link>
                <button
                  onClick={() => onDelete(location.id, location.name)}
                  className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition shadow-lg hover:shadow-xl"
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
