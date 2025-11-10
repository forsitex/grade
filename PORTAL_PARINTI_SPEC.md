# 👨‍👩‍👧 Portal Părinți - Specificații Tehnice Complete

## 📋 Prezentare Generală

**Obiectiv:** Sistem dedicat părinților pentru monitorizarea copilului lor în grădiniță.

**Principiu de bază:** 
- **1 Părinte = 1 Copil** (acces individual, personalizat)
- **Read-Only Access** (doar vizualizare, fără editare)
- **Detecție Automată** la login (redirect automat la portal părinți)

---

## 🎯 Funcționalități Principale

### 1. Activități Zilnice 📝

**Descriere:**
Părintele vede toate activitățile în care a participat copilul său.

**Features:**
- ✅ Lista activități zilnice (azi, ieri, ultima săptămână)
- ✅ Detalii activitate: nume, descriere, durată, educatoare
- ✅ Poze din activitate (dacă există)
- ✅ Filtrare automată: doar activitățile grupei copilului
- ✅ Calendar lunar cu activități

**Structură Date:**
```javascript
activities/{activityId}/
  - nume: "Pictură cu acuarelă"
  - descriere: "Copiii au pictat peisaje de toamnă"
  - data: Timestamp
  - grupaId: "grupa-123"
  - copiiParticipanti: ["5201112238943", "..."] // CNP-uri
  - poze: ["url1", "url2"]
  - educatoare: "Maria Popescu"
```

**UI Components:**
- Card activitate cu: icon, nume, dată, descriere
- Badge "Participat" (verde) sau "Nu a participat" (gri)
- Galerie poze inline
- Filtrare: Toate / Ultima săptămână / Luna curentă

---

### 2. Prezență Zilnică ✅

**Descriere:**
Istoric complet al prezenței copilului în grădiniță.

**Features:**
- ✅ Status prezență azi: Prezent / Absent / Întârziere
- ✅ Calendar lunar cu prezența (verde/roșu/galben)
- ✅ Statistici lunare:
  - Total zile prezent
  - Total zile absent
  - Procent prezență
  - Întârzieri
- ✅ Notificări: "Copilul tău a fost marcat absent azi"
- ✅ Istoric prezență (ultimele 30 zile)

**Structură Date:**
```javascript
attendance/{date}/grupe/{grupaId}/copii/{cnp}/
  - status: "prezent" | "absent" | "intarziere"
  - oraIntrare: "08:30"
  - oraIesire: "16:00"
  - observatii: "A venit cu 10 min întârziere"
  - markedBy: "Maria Popescu"
  - timestamp: Timestamp
```

**UI Components:**
- Card mare: Status azi (icon + culoare)
- Calendar interactiv (click pe zi → detalii)
- Progress bar: "18/22 zile prezent (82%)"
- Lista ultimele 7 zile cu status

---

### 3. Galerie Foto 📸

**Descriere:**
Părintele vede DOAR pozele în care apare copilul său.

**Features:**
- ✅ Filtrare automată din galeria grupei
- ✅ Doar pozele cu CNP-ul copilului în metadata
- ✅ Organizare pe categorii:
  - Activități
  - Mese
  - Joacă liberă
  - Evenimente speciale
- ✅ Download poze (individual sau bulk)
- ✅ Slideshow
- ✅ Notificare: "3 poze noi cu copilul tău!"

**Structură Date (existentă):**
```javascript
gallery/{photoId}/
  - url: "cloudinary_url"
  - grupaId: "grupa-123"
  - children: ["5201112238943", "..."] // CNP-uri copii din poză
  - category: "activitati"
  - description: "Pictură cu degetele"
  - uploadedAt: Timestamp
  - uploadedBy: "Maria Popescu"
```

**Logică Filtrare:**
```typescript
const pozeCopil = allPhotos.filter(photo => 
  photo.children.includes(copilCnp)
);
```

