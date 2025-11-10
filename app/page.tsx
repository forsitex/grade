'use client';

import Link from 'next/link';
import { BookOpen, Users, Calendar, FileText, BarChart3, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Platforma Grădinițe</h1>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Conectare
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Înregistrare
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Gestionare Modernă a Grădinițelor
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Sistem complet pentru management de grădinițe cu funcționalități avansate
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
          >
            Începe Acum
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Gestionare Copii"
            description="Administrează date complete ale copiilor, grupe și contacte de urgență"
          />
          <FeatureCard
            icon={<Calendar className="w-8 h-8" />}
            title="Planificare Activități"
            description="Creează și gestionează activități zilnice cu ușurință"
          />
          <FeatureCard
            icon={<FileText className="w-8 h-8" />}
            title="Scrisori Zilei"
            description="Generează rapoarte zilnice și scrisori personalizate"
          />
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Analiză & Rapoarte"
            description="Vizualizează statistici și rapoarte detaliate"
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="AI Powered"
            description="Funcționalități avansate cu inteligență artificială"
          />
          <FeatureCard
            icon={<BookOpen className="w-8 h-8" />}
            title="Galerie Foto"
            description="Organizează și partajează fotografii cu părinții"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p>&copy; 2025 Platforma Grădinițe. Toate drepturile rezervate.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
