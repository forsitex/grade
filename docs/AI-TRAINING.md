# 🤖 AI TRAINING - GRADINITA.APP

## Documentație Completă pentru Antrenare Chat AI

### PLATFORMĂ: Gradinita.App
**Tip:** SaaS (Software as a Service)  
**Țintă:** Grădinițe din România  
**Scop:** Management complet grădiniță (copii, grupe, prezență, financiar, meniu)

---

## 📋 FUNCȚIONALITĂȚI PRINCIPALE

### 1. IMPORT SIIIR ⭐
**Ce face:** Import automat liste copii din SIIIR (Sistemul Informatic Integrat Învățământ România)

**Pași:**
1. Dashboard grădiniță → Click "Import SIIIR"
2. Upload fișier Excel `.xls` exportat din SIIIR
3. Preview automat (copii, grupe, erori)
4. Confirmă import
5. Grupele și copiii se creează automat

**Detalii tehnice:**
- Header pe rândul 6
- Câmpuri: CNP, Nume, Prenume, Sex, Data nașterii, Grupă
- Validare CNP (13 cifre obligatorii)
- Skip duplicate automat (verificare CNP)
- Detectare inteligentă vârstă/emoji pentru grupe
- Buton "Șterge toți copiii" pentru re-import

**Exemple grupe detectate:**
- "Grupa mică A" → 3-4 ani, emoji 🐻
- "Grupa mijlocie B" → 4-5 ani, emoji 🦊
- "Grupa mare C" → 5-6 ani, emoji 🦁
- "Pregătitoare" → 6-7 ani, emoji 🎓

---

### 2. GESTIONARE COPII 👶

**Adăugare manuală:**
1. Dashboard grădiniță → "Adaugă Copil"
2. Completează formular:
   - CNP (obligatoriu, 13 cifre)
   - Nume complet
   - Data nașterii (vârsta se calculează automat)
   - Adresă
   - Grupă (selectare din listă)
   - Program (Normal/Prelungit)
3. Date părinți:
   - Părinte 1: nume, telefon, email, CNP
   - Părinte 2: nume, telefon, email, CNP
4. Contract:
   - Taxă lunară
   - Data înscriere
   - Mese incluse (da/nu)
5. Opțional:
   - Alergii
   - Condiții medicale
   - Foto profil
6. Salvează

**Editare copil:**
1. Click pe copil din listă
2. Click "Editează"
3. Modifică câmpurile dorite
4. Salvează

**Important:**
- CNP = ID unic în Firebase
- Părintele primește acces la dashboard după completare email/parolă
- Toate câmpurile se salvează în `organizations/{uid}/locations/{gradinitaId}/children/{cnp}`

---

### 3. GESTIONARE GRUPE 🎨

**Creare grupă:**
1. Dashboard → "Gestionează Grupe"
2. Click "Adaugă Grupă"
3. Completează:
   - Nume (ex: "Grupa Mare A")
   - Vârstă (ex: "5-6 ani")
   - Capacitate (ex: 25 copii)
   - Educatoare (nume)
   - Email educatoare (pentru login)
   - Parolă educatoare
   - Sală (opțional)
   - Emoji (opțional)
4. Salvează

**Tipuri grupe standard:**
- **Grupă Mică:** 3-4 ani, 🐻
- **Grupă Mijlocie:** 4-5 ani, 🦊
- **Grupă Mare:** 5-6 ani, 🦁
- **Pregătitoare:** 6-7 ani, 🎓

**Alocare copii:**
1. Click pe grupă
2. "Gestionează Copii"
3. Bifează copiii pentru grupă
4. Salvează

**Acces educatoare:**
- Login cu email + parolă setate de manager
- Poate marca prezență
- Poate vizualiza copii din grupa ei
- NU poate șterge/crea grupe

---

### 4. PREZENȚĂ ✅

**Marcare prezență (Educatoare):**
1. Login cu email educatoare
2. Dashboard → Click "Prezență"
3. Selectează data (default: azi)
4. Bifează copiii prezenți
5. Click "Salvează Prezența"
6. Confirmă

**Vizualizare prezență (Manager):**
- Dashboard: card "Prezenți Azi" (număr + procent)
- Dashboard: card "Prezență %" (procent lunar)
- Click pe card → Istoric complet
- Filtrare pe grupă/perioadă

**Structură Firebase:**
```
children/{cnp}/attendance/{date}
  └── { status: 'present'/'absent', checkInTime: '08:30', checkOutTime: '16:00' }
```

**Statistici:**
- Prezență zilnică (actualizare automată)
- Prezență lunară (calcul automat)
- Prezență pe grupă
- Istoric complet

---

### 5. RAPOARTE FINANCIARE 💰