**UI Components:**
- Grid poze (3 coloane pe desktop, 2 pe mobile)
- Lightbox pentru vizualizare full-screen
- Butoane: Download, Share, Slideshow
- Tabs categorii: Toate / Activități / Mese / Joacă

---

### 4. Rapoarte Zilnice 📋

**Descriere:**
Raport detaliat zilnic completat de educatoare despre copil.

**Features:**
- ✅ Raport zilnic (completat de educatoare)
- ✅ Secțiuni raport:
  - **Mese:** Ce a mâncat, cât a mâncat (%, emoji)
  - **Somn:** Ora adormit, ora trezit, calitate somn
  - **Igienă:** Schimbări scutec/haine, toaletă
  - **Comportament:** Dispoziție, interacțiune cu alții
  - **Activități:** Ce activități a făcut
  - **Observații:** Note speciale de la educatoare
- ✅ Istoric rapoarte (ultimele 30 zile)
- ✅ Notificare: "Raport zilnic disponibil pentru [Nume Copil]"

**Structură Date:**
```javascript
dailyReports/{date}/{cnp}/
  - data: "2025-11-10"
  - copilCnp: "5201112238943"
  - copilNume: "Popescu Andrei"
  - grupaId: "grupa-123"
  
  - mese: {
      micDejun: { mancat: "80%", alimente: "Lapte, pâine, unt", emoji: "😊" }
      gustare1: { mancat: "100%", alimente: "Fructe", emoji: "😋" }
      pranz: { mancat: "60%", alimente: "Supă, piure, cotlet", emoji: "😐" }
      gustare2: { mancat: "90%", alimente: "Iaurt", emoji: "😊" }
    }
  
  - somn: {
      aAdormit: "13:00"
      aTrezit: "15:00"
      durata: "2h"
      calitate: "bună" | "agitată" | "nu a dormit"
    }
  
  - igiena: {
      schimbariScutec: 3
      schimbariHaine: 1
      toaleta: "Da"
      observatii: ""
    }
  
  - comportament: {
      dispozitie: "veselă" | "tristă" | "agitată" | "calmă"
      interactiune: "A jucat frumos cu colegii"
      emoji: "😊"
    }
  
  - activitati: [
      "Pictură cu acuarelă",
      "Joc în curte",
      "Povești"
    ]
  
  - observatii: "A fost foarte vesel astăzi. A participat activ la toate activitățile."
  
  - completatDe: "Maria Popescu"
  - completatLa: Timestamp
```

**UI Components:**
- Card raport cu secțiuni expandabile
- Icons pentru fiecare secțiune
- Emoji-uri pentru dispoziție și mese
- Timeline activități
- Buton "Descarcă PDF"

---

### 5. Meniu Săptămânal 🍽️

**Descriere:**
Meniul săptămânii + ce a mâncat efectiv copilul ieri.

**Features:**
- ✅ Meniul zilei precedente (ce a mâncat efectiv + procent)
- ✅ Meniul săptămânii curente (planificat)
- ✅ Alergii/restricții alimentare copil (afișate cu warning)
- ✅ Notificare: "Meniu nou pentru săptămâna viitoare"

**Structură Date:**
```javascript
// Meniu săptămânal (existent)
menus/{menuId}/
  - saptamana: "1-5 Noiembrie"
  - zile: {
      luni: { micDejun, gustare1, pranz, gustare2, cina }
      ...
    }

// Alergii copil (în profil copil)
children/{cnp}/
  - alergii: ["lactate", "nuci"]
  - restrictiiAlimentare: "vegetarian"
```

**Logică:**
- Afișează meniul zilei precedente
- Compară cu raportul zilnic (ce a mâncat efectiv)
- Highlight alergii în meniu (roșu)

**UI Components:**
- Card "Ce a mâncat ieri" cu procente
- Tabel meniu săptămânal (Luni-Vineri)
- Badge-uri alergii (roșu) pe alimente
- Toggle: Meniu săptămâna curentă / viitoare

---

## 🔐 Sistem Autentificare Părinți

### Flow Creare Cont Părinte

