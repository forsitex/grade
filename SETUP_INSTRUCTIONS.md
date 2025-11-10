# Instrucțiuni de Configurare - Platforma Grădinițe

## ⚠️ Spațiu Disc Insuficient

Instalarea npm packages necesită ~500MB spațiu liber. Dacă primești eroare `ENOSPC`, urmează acești pași:

### 1. Curățare Disc

```bash
# Șterge cache npm
npm cache clean --force

# Șterge alte proiecte temporare
rm -rf /Users/teraki/Desktop/APLICATIE\ CAMIN/web-iempathy/node_modules
```

### 2. Instalare Dependențe

```bash
cd "/Users/teraki/Desktop/PLATFORMA GRADINITE"
npm install
```

### 3. Rulare Development Server

```bash
npm run dev
```

Serverul va fi disponibil la: **http://localhost:3000**

## 📦 Structura Proiect Creată

```
PLATFORMA GRADINITE/
├── app/
│   ├── layout.tsx          ✅ Layout principal
│   ├── page.tsx            ✅ Homepage
│   ├── login/page.tsx      ✅ Pagina login
│   └── register/page.tsx   ✅ Pagina înregistrare
├── package.json            ✅ Dependențe
├── tsconfig.json           ✅ TypeScript config
├── tailwind.config.ts      ✅ Tailwind config
├── .env.local              ✅ Variabile mediu
└── README.md               ✅ Documentație
```

## 🔧 Configurare Firebase

Variabilele Firebase sunt deja setate în `.env.local` din proiectul iEmpathy.

Dacă trebuie să le actualizezi:

```bash
# Editează .env.local și adaugă:
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

## 📝 Pași Următori

1. ✅ Structura de bază creată
2. ⏳ Instalare dependențe (așteptând spațiu disc)
3. ⏳ Crearea componentelor pentru grădinițe
4. ⏳ Integrare Firebase
5. ⏳ Funcționalități AI

## 🎯 Funcționalități Planificate

### Phase 1 (Core)
- [ ] Autentificare Firebase
- [ ] Dashboard
- [ ] Gestionare grădinițe
- [ ] Gestionare copii

### Phase 2 (Features)
- [ ] Planificare activități
- [ ] Scrisori zilei
- [ ] Galerie foto
- [ ] Rapoarte

### Phase 3 (AI)
- [ ] Generare meniuri AI
- [ ] Analiză comportament
- [ ] Recomandări personalizate
