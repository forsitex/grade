'use client';

import { useRouter } from 'next/navigation';
import { 
  Users, Calendar, FileText, BarChart3, Zap, Image as ImageIcon,
  Shield, Clock, Heart, Star, ArrowRight, Sparkles, Baby, Bell, ChevronDown,
  Rocket, TrendingUp, Award, CheckCircle2, Play, Menu, X, Brain, Scan, 
  FileSearch, MessageSquare, Stethoscope, ClipboardCheck, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";

export default function HomePage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [gradiniteSlide, setGradiniteSlide] = useState(0);
  const [parintiSlide, setParintiSlide] = useState(0);
  const [mobileServiciiOpen, setMobileServiciiOpen] = useState(false);
  const [mobileFunctionalitatiOpen, setMobileFunctionalitatiOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar cu animație */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-xl shadow-lg' : 'bg-white/80 backdrop-blur-lg'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur opacity-75 animate-pulse"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center transform hover:rotate-12 transition">
                  <Baby className="w-7 h-7 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Platforma Grădinițe
              </span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Menubar className="border-0 bg-transparent">
                <MenubarMenu>
                  <MenubarTrigger onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="cursor-pointer">Acasă</MenubarTrigger>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger onClick={() => router.push('/despre')} className="cursor-pointer">Despre Noi</MenubarTrigger>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger>Servicii</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem onClick={() => router.push('/servicii/gradinite')}>Pentru Grădinițe</MenubarItem>
                    <MenubarItem onClick={() => router.push('/servicii/parinti')}>Pentru Părinți</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger>Funcționalități</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem onClick={() => router.push('/functionalitati/gestionare-copii')}>Gestionare Copii</MenubarItem>
                    <MenubarItem onClick={() => router.push('/functionalitati/activitati')}>Activități</MenubarItem>
                    <MenubarItem onClick={() => router.push('/functionalitati/prezenta')}>Prezență</MenubarItem>
                    <MenubarItem onClick={() => router.push('/functionalitati/rapoarte')}>Rapoarte</MenubarItem>
                    <MenubarItem onClick={() => router.push('/functionalitati/galerie-foto')}>Galerie Foto</MenubarItem>
                    <MenubarItem onClick={() => router.push('/functionalitati/grupe')}>Grupe</MenubarItem>
                    <MenubarItem onClick={() => router.push('/functionalitati/meniu-ai')}>Meniu AI</MenubarItem>
                    <MenubarItem onClick={() => router.push('/functionalitati/analytics')}>Analytics</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger onClick={() => router.push('/contact')} className="cursor-pointer">Contact</MenubarTrigger>
                </MenubarMenu>
              </Menubar>
              
              {/* Conectare */}
              <button onClick={() => router.push('/login')} className="px-6 py-2 text-gray-700 hover:text-purple-600 font-semibold transition">
                Conectare
              </button>
              
              {/* Înregistrare */}
              <button onClick={() => router.push('/register')} className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl font-semibold overflow-hidden transition-all hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105">
                <span className="relative z-10 flex items-center gap-2">
                  Înregistrare
                  <Rocket className="w-4 h-4 group-hover:translate-x-1 transition" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition"></div>
              </button>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
              {mobileMenuOpen ? <X className="w-6 h-6 text-gray-900" /> : <Menu className="w-6 h-6 text-gray-900" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-4 px-6 space-y-2">
            {/* Acasă */}
            <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition font-semibold">
              Acasă
            </button>
            
            {/* Despre Noi */}
            <button onClick={() => { router.push('/despre'); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition font-semibold">
              Despre Noi
            </button>
            
            {/* Servicii */}
            <div className="space-y-1">
              <button onClick={() => setMobileServiciiOpen(!mobileServiciiOpen)} className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition font-semibold">
                <span>Servicii</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileServiciiOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileServiciiOpen && (
                <div className="space-y-1 pl-4">
                  <button onClick={() => { router.push('/servicii/gradinite'); setMobileMenuOpen(false); }} className="w-full text-left px-6 py-2 text-gray-700 hover:bg-purple-50 rounded-lg transition text-sm">
                    Pentru Grădinițe
                  </button>
                  <button onClick={() => { router.push('/servicii/parinti'); setMobileMenuOpen(false); }} className="w-full text-left px-6 py-2 text-gray-700 hover:bg-purple-50 rounded-lg transition text-sm">
                    Pentru Părinți
                  </button>
                </div>
              )}
            </div>
            
            {/* Funcționalități */}
            <div className="space-y-1">
              <button onClick={() => setMobileFunctionalitatiOpen(!mobileFunctionalitatiOpen)} className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition font-semibold">
                <span>Funcționalități</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileFunctionalitatiOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileFunctionalitatiOpen && (
                <div className="space-y-1 pl-4">
                  <button onClick={() => { router.push('/functionalitati/gestionare-copii'); setMobileMenuOpen(false); }} className="w-full text-left px-6 py-2 text-gray-700 hover:bg-purple-50 rounded-lg transition text-sm">
                    Gestionare Copii
                  </button>
                  <button onClick={() => { router.push('/functionalitati/activitati'); setMobileMenuOpen(false); }} className="w-full text-left px-6 py-2 text-gray-700 hover:bg-purple-50 rounded-lg transition text-sm">
                    Activități
                  </button>
                  <button onClick={() => { router.push('/functionalitati/prezenta'); setMobileMenuOpen(false); }} className="w-full text-left px-6 py-2 text-gray-700 hover:bg-purple-50 rounded-lg transition text-sm">
                    Prezență
                  </button>
                  <button onClick={() => { router.push('/functionalitati/rapoarte'); setMobileMenuOpen(false); }} className="w-full text-left px-6 py-2 text-gray-700 hover:bg-purple-50 rounded-lg transition text-sm">
                    Rapoarte
                  </button>
                  <button onClick={() => { router.push('/functionalitati/galerie-foto'); setMobileMenuOpen(false); }} className="w-full text-left px-6 py-2 text-gray-700 hover:bg-purple-50 rounded-lg transition text-sm">
                    Galerie Foto
                  </button>
                  <button onClick={() => { router.push('/functionalitati/grupe'); setMobileMenuOpen(false); }} className="w-full text-left px-6 py-2 text-gray-700 hover:bg-purple-50 rounded-lg transition text-sm">
                    Grupe
                  </button>
                  <button onClick={() => { router.push('/functionalitati/meniu-ai'); setMobileMenuOpen(false); }} className="w-full text-left px-6 py-2 text-gray-700 hover:bg-purple-50 rounded-lg transition text-sm">
                    Meniu AI
                  </button>
                  <button onClick={() => { router.push('/functionalitati/analytics'); setMobileMenuOpen(false); }} className="w-full text-left px-6 py-2 text-gray-700 hover:bg-purple-50 rounded-lg transition text-sm">
                    Analytics
                  </button>
                </div>
              )}
            </div>
            
            {/* Contact */}
            <button onClick={() => { router.push('/contact'); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition font-semibold">
              Contact
            </button>
            
            <div className="border-t border-gray-200 my-2"></div>
            
            {/* Conectare */}
            <button onClick={() => { router.push('/login'); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition font-semibold">
              Conectare
            </button>
            
            {/* Înregistrare */}
            <button onClick={() => { router.push('/register'); setMobileMenuOpen(false); }} className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold">
              Înregistrare
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section WOW cu Video Background */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-screen flex items-center">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          {/* Overlay gradient pentru contrast */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-purple-900/60 to-pink-900/70"></div>
          {/* Animated blobs peste video */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="container mx-auto max-w-6xl text-center relative z-10">
          {/* Badge animat */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-lg rounded-full shadow-2xl mb-8 border border-purple-200 animate-bounce">
            <Sparkles className="w-5 h-5 text-yellow-500 animate-spin" style={{animationDuration: '3s'}} />
            <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">✨ Nou în 2025 - AI Powered</span>
          </div>
          
          {/* Titlu cu animație gradient - text alb pentru video background */}
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight drop-shadow-2xl">
            <span className="inline-block animate-fade-in-up text-white" style={{animationDelay: '0.1s'}}>
              Gestionare
            </span>
            <br />
            <span className="inline-block animate-fade-in-up bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent" style={{animationDelay: '0.2s'}}>
              Modernă
            </span>
            <br />
            <span className="inline-block animate-fade-in-up text-white" style={{animationDelay: '0.3s'}}>
              a Grădinițelor 🏫
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up drop-shadow-lg" style={{animationDelay: '0.4s'}}>
            Transformă-ți grădinița cu <span className="font-bold text-yellow-300">AI</span>, 
            <span className="font-bold text-pink-300"> Portal Părinți</span> și 
            <span className="font-bold text-purple-300"> Automatizare Completă</span>
          </p>
          
          {/* Butoane Hero */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
            <button onClick={() => router.push('/register')} className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg overflow-hidden transition-all hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-110">
              <span className="relative z-10 flex items-center justify-center gap-3">
                <Rocket className="w-6 h-6 group-hover:translate-y-[-4px] transition" />
                Începe Acum GRATUIT
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition"></div>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </button>
            
            <button onClick={() => router.push('/login')} className="group px-10 py-5 bg-white/80 backdrop-blur-lg text-gray-900 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all border-2 border-gray-200 hover:border-purple-400 hover:scale-105">
              <span className="flex items-center justify-center gap-3">
                <Play className="w-6 h-6 text-purple-600 group-hover:scale-125 transition" />
                Vezi Demo
              </span>
            </button>
          </div>
          
          {/* Statistici cu background colorat */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            {[
              { number: '500+', label: 'Grădinițe', gradient: 'from-blue-500 to-cyan-500', icon: '🏫' },
              { number: '10,000+', label: 'Copii', gradient: 'from-purple-500 to-pink-500', icon: '👶' },
              { number: '1,000+', label: 'Educatoare', gradient: 'from-orange-500 to-red-500', icon: '👩‍🏫' },
              { number: '99%', label: 'Satisfacție', gradient: 'from-green-500 to-emerald-500', icon: '⭐' }
            ].map((stat, i) => (
              <div key={i} className="group relative">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-lg rounded-3xl transform group-hover:scale-105 transition"></div>
                <div className="relative p-6 text-center">
                  <div className="text-5xl mb-2">{stat.icon}</div>
                  <div className={`text-5xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2 drop-shadow-lg`}>
                    {stat.number}
                  </div>
                  <div className="text-white font-semibold text-lg drop-shadow-md">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Grădinițe & Părinți SIMPLE STYLE */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-7xl">
          
          {/* Grid 2 coloane: Stânga Grădinițe, Dreapta Părinți */}
          <div className="grid lg:grid-cols-2 gap-16">
            
            {/* STÂNGA - Funcționalități Grădinițe */}
            <div>
              {/* Header */}
              <div className="mb-6 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Funcționalități Grădinițe
                </h2>
                <p className="text-gray-600">
                  Management complet pentru grădinițe moderne
                </p>
              </div>

              {/* Content Box */}
              <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-3xl p-10 border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { title: 'Gestionare Copii', count: '100+ Features' },
                    { title: 'Activități', count: '50+ Templates' },
                    { title: 'Prezență', count: 'Real-time' },
                    { title: 'Rapoarte', count: 'Auto-generate' },
                    { title: 'Galerie Foto', count: 'Nelimitat' },
                    { title: 'Grupe', count: 'Personalizate' },
                    { title: 'Meniu AI', count: 'Smart' },
                    { title: 'Analytics', count: 'Advanced' }
                  ].map((item, i) => (
                    <div 
                      key={i} 
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 text-center opacity-0 animate-fade-in-up"
                      style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}
                    >
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-gray-500">{item.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DREAPTA - Funcționalități Părinți */}
            <div>
              {/* Header */}
              <div className="mb-6 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Funcționalități Părinți
                </h2>
                <p className="text-gray-600">
                  Portal dedicat - transparență totală
                </p>
              </div>

              {/* Content Box */}
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-10 border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { title: 'Dashboard Live', count: 'Real-time' },
                    { title: 'Galerie Foto', count: 'Nelimitat' },
                    { title: 'Rapoarte Zilnice', count: 'Auto-send' },
                    { title: 'Notificări', count: 'Instant' },
                    { title: 'Meniu Săptămânal', count: 'Alergeni' },
                    { title: 'Prezență', count: 'Monitorizare' },
                    { title: 'Mesaje', count: 'Chat Direct' },
                    { title: 'Progres', count: 'Analytics' }
                  ].map((item, i) => (
                    <div 
                      key={i} 
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 text-center opacity-0 animate-fade-in-up"
                      style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}
                    >
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-gray-500">{item.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-lg rounded-full mb-6 border border-white/20">
              <Brain className="w-5 h-5 text-purple-300 animate-pulse" />
              <span className="text-sm font-bold text-white">Powered by AI</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              Funcționalități AI 🤖
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Inteligență artificială avansată pentru automatizare și analiză
            </p>
          </div>

          {/* AI Cards Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {[
              {
                icon: FileSearch,
                title: 'Analiză Contracte',
                desc: 'GPT-4o detectează automat câmpurile din contracte PDF',
                features: ['Extragere automată date', 'Detectare câmpuri obligatorii', 'Format JSON structurat'],
                color: 'from-blue-400 to-cyan-400',
                badge: 'OpenAI'
              },
              {
                icon: Stethoscope,
                title: 'Analiză Imagini Medicale',
                desc: 'Claude Vision analizează analize medicale și oferă recomandări',
                features: ['Detectare valori anormale', 'Recomandări alimentație', 'Plan monitorizare'],
                color: 'from-green-400 to-emerald-400',
                badge: 'Claude Vision'
              },
              {
                icon: BarChart3,
                title: 'Rapoarte Financiare',
                desc: 'Analizează bilanțuri și calculează indicatori financiari',
                features: ['Calcul profit net', 'Identificare cheltuieli', 'Insights automate'],
                color: 'from-orange-400 to-red-400',
                badge: 'GPT-4o'
              },
              {
                icon: MessageSquare,
                title: 'Rapoarte Lunare Copii',
                desc: 'Generează analiză detaliată a dezvoltării copilului',
                features: ['Analiză prezență & mese', 'Sfaturi pentru părinți', 'Ton prietenos'],
                color: 'from-pink-400 to-rose-400',
                badge: 'Claude 3.5'
              }
            ].map((ai, i) => (
              <div key={i} className="group relative">
                {/* Glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${ai.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity rounded-3xl`}></div>
                
                {/* Card */}
                <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 hover:bg-white/15 transition-all hover:scale-105">
                  {/* Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-lg rounded-full text-xs font-bold text-white border border-white/30">
                    {ai.badge}
                  </div>

                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${ai.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition shadow-lg`}>
                    <ai.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-white mb-3">{ai.title}</h3>
                  <p className="text-purple-200 mb-6">{ai.desc}</p>

                  {/* Features list */}
                  <ul className="space-y-2">
                    {ai.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-purple-100">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {[
              { label: 'Modele AI', value: '2', icon: Brain },
              { label: 'API Endpoints', value: '4', icon: Zap },
              { label: 'Precizie', value: '95%', icon: Award },
              { label: 'Timp Economisit', value: '10h', icon: TrendingUp }
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
                <stat.icon className="w-8 h-8 text-purple-300 mx-auto mb-3" />
                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-sm text-purple-200">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <button onClick={() => router.push('/register')} className="group px-10 py-5 bg-white text-purple-900 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105">
              <span className="flex items-center justify-center gap-3">
                <Sparkles className="w-6 h-6 group-hover:rotate-12 transition" />
                Testează AI Gratuit
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Free Trial Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto max-w-7xl">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-lg py-16 px-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              
              {/* STÂNGA - Text */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-bold text-purple-900">Ofertă Specială</span>
                </div>
                
                <h2 className="text-4xl font-bold text-gray-900">
                  Testează <span className="text-purple-600">GRATUIT</span> 14 Zile
                </h2>
                
                <p className="text-gray-600">
                  Descoperă toate funcționalitățile platformei fără niciun cost.
                </p>
                
                <button 
                  onClick={() => router.push('/register')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition flex items-center gap-2"
                >
                  <Rocket className="w-5 h-5" />
                  Începe Perioada Gratuită
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Fără card necesar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Anulare oricând</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Acces complet</span>
                  </div>
                </div>
              </div>

              {/* DREAPTA - Imagine 3D Gift */}
              <div className="flex items-center justify-center">
                <img 
                  src="https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/gift-3.png" 
                  alt="14 Zile Gratuit" 
                  className="w-full max-w-md object-contain"
                />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">De ce să alegi platforma noastră?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: Shield, title: 'Securitate Maximă', desc: 'Date protejate cu Firebase' },
              { icon: Clock, title: 'Economisește Timp', desc: 'Câștigă 10+ ore/săptămână' },
              { icon: Heart, title: 'Portal Părinți', desc: 'Părinții văd activitățile în timp real' },
              { icon: Bell, title: 'Notificări', desc: 'Alertează părinții automat' }
            ].map((b, i) => (
              <div key={i} className="flex gap-6 p-8 bg-white rounded-2xl shadow-lg">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <b.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-gray-600">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Ce spun clienții noștri</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Maria Popescu', role: 'Director', emoji: '👩‍🏫', text: 'Economisim 15 ore pe săptămână!' },
              { name: 'Ana Ionescu', role: 'Educatoare', emoji: '👩‍🎓', text: 'Interfața este intuitivă!' },
              { name: 'Ion Dumitrescu', role: 'Părinte', emoji: '👨‍💼', text: 'Văd în timp real ce face copilul!' }
            ].map((t, i) => (
              <div key={i} className="p-8 bg-white rounded-2xl shadow-lg border-2 border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-700 mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{t.emoji}</div>
                  <div>
                    <div className="font-bold text-gray-900">{t.name}</div>
                    <div className="text-sm text-gray-600">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Întrebări Frecvente</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'Ce este Platforma Grădinițe?', a: 'Sistem complet de management pentru grădinițe.' },
              { q: 'Cât costă?', a: 'Planuri flexibile în funcție de numărul de copii.' },
              { q: 'Este sigură?', a: 'Da! Firebase cu encriptare end-to-end.' },
              { q: 'Portal părinți?', a: 'Da! Fiecare părinte are acces personalizat.' },
              { q: 'Suport tehnic?', a: 'Da! Suport 24/7 prin email și telefon.' }
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition">
                  <span className="font-bold text-gray-900 text-lg">{faq.q}</span>
                  <ChevronDown className={`w-6 h-6 text-gray-600 transition ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <div className="px-6 pb-6 text-gray-600">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Gata să începi?</h2>
            <p className="text-xl mb-8 opacity-90">Alătură-te celor 500+ grădinițe</p>
            <button onClick={() => router.push('/register')} className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-2xl transition transform hover:scale-105">
              Încearcă Gratuit 14 Zile
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center text-gray-400 text-sm">
            © 2025 Platforma Grădinițe. Toate drepturile rezervate.
          </div>
        </div>
      </footer>
    </div>
  );
}