**Când se creează?**
Când admin-ul adaugă un copil nou (formular 6 pași).

**Proces automat:**
1. Admin completează formular copil (Step 3: Date Părinte 1)
2. Sistem extrage:
   - Email părinte: `ion.popescu@gmail.com`
   - Nume părinte: `Ion Popescu`
   - Telefon: `0722123456`
3. Sistem generează parolă automată (6 caractere)
4. **API Call:** `/api/create-parinte`
   - Creează cont Firebase Auth
   - Creează document în `parinti/{userId}`
5. Sistem trimite email automat cu:
   - Link portal: `https://platforma.ro/portal-parinti`
   - Email: `ion.popescu@gmail.com`
   - Parolă: `abc123`
   - Instrucțiuni login

**Structură Firebase:**
```javascript
parinti/{userId}/
  - email: "ion.popescu@gmail.com"
  - nume: "Ion Popescu"
  - telefon: "0722123456"
  - organizationId: "gradi-123"
  - locationId: "gradi-123"
  - copilCnp: "5201112238943"
  - copilNume: "Popescu Andrei"
  - grupaId: "grupa-123"
  - createdAt: Timestamp
  - lastLogin: Timestamp
```

---

### Flow Login Unificat (Actualizat)

**Pagina:** `/login` (aceeași pentru toți)

**Logică detecție:**
```typescript
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const user = userCredential.user;

// 1. Verifică dacă este educatoare
const educatoareRef = doc(db, 'educatoare', user.uid);
const educatoareSnap = await getDoc(educatoareRef);

if (educatoareSnap.exists()) {
  router.push('/dashboard-educatoare');
  return;
}

// 2. Verifică dacă este părinte
const parinteRef = doc(db, 'parinti', user.uid);
const parinteSnap = await getDoc(parinteRef);

if (parinteSnap.exists()) {
  router.push('/portal-parinti');
  return;
}

// 3. Altfel, este admin
router.push('/dashboard');
```

**Tabel Roluri:**

| Rol | Colecție Firebase | Dashboard | Acces |
|-----|------------------|-----------|-------|
| **Admin** | `organizations/{userId}` | `/dashboard` | Toate grădinițele |
| **Educatoare** | `educatoare/{userId}` | `/dashboard-educatoare` | Doar grupa ei |
| **Părinte** | `parinti/{userId}` | `/portal-parinti` | Doar copilul său |

---

## 📱 UI/UX Portal Părinți

### Layout Principal

```
┌─────────────────────────────────────────┐
│  Header                                 │
│  👨‍👩‍👧 Portal Părinți                      │
│  Popescu Andrei (Grupa Mică A)          │
│  [Logout]                               │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Prezent │  │ 3 Poze  │  │ Raport  │ │
│  │  Azi    │  │  Noi    │  │ Disponibil│
│  └─────────┘  └─────────┘  └─────────┘ │
│                                         │
│  📋 Raport Zilnic (Azi)                 │
│  ┌───────────────────────────────────┐ │
│  │ 🍽️ Mese: 85% mâncat                │ │
│  │ 😴 Somn: 2h (13:00-15:00)          │ │
│  │ 😊 Dispoziție: Veselă               │ │
│  └───────────────────────────────────┘ │
│                                         │
│  📸 Galerie Foto (Ultimele poze)        │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐              │
│  │   │ │   │ │   │ │   │ [Vezi tot]   │
│  └───┘ └───┘ └───┘ └───┘              │
│                                         │
│  📅 Activități Recente                  │
│  • Pictură cu acuarelă (Azi, 10:00)    │
│  • Joc în curte (Ieri, 11:30)          │
│  • Povești (Ieri, 14:00)               │
│                                         │
└─────────────────────────────────────────┘
```

### Navigație

**Tabs principale:**
- 🏠 Acasă (Dashboard)
- 📋 Rapoarte
- 📸 Galerie
- ✅ Prezență
- 🎨 Activități
- 🍽️ Meniu