**Raport Total:**
1. Dashboard → "Raport Financiar TOTAL"
2. Selectează luna
3. Vezi:
   - Total încasări
   - Total așteptat
   - Restanțe
   - Statistici pe grupă
4. Export Excel/PDF

**Raport Grupe:**
1. Dashboard → "Raport Financiar GRUPE"
2. Selectează grupă
3. Selectează luna
4. Vezi:
   - Copii cu plată la zi
   - Copii cu restanțe
   - Total încasat
   - Total de încasat
5. Export Excel/PDF

**Date incluse:**
- Taxă lunară per copil
- Status plată (plătit/neplătit)
- Restanțe
- Istoric plăți

---

### 6. OPȚIONALE 🎓

**Ce sunt:** Activități extra-curriculare (limbi străine, sport, muzică, dans, etc.)

**Adăugare opțional:**
1. Dashboard → "Opționale"
2. Click "Adaugă Opțional"
3. Completează:
   - Nume (ex: "Limba Engleză")
   - Preț lunar (ex: 150 lei)
   - Icon (selectare din listă)
4. Salvează

**Alocare copii:**
1. Click pe opțional
2. "Gestionează Copii"
3. Bifează copiii înscriși
4. Salvează

**Permisiuni:**
- Manager: create, update, delete
- Educatoare: doar alocare copii (NU delete)
- Părinți: vizualizare (read only)

---

### 7. MENIU SĂPTĂMÂNAL 🍽️

**Creare meniu:**
1. Dashboard → "Meniu"
2. Selectează săptămână
3. Pentru fiecare zi (L-V):
   - Mic dejun
   - Gustare dimineață
   - Prânz
   - Gustare după-amiază
4. Adaugă ingrediente
5. Marchează alergeni
6. Salvează

**Vizualizare:**
- Părinți: dashboard → "Meniu Săptămânal"
- Export PDF pentru printare
- Notificări la schimbări

---

### 8. MESAJE 💬

**Trimitere mesaj:**
1. Dashboard → "Mesaje"
2. Selectează destinatari:
   - Toți părinții
   - O grupă
   - Individual
3. Scrie mesaj
4. Trimite

**Tipuri mesaje:**
- Anunțuri generale
- Evenimente
- Notificări
- Reamintiri plăți

---

### 9. EDITARE GRĂDINIȚĂ ✏️

**Acces:**
1. Dashboard → Click ✏️ pe card grădiniță
2. Sau: Dashboard → "Vezi detalii" → "Editează"

**Câmpuri editabile:**

**Informații generale:**
- Nume grădiniță
- Adresă completă
- Capacitate (număr copii)
- Program (Normal/Prelungit/Flexibil)

**Contact grădiniță:**
- Telefon
- Email

**Reprezentant (Director/Manager):**
- Nume complet
- Telefon
- Email

**Salvare:**
- Click "Salvează Modificările"
- Actualizare instant în Firebase
- Redirect la dashboard

---

### 10. DASHBOARD MANAGER 📊

**Statistici (carduri):**
1. **Capacitate Totală:** Număr locuri disponibile
2. **Copii Înscriși:** Număr copii activi
3. **Prezență Azi:** Procent + număr prezenți (date reale)
4. **Grupe Active:** Număr grupe create

**Acțiuni rapide:**
- Raport Financiar TOTAL
- Raport Financiar GRUPE
- Mesaje

**Card grădiniță:**
- Nume, adresă
- Capacitate, înscriși, grupe, program
- Butoane: "Vezi detalii", "Editează"

**FAQ (5 întrebări):**
1. Cum fac import din SIIIR?
2. Cum adaug detalii părinți?
3. Cum marchează educatoarea prezența?
4. Cum generez rapoarte financiare?
5. Cum adaug un copil manual?

**Contact suport:**
- Ionut Stancu
- Tel: 0785 598 779
- Email: suport@gradinita.app
- Program: L-V, 9:00-18:00

---

## 🔧 STRUCTURA FIREBASE

```
organizations/{uid}/
  └── locations/{gradinitaId}/
      ├── grupe: [
      │     { id, nume, varsta, capacitate, educatori, sala, emoji }
      │   ]
      ├── children/{cnp}/
      │   ├── nume, prenume, cnp, dataNasterii, varsta
      │   ├── adresa, grupa, program
      │   ├── parinte1: { nume, telefon, email, cnp }
      │   ├── parinte2: { nume, telefon, email, cnp }
      │   ├── contract: { taxaLunara, dataInscriere, meseIncluse }
      │   ├── alergii, conditiiMedicale, fotoUrl
      │   └── attendance/{date}/
      │       └── { status, checkInTime, checkOutTime }
      ├── optionale/{id}/
      │   └── { nume, pret, icon, copii: [] }
      └── meniu/{saptamana}/
          └── { zile: [], mese: [] }
```

---

