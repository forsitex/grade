# 🎨 Platforma Grădinițe

> Platformă modernă pentru gestionarea grădinițelor, construită cu Next.js 16, TypeScript și Firebase.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.0-orange)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 📋 Despre Proiect

Platforma Grădinițe este o soluție completă pentru gestionarea grădinițelor, oferind:
- Gestionare grădinițe, grupe și copii
- Dashboard separat pentru admin și educatoare
- Galerie foto cu stocare optimizată
- Generare meniuri AI cu GPT-4
- Sistem prezență și rapoarte
- Portal părinți (în dezvoltare)

## 🚀 Quick Start

### Cerințe

- Node.js 18+ 
- npm sau yarn
- Cont Firebase
- Cont Cloudinary (opțional)
- API keys OpenAI și Anthropic (opțional)

### Instalare

```bash
# 1. Clone repository
git clone https://github.com/your-repo/platforma-gradinite.git
cd platforma-gradinite

# 2. Install dependencies
npm install

# 3. Create .env.local file
cp .env.example .env.local
# Edit .env.local cu API keys-urile tale

# 4. Run development server
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000) în browser.

## 🔑 Environment Variables

Crează fișierul `.env.local` în root:

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (pentru API routes)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Cloudinary (pentru imagini)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Services (opțional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## 📁 Structura Proiectului

```
platforma-gradinite/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Homepage
│   ├── login/                    # Login unificat
│   ├── register/                 # Înregistrare
│   ├── dashboard/                # Dashboard admin
│   ├── dashboard-educatoare/     # Dashboard educatoare
│   ├── gradinite/                # Gestionare grădinițe
│   │   ├── add/
│   │   └── [id]/
│   │       ├── grupe/            # Gestionare grupe
│   │       └── menus/            # Meniuri
│   ├── children/                 # Gestionare copii
│   │   ├── add/                  # Formular 6 pași
│   │   └── [cnp]/
│   ├── activities/               # Activități
│   ├── attendance/               # Prezență
│   └── api/                      # API Routes
│       ├── upload-group-photo/
│       ├── generate-menu/
│       └── analyze-report/
│
├── components/
│   ├── dashboards/
│   │   └── GradinitaDashboard.tsx
│   └── children/                 # Form components
│       ├── Step1GradinitaGrupa.tsx
│       ├── Step2DateCopil.tsx
│       └── ...
│
├── lib/
│   ├── firebase.ts               # Firebase client
│   ├── firebase-admin.ts         # Firebase Admin SDK
│   ├── location-helpers.ts       # Helper functions
│   ├── cnp-validator.ts          # Validare CNP
│   ├── anthropic.ts              # Claude AI
│   └── openai.ts                 # GPT-4
│
├── types/                        # TypeScript types
├── .env.local                    # Environment variables
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── PLATFORM_STRUCTURE.md         # Documentație completă
```

## 🎯 Features Principale

### ✅ Implementate

- **Gestionare Grădinițe**
  - Adăugare/Editare/Ștergere grădinițe
  - Statistici și rapoarte
  - Editare reprezentant

- **Gestionare Grupe**
  - Grupe personalizate cu emoji
  - Tracking capacitate (progress bar colorat)
  - Adăugare educatori
  - Generare parolă automată educatoare

- **Gestionare Copii**
  - Formular 6 pași (grădiniță, date copil, părinți, contract)
  - Validare CNP românesc
  - Upload foto copil
  - Filtrare pe grupă

- **Galerie Foto**
  - Upload poze per grupă/copil
  - Stocare Cloudinary (optimizare automată)
  - Metadata în Firebase

- **Meniuri AI**
  - Generare meniu săptămânal cu GPT-4
  - Personalizare pe vârstă
  - Export PDF

- **Sistem Multi-Rol**
  - Login unificat cu detecție automată
  - Dashboard admin (toate grădinițele)
  - Dashboard educatoare (doar grupa ei)

### 🔄 În Dezvoltare

- Portal părinți
- Chat educatoare-părinți
- Rapoarte zilnice automate
- Notificări push
- Aplicație mobile

## 🛠️ Comenzi Disponibile

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Production
npm run build        # Build pentru production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🔐 Autentificare & Roluri

### Admin (Proprietar Grădiniță)
- Login: `/login`
- Dashboard: `/dashboard`
- Acces: Toate grădinițele, grupe, copii

### Educatoare
- Login: `/login` (același formular)
- Dashboard: `/dashboard-educatoare`
- Acces: Doar grupa alocată

**Detecție automată:** Sistemul verifică în Firebase dacă user-ul există în colecția `educatoare` și redirectează corespunzător.

## 📊 Structură Firebase

```javascript
organizations/{userId}/
  └── locations/{locationId}/
      ├── name, address, phone, email
      ├── grupe: [
      │     { id, nume, varsta, capacitate, emoji, educatori }
      │   ]
      └── children/{cnp}/
          ├── nume, cnp, varsta, grupa
          └── parinte1, parinte2, contract

educatoare/{userId}/
  ├── email
  ├── organizationId
  ├── locationId
  └── grupaId
```

## 🤝 Contribuții

Contribuțiile sunt binevenite! Pentru schimbări majore:

1. Fork repository
2. Creează branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Deschide Pull Request

## 📝 Documentație Completă

Pentru documentație detaliată, vezi [PLATFORM_STRUCTURE.md](PLATFORM_STRUCTURE.md)

## 📞 Suport

- **Email:** support@platforma-gradinite.ro
- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Documentație:** [docs.platforma-gradinite.ro](https://docs.platforma-gradinite.ro)

## 📄 Licență

MIT License - vezi [LICENSE](LICENSE) pentru detalii.

---

**Dezvoltat cu ❤️ pentru grădinițele din România**
