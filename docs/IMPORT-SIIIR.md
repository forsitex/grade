# 📥 Import SIIIR - Documentație

## Funcționalitate

Permite importul automat al listelor de copii din fișierele exportate din SIIIR (Sistemul Informatic Integrat al Învățământului din România).

## Flux Utilizare

### 1. Manager se loghează în Gradinita.app
- Login cu email/parolă

### 2. Accesează Dashboard Grădiniță
- Click pe grădinița dorită
- Dashboard manager se deschide

### 3. Click "Import SIIIR"
- Card albastru cu badge "NOU" în secțiunea "Acțiuni Rapide"
- Redirect la `/gradinite/[id]/import-siiir`

### 4. Export din SIIIR (în alt tab)
- Login SIIIR: https://www.siiir.edu.ro/siiir/
- Modul "Elevi" → "Listă elevi"
- Click "Export" → Descarcă fișier `.xls`

### 5. Upload fișier în Gradinita.app
- Drag & Drop sau Click pentru selectare
- Acceptă: `.xls`, `.xlsx`

### 6. Preview Date
- Total copii găsiți
- Grupe unice
- Primii 5 copii (preview)
- Avertizări (dacă există erori)

### 7. Confirmă Import
- Click "Confirmă Import"
- Se procesează automat:
  - Parse Excel (header rând 6)
  - Creare grupe noi (automat)
  - Verificare duplicate CNP
  - Import copii în Firebase

### 8. Rezultat
- Copii importați: X
- Copii duplicate (ignorați): Y
- Grupe create automat: Z

## Date Importate

### Din SIIIR:
- ✅ CNP (13 cifre)
- ✅ Nume (formatat Title Case)
- ✅ Prenume (formatat Title Case)
- ✅ Sex (Masculin/Feminin)
- ✅ Data nașterii (convertit la ISO: YYYY-MM-DD)
- ✅ Grupă (ex: "Grupa mare A")

### Metadata:
- ✅ sursa: 'SIIIR'
- ✅ importedAt: Date
- ✅ createdAt: Date

### NU se importă (se adaugă manual):
- ❌ Părinți (nume, telefon, email)
- ❌ Contract (cost lunar, durată)
- ❌ Alergii, condiții medicale
- ❌ Adresă, fotografie

## Creare Automată Grupe

### Detectare Inteligentă:

**Vârstă:**
- "Grupa mare" → "5-6 ani"
- "Grupa mijlocie" → "4-5 ani"
- "Grupa mică" → "3-4 ani"
- "Creșă" → "1-3 ani"
- Default → "3-6 ani"

**Emoji:**
- "Grupa mare" → 🎓
- "Grupa mijlocie" → 📚
- "Grupa mică" → 🧸
- "Creșă" → 👶
- Literă A → 🎨
- Literă B → 🌟
- Literă C → 🌈
- Literă D → 🦋
- Default → 🎨

**Capacitate:** 25 copii (default)

### Proces:
1. Extrage grupe unice din Excel
2. Verifică ce grupe există deja
3. Creează automat grupele lipsă
4. Update document grădinița cu grupe noi
5. Importă copiii cu referință la grupa corectă

## Gestionare Duplicate

- **CNP existent:** Skip automat (nu importă)
- **Afișare:** "X copii duplicate (ignorați)"
- **Nu se suprascriu** datele existente

## Validare Date

### Obligatorii:
- CNP (13 cifre)
- Nume
- Grupă

### Opționale:
- Prenume
- Sex
- Data nașterii

### Erori:
- Rânduri cu erori sunt **ignorate**
- Import continuă cu rândurile valide
- Afișare avertizări în preview

## Structura Firebase

```
organizations/{userId}/
  └── locations/{locationId}/
      ├── grupe: [
      │     {
      │       id: "grupa-timestamp-random",
      │       nume: "Grupa mare A",
      │       varsta: "5-6 ani",
      │       capacitate: 25,
      │       educatori: [],
      │       emoji: "🎓",
      │       sursa: "SIIIR"
      │     }
      │   ]
      └── children/{cnp}/
            {
              cnp: "6200908450011",
              nume: "Oprea",
              prenume: "Ingrid Otilia",
              sex: "Feminin",
              dataNasterii: "2020-09-08",
              grupa: "Grupa mare A",
              sursa: "SIIIR",
              importedAt: Date,
              createdAt: Date
            }
```

## Fișiere Implementate

### Utils:
- `utils/grupaDetector.ts` - Detectare vârstă/emoji din nume grupă
- `utils/siiirParser.ts` - Parse Excel SIIIR + validare

### Pages:
- `app/gradinite/[id]/import-siiir/page.tsx` - Pagină upload & import

### Modified:
- `app/gradinite/[id]/page.tsx` - Adăugat card "Import SIIIR"

## Dependențe

- `xlsx` - Parse fișiere Excel (deja instalat)

## Testare

### Test Manual:
1. Login ca manager
2. Accesează grădiniță
3. Click "Import SIIIR"
4. Upload fișier test: `Lista elevi_13-11-2025.xls`
5. Verifică preview
6. Confirmă import
7. Verifică rezultat

### Verificări:
- ✅ Copii importați corect
- ✅ Grupe create automat
- ✅ Duplicate ignorate
- ✅ Erori gestionate corect

## Limitări

- **Format:** Doar Excel (.xls, .xlsx)
- **Structură:** Header pe rândul 6 (format SIIIR standard)
- **Duplicate:** Skip automat (nu update)
- **Părinți:** NU se importă (se adaugă manual)

## Viitor

- [ ] Update date existente (opțional)
- [ ] Import părinți (dacă SIIIR oferă date)
- [ ] Export înapoi în SIIIR
- [ ] Sincronizare automată periodică
- [ ] Browser extension pentru export direct