**Mobile-First Design:**
- Bottom navigation (tabs)
- Swipe între secțiuni
- Pull-to-refresh

---

## 🔔 Sistem Notificări

### Tipuri Notificări Părinți

1. **Raport Zilnic Disponibil** 📋
   - Trigger: Educatoare completează raport
   - Mesaj: "Raport zilnic disponibil pentru Andrei"
   - Link: Direct la raport

2. **Poze Noi** 📸
   - Trigger: Educatoare uploadează poze cu copilul
   - Mesaj: "3 poze noi cu Andrei în galerie"
   - Link: Direct la galerie

3. **Absență Marcată** ⚠️
   - Trigger: Educatoare marchează absent
   - Mesaj: "Andrei a fost marcat absent astăzi"
   - Link: Prezență

4. **Activitate Nouă** 🎨
   - Trigger: Copilul participă la activitate
   - Mesaj: "Andrei a participat la Pictură cu acuarelă"
   - Link: Activități

5. **Meniu Nou** 🍽️
   - Trigger: Admin publică meniu nou
   - Mesaj: "Meniu nou pentru săptămâna viitoare"
   - Link: Meniu

### Canale Notificări

- ✅ **Push Notifications** (web + mobile)
- ✅ **Email** (opțional, configurabil)
- ✅ **SMS** (opțional, pentru absențe)
- ✅ **In-App Badge** (număr notificări necitite)

---

## 🗄️ Structură Firebase Completă

```javascript
// PĂRINȚI
parinti/{userId}/
  - email: string
  - nume: string
  - telefon: string
  - organizationId: string
  - locationId: string
  - copilCnp: string
  - copilNume: string
  - grupaId: string
  - createdAt: Timestamp
  - lastLogin: Timestamp
  - notificationSettings: {
      pushEnabled: boolean
      emailEnabled: boolean
      smsEnabled: boolean
    }

// RAPOARTE ZILNICE
organizations/{orgId}/locations/{locId}/dailyReports/{date}/{cnp}/
  - [structura detaliată mai sus]

// ACTIVITĂȚI
organizations/{orgId}/locations/{locId}/activities/{activityId}/
  - nume: string
  - descriere: string
  - data: Timestamp
  - grupaId: string
  - copiiParticipanti: string[] // CNP-uri
  - poze: string[]
  - educatoare: string

// PREZENȚĂ (existent, se extinde)
organizations/{orgId}/locations/{locId}/attendance/{date}/grupe/{grupaId}/copii/{cnp}/
  - status: "prezent" | "absent" | "intarziere"
  - oraIntrare: string
  - oraIesire: string
  - observatii: string
  - markedBy: string
  - timestamp: Timestamp

// GALERIE (existent, se folosește cu filtrare)
organizations/{orgId}/locations/{locId}/gallery/{photoId}/
  - children: string[] // CNP-uri - CRUCIAL pentru filtrare
```

---

## 🚀 Plan Implementare

### Faza 1: Backend & Auth (Prioritate ÎNALTĂ)

**Task-uri:**
1. ✅ API `/api/create-parinte` (creare cont Firebase Auth + Firestore)
2. ✅ Modificare formular copil (Step 3) - trigger creare cont părinte
3. ✅ Actualizare login page - detecție rol părinte
4. ✅ Email automat cu credențiale login

**Estimare:** 2-3 zile

---

### Faza 2: Dashboard Părinți (Prioritate ÎNALTĂ)

**Task-uri:**
1. ✅ Pagină `/portal-parinti/page.tsx`
2. ✅ Layout cu header + tabs
3. ✅ Dashboard home (overview)
4. ✅ Încărcare date copil din Firebase
5. ✅ Card-uri statistici (prezență azi, poze noi, raport)

**Estimare:** 2 zile

---

### Faza 3: Galerie Foto (Prioritate ÎNALTĂ)

**Task-uri:**
1. ✅ Pagină `/portal-parinti/galerie/page.tsx`
2. ✅ Filtrare poze după CNP copil
3. ✅ Grid poze responsive
4. ✅ Lightbox vizualizare
5. ✅ Download poze
6. ✅ Categorii (tabs)