## 👥 ROLURI UTILIZATORI

### Manager (Proprietar grădiniță)
**Acces:** Complet (CRUD - Create, Read, Update, Delete)
**Funcționalități:**
- Import SIIIR
- Gestionare copii (adaugă, editează, șterge)
- Gestionare grupe (creează, editează, șterge)
- Vizualizare prezență (toate grupele)
- Rapoarte financiare (toate)
- Opționale (create, delete, alocare)
- Meniu (create, update)
- Mesaje (trimite către toți)
- Editare grădiniță

### Educatoare
**Acces:** Limitat (Read, Update parțial)
**Funcționalități:**
- Login cu email + parolă (setate de manager)
- Marcare prezență (doar grupa ei)
- Vizualizare copii (doar grupa ei)
- Opționale (doar alocare copii, NU delete)
- Vizualizare meniu
- NU poate: crea/șterge grupe, copii, opționale

### Părinți
**Acces:** Minimal (Read only)
**Funcționalități:**
- Vizualizare copil (date, prezență)
- Vizualizare meniu săptămânal
- Primire mesaje
- Vizualizare opționale înscrise
- NU poate: edita nimic

---

## 📞 CONTACT SUPORT

**Persoană:** Ionut Stancu  
**Telefon:** 0785 598 779  
**Email:** suport@gradinita.app  
**Program:** Luni - Vineri, 9:00 - 18:00

---

## 💡 INSTRUCȚIUNI RĂSPUNS AI

### Stil comunicare:
- ✅ Concis și la subiect
- ✅ Pași clari și numerotați
- ✅ Emoji pentru claritate (👶 ✅ ❌ 📝 💰 etc.)
- ✅ Exemple concrete
- ✅ Menționează locația în platformă

### Structură răspuns ideal:
```
1. Răspuns direct la întrebare
2. Pași numerotați (dacă e cazul)
3. Exemplu concret
4. Link/locație în platformă
5. Notă/avertisment (dacă e cazul)
```

### Exemple răspunsuri:

**Întrebare:** "Cum adaug un copil?"

**Răspuns AI:**
```
Pentru a adăuga un copil manual:

1. Mergi la Dashboard grădiniță
2. Click pe butonul "Adaugă Copil"
3. Completează câmpurile obligatorii:
   - CNP (13 cifre) ✅
   - Nume complet
   - Data nașterii
   - Grupă
4. Adaugă date părinți (opțional acum, obligatoriu pentru acces)
5. Click "Salvează"

💡 **Sfat:** Dacă ai multe copii, folosește "Import SIIIR" pentru import automat din fișierul Excel!

📍 **Locație:** Dashboard → Butonul albastru "Adaugă Copil"
```

**Întrebare:** "De ce nu văd prezența?"

**Răspuns AI:**
```
Prezența nu apare din următoarele motive:

1. ❌ Nu a fost marcată azi de educatoare
2. ❌ Copiii nu au fost alocați la grupe
3. ❌ Educatoarea nu are acces (email/parolă)

✅ **Soluție:**
1. Verifică dacă educatoarea a marcat prezența azi
2. Verifică Dashboard → Card "Prezenți Azi" (ar trebui să arate număr)
3. Dacă e 0, educatoarea trebuie să marcheze prezența

📍 **Educatoare:** Login → "Prezență" → Bifează prezenți → Salvează

❓ Dacă problema persistă, contactează suportul: 0785 598 779
```

---

## 🎯 CAZURI SPECIALE

### Import SIIIR eșuat
**Cauze:**
- Fișier greșit (nu .xls)
- Header nu e pe rândul 6
- CNP lipsă sau invalid
- Coloane lipsă

**Soluție:**
1. Verifică fișierul exportat din SIIIR
2. Asigură-te că are header pe rândul 6
3. Verifică că toate coloanele sunt prezente
4. Re-încearcă import

### Educatoare nu poate marca prezență
**Cauze:**
- Email/parolă greșite
- Nu e alocată la grupă
- Grupa nu există

**Soluție:**
1. Manager verifică email/parolă educatoare
2. Manager verifică că educatoarea e în lista grupei
3. Re-login educatoare

### Părinți nu au acces
**Cauze:**
- Email/parolă nu au fost setate
- Date părinți incomplete

**Soluție:**
1. Manager editează copil
2. Completează date Părinte 1/2
3. Setează email + parolă
4. Părintele poate face login

---

## 📚 RESURSE UTILE

- **Documentație SIIIR:** [IMPORT-SIIIR.md](./IMPORT-SIIIR.md)
- **Suport:** suport@gradinita.app
- **Telefon:** 0785 598 779
- **Program:** L-V, 9:00-18:00

---

**Ultima actualizare:** 13 Noiembrie 2025  
**Versiune:** 1.0  
**Status:** Producție