**Estimare:** 1-2 zile

---

### Faza 4: Prezență (Prioritate MEDIE)

**Task-uri:**
1. ✅ Pagină `/portal-parinti/prezenta/page.tsx`
2. ✅ Calendar interactiv
3. ✅ Statistici lunare
4. ✅ Istoric prezență
5. ✅ Status azi (card mare)

**Estimare:** 2 zile

---

### Faza 5: Rapoarte Zilnice (Prioritate ÎNALTĂ)

**Task-uri:**
1. ✅ Structură date raport zilnic
2. ✅ Formular completare raport (pentru educatoare)
3. ✅ Pagină `/portal-parinti/rapoarte/page.tsx`
4. ✅ Vizualizare raport zilnic
5. ✅ Istoric rapoarte
6. ✅ Export PDF raport

**Estimare:** 3-4 zile

---

### Faza 6: Activități (Prioritate MEDIE)

**Task-uri:**
1. ✅ Pagină `/portal-parinti/activitati/page.tsx`
2. ✅ Lista activități (filtrare după grupă + participare copil)
3. ✅ Detalii activitate
4. ✅ Calendar activități
5. ✅ Badge participare

**Estimare:** 2 zile

---

### Faza 7: Meniu (Prioritate MEDIE)

**Task-uri:**
1. ✅ Pagină `/portal-parinti/meniu/page.tsx`
2. ✅ Afișare meniu săptămânal
3. ✅ Integrare cu raport zilnic (ce a mâncat efectiv)
4. ✅ Highlight alergii
5. ✅ Toggle săptămâna curentă/viitoare

**Estimare:** 1-2 zile

---

### Faza 8: Notificări (Prioritate SCĂZUTĂ)

**Task-uri:**
1. ✅ Setup Firebase Cloud Messaging
2. ✅ Trigger notificări (raport, poze, absență)
3. ✅ Email notifications
4. ✅ SMS notifications (opțional)
5. ✅ Settings notificări

**Estimare:** 3-4 zile

---

## 📊 Metrici Success

### KPI-uri Portal Părinți

- **Adoption Rate:** 80%+ părinți activi
- **Daily Active Users:** 50%+ părinți login zilnic
- **Engagement:** 5+ minute/sesiune
- **Satisfaction:** 4.5+ rating (din 5)

### Feedback Loop

- Survey lunar părinți
- Feature requests
- Bug reports
- Analytics (Google Analytics / Firebase Analytics)

---

## 🔒 Securitate & Privacy

### Măsuri Securitate

1. ✅ **Acces Restricționat**
   - Părinte vede DOAR copilul său
   - Verificare CNP la fiecare query
   - Firestore Rules stricte

2. ✅ **GDPR Compliance**
   - Consimțământ părinți pentru poze
   - Drept de ștergere date
   - Export date personale

3. ✅ **Firestore Security Rules**
```javascript
match /parinti/{userId} {
  allow read, write: if request.auth.uid == userId;
}

match /dailyReports/{date}/{cnp} {
  allow read: if get(/databases/$(database)/documents/parinti/$(request.auth.uid)).data.copilCnp == cnp;
}
```

---

## 📝 Checklist Final

### Must-Have (MVP)
- [ ] Autentificare părinți
- [ ] Dashboard home
- [ ] Galerie foto (filtrată)
- [ ] Rapoarte zilnice
- [ ] Prezență

### Nice-to-Have (v2)
- [ ] Notificări push
- [ ] Chat cu educatoarea
- [ ] Export PDF rapoarte
- [ ] Aplicație mobile

### Future (v3)
- [ ] Plăți online
- [ ] Programări întâlniri
- [ ] Feedback activități
- [ ] Gamification

---

**Versiune:** 1.0  
**Data:** 10 Noiembrie 2025  
**Status:** 📋 Specificații Complete - Ready for Implementation
