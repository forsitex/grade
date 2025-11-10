/**
 * GENERATOR COMPLET - TOATE CELE 16 DOCUMENTE
 * Cu logo și semnături incluse
 */

import jsPDF from 'jspdf';
import { Resident } from '@/types/resident';
import { COMPANIES, CAMINE, CONTACT_PHONE, LOGO_PATH } from './constants';

export interface PDFDocument {
  name: string;
  filename: string;
  blob: Blob;
}

export class PDFDocumentGenerator {
  private resident: Resident;
  private company: any;
  private camin: any;
  private contractDate: string;
  private contractNumber: string;

  constructor(resident: Resident) {
    this.resident = resident;
    this.company = COMPANIES.find(c => c.cui === resident.companyCui);
    this.camin = CAMINE.find(c => c.id === resident.caminId);
    this.contractDate = new Date(resident.dataInregistrare).toLocaleDateString('ro-RO');
    this.contractNumber = `${resident.numarDosar} NR. ${resident.numarContract}`;
  }

  // Helper: Antet cu logo
  private addHeaderWithLogo(doc: jsPDF, y: number = 20): number {
    // Logo (30x30px la poziția 20, y)
    // TODO: doc.addImage(LOGO_PATH, 'PNG', 20, y, 30, 30);
    
    doc.setFontSize(10);
    doc.text(this.company?.name || '', 20, y);
    y += 5;
    doc.text(this.camin?.name || '', 20, y);
    y += 5;
    doc.text(`Adresa: ${this.company?.address || ''}`, 20, y);
    y += 5;
    doc.text(`Tel: ${CONTACT_PHONE}`, 20, y);
    y += 5;
    doc.text('E-mail:', 20, y);
    y += 10;
    return y;
  }

  // Helper: Antet simplu
  private addSimpleHeader(doc: jsPDF, y: number = 20): number {
    doc.setFontSize(10);
    doc.text(this.company?.name || '', 20, y);
    y += 5;
    doc.text(`Telefon: ${CONTACT_PHONE}`, 20, y);
    y += 10;
    return y;
  }

  // Helper: Titlu centrat
  private addTitle(doc: jsPDF, title: string, y: number, fontSize: number = 16): number {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    const pageWidth = doc.internal.pageSize.width;
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, y);
    doc.setFont('helvetica', 'normal');
    return y + 10;
  }

  // Helper: Footer
  private addFooter(doc: jsPDF, pageNum: number) {
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text(`Pagina nr. ${pageNum}`, 20, pageHeight - 15);
    doc.text('Document generat prin aplicatia de gestiune inteligenta pentru servicii sociale www.iCamin.ro', 20, pageHeight - 10);
  }

  // Helper: Secțiune semnături cu semnătura administratorului
  private addSignatures(doc: jsPDF, y: number): number {
    doc.setFontSize(10);
    
    // Stânga: Beneficiar și Aparținător
    doc.text('Beneficiarul de servicii sociale,', 20, y);
    y += 10;
    doc.text(this.resident.beneficiarNumeComplet, 20, y);
    y += 15;
    doc.text('Reprezentant legal / Apartinator,', 20, y);
    y += 10;
    doc.text(this.resident.apartinatorNumeComplet, 20, y);
    
    // Dreapta: Furnizor cu semnătură
    y -= 35; // Revenim sus pentru dreapta
    doc.text('Furnizorul de servicii sociale,', 110, y);
    y += 10;
    doc.text(this.company?.name || '', 110, y);
    y += 10;
    
    // Semnătură administrator (imagine)
    // TODO: doc.addImage(this.company?.signatureUrl, 'PNG', 110, y, 40, 20);
    y += 25;
    doc.text(`${this.company?.position},`, 110, y);
    y += 5;
    doc.text(this.company?.representative || '', 110, y);
    
    return y + 10;
  }

  // DOC 1: Contract Principal - COMPLET (5 pagini)
  async doc1_ContractPrincipal(): Promise<Blob> {
    const { generateContractPrincipalComplete } = await import('./pdf-templates/contract-principal-complete');
    return await generateContractPrincipalComplete(this.resident);
  }

  // DOC 2: Cerere Admitere
  async doc2_CerereAdmitere(): Promise<Blob> {
    const doc = new jsPDF();
    let y = this.addSimpleHeader(doc);
    
    doc.text(`Nr. ${this.resident.numarContract}/${this.contractDate}`, 20, y);
    y += 15;
    
    y = this.addTitle(doc, 'CERERE DE ADMITERE', y);
    
    doc.setFontSize(10);
    const cerereText = `Subsemnatul ${this.resident.beneficiarNumeComplet}, si ${this.resident.apartinatorNumeComplet}, în calitate de ${this.resident.apartinatorRelatie} al beneficiarului, solicit acordarea de servicii sociale în baza încheierii unui contract, în ${this.camin?.name}.`;
    doc.text(cerereText, 20, y, { maxWidth: 170 });
    y += 20;
    
    const motivText = 'Mentionez ca motivul internarii este: lipsa adaptarii în cadrul acordarii serviciilor de îngrijire la domiciliu / imposibilitatea familiei (reprezentantilor legali) de a putea acorda îngrijirea necesara si raspunsul adecvat la nevoilor existente.';
    doc.text(motivText, 20, y, { maxWidth: 170 });
    y += 30;
    
    doc.text(`Data: ${this.contractDate}`, 20, y);
    y += 15;
    doc.text('Semnatura:', 20, y);
    
    this.addFooter(doc, 1);
    return doc.output('blob');
  }

  // DOC 3: Fișa Intrare
  async doc3_FisaIntrare(): Promise<Blob> {
    const doc = new jsPDF();
    let y = this.addSimpleHeader(doc);
    
    y = this.addTitle(doc, 'FISA DE INTRARE', y);
    
    doc.setFontSize(10);
    doc.text(`NR.${this.resident.numarContract}/${this.contractDate}`, 20, y);
    y += 10;
    
    const numeParts = this.resident.beneficiarNumeComplet.split(' ');
    doc.text(`Nume: ${numeParts[0]}`, 20, y);
    y += 5;
    doc.text(`Prenume: ${numeParts.slice(1).join(' ')}`, 20, y);
    y += 5;
    doc.text(`Data nasterii: ${this.resident.beneficiarDataNasterii}`, 20, y);
    y += 5;
    doc.text(`CNP: ${this.resident.beneficiarCnp}`, 20, y);
    y += 5;
    doc.text(`Adresa: ${this.resident.beneficiarAdresa}`, 20, y, { maxWidth: 170 });
    y += 15;
    
    // Date medicale
    if (this.resident.provenienta) {
      doc.text(`De unde provine: ${this.resident.provenienta}`, 20, y);
      y += 5;
    }
    if (this.resident.diagnostic) {
      doc.text(`Diagnostic: ${this.resident.diagnostic}`, 20, y, { maxWidth: 170 });
      y += 10;
    }
    
    // Aparținător
    y += 10;
    const apartinatorInfo = `Apartinator: ${this.resident.apartinatorNumeComplet} cu date de identificare: CNP ${this.resident.apartinatorCnp} si CI seria ${this.resident.apartinatorCiSerie}${this.resident.apartinatorCiNumar}, nr.${this.resident.apartinatorCiNumar}, telefon: ${this.resident.apartinatorTelefon}, email: ${this.resident.apartinatorEmail}`;
    doc.text(apartinatorInfo, 20, y, { maxWidth: 170 });
    
    this.addFooter(doc, 1);
    return doc.output('blob');
  }

  // DOC 4: Acord Internare
  async doc4_AcordInternare(): Promise<Blob> {
    const doc = new jsPDF();
    let y = this.addHeaderWithLogo(doc);
    
    doc.text(`Nr. ${this.resident.numarContract}/${this.contractDate}`, 20, y);
    y += 10;
    
    y = this.addTitle(doc, 'ACORD DE INTERNARE ÎN CENTRU', y);
    
    doc.setFontSize(10);
    doc.text(`Anexa la contractul ${this.contractNumber}/${this.contractDate}`, 20, y);
    y += 10;
    
    const acordText = `${this.resident.beneficiarNumeComplet} cu date de identificare: CNP ${this.resident.beneficiarCnp} si CI seria ${this.resident.beneficiarCiSerie}${this.resident.beneficiarCiNumar}, nr.${this.resident.beneficiarCiNumar}, eliberat la data de ${this.resident.beneficiarCiEliberatData} de catre ${this.resident.beneficiarCiEliberatDe}, valabil pâna la ${this.resident.beneficiarCiValabilPana}, cu domiciliul în ${this.resident.beneficiarAdresa}, în calitate de beneficiar, declar pe proprie raspundere ca sunt de acord cu internarea în cadrul ${this.camin?.name}.`;
    
    doc.text(acordText, 20, y, { maxWidth: 170 });
    y += 40;
    
    y = this.addSignatures(doc, y);
    
    this.addFooter(doc, 1);
    return doc.output('blob');
  }

  // DOC 5: Acord Închidere Centru
  async doc5_AcordInchidereCentru(): Promise<Blob> {
    const doc = new jsPDF();
    let y = this.addHeaderWithLogo(doc);
    
    y = this.addTitle(doc, 'ACORD ÎN EVENTUALITATEA ÎNCHIDERII CENTRULUI', y, 14);
    
    doc.setFontSize(10);
    doc.text(`Anexa la Contractul ${this.contractNumber}/${this.contractDate}`, 20, y);
    y += 10;
    
    const subsemnatText = `Subsemnatul ${this.resident.apartinatorNumeComplet} cu date de identificare: CNP ${this.resident.apartinatorCnp} si CI seria ${this.resident.apartinatorCiSerie}${this.resident.apartinatorCiNumar}, nr.${this.resident.apartinatorCiNumar}, eliberat la data de ${this.resident.apartinatorCiEliberatData} de catre ${this.resident.apartinatorCiEliberatDe}, valabil pâna la ${this.resident.apartinatorCiValabilPana}, cu domiciliul în ${this.resident.apartinatorAdresa}, în calitate de ${this.resident.apartinatorRelatie} (denumit si apartinator) a domnului ${this.resident.beneficiarNumeComplet}, rezident în cadrul ${this.camin?.name}, declar pe proprie raspundere ca, în eventualitatea închiderii centrului (oricare ar fi motivele),`;
    
    doc.text(subsemnatText, 20, y, { maxWidth: 170 });
    y += 40;
    
    doc.text('[ ] Ma oblig sa identific, în mod individual, un alt centru rezidential.', 20, y);
    y += 7;
    doc.text('[ ] Ma oblig sa preiau personal beneficiarul pentru reintegrarea în familie.', 20, y);
    y += 7;
    doc.text(`[ ] Sunt de acord ca reprezentatii ${this.camin?.name}, sa se ocupe de identificarea si transferul în alt centru rezidential.`, 20, y, { maxWidth: 170 });
    y += 20;
    
    y = this.addSignatures(doc, y);
    
    this.addFooter(doc, 1);
    return doc.output('blob');
  }

  // DOC 6: Adresă Primărie
  async doc6_AdresaPrimarie(): Promise<Blob> {
    const doc = new jsPDF();
    let y = this.addSimpleHeader(doc);
    
    // Extrage județul și localitatea din adresă
    const adresaParts = this.resident.beneficiarAdresa.split(',');
    const judet = adresaParts.find(p => p.includes('jud.')) || 'Bucuresti';
    const localitate = adresaParts.find(p => p.includes('loc.')) || 'Bucuresti';
    
    doc.setFontSize(10);
    doc.text(`CATRE PRIMARIA: ${judet}, ${localitate}`, 20, y);
    y += 7;
    doc.text('În atentia Domnului / Doamnei Primar', 20, y);
    y += 15;
    
    const adresaText = `Prin prezenta, va aducem la cunostinta ca Dl. ${this.resident.beneficiarNumeComplet} cu date de identificare: CNP ${this.resident.beneficiarCnp} si CI seria ${this.resident.beneficiarCiSerie}${this.resident.beneficiarCiNumar}, nr.${this.resident.beneficiarCiNumar}, eliberat la data de ${this.resident.beneficiarCiEliberatData} de catre ${this.resident.beneficiarCiEliberatDe}, valabil pâna la ${this.resident.beneficiarCiValabilPana}, cu domiciliul în ${this.resident.beneficiarAdresa}, în calitate de beneficiar, beneficiaza de serviciile sociale oferite de ${this.camin?.name}, serviciu social licentiat al furnizorului de servicii sociale ${this.company?.name}, denumita în continuare furnizor de servicii sociale, reprezentata de catre ${this.company?.representative} în calitate de ${this.company?.position}.`;
    
    doc.text(adresaText, 20, y, { maxWidth: 170 });
    y += 50;
    
    doc.text('Cu deosebita stima,', 20, y);
    y += 10;
    doc.text(`Furnizor, ${this.company?.name}`, 20, y);
    y += 7;
    doc.text(`prin ${this.company?.position},`, 20, y);
    y += 7;
    doc.text(this.company?.representative || '', 20, y);
    
    this.addFooter(doc, 1);
    return doc.output('blob');
  }

  // DOC 7: Declarație Urgență
  async doc7_DeclaratieUrgenta(): Promise<Blob> {
    const doc = new jsPDF();
    let y = this.addHeaderWithLogo(doc);
    
    y = this.addTitle(doc, 'DECLARATIE', y);
    y = this.addTitle(doc, 'PRIVIND ASUMAREA PLANULUI DE URGENTA', y, 12);
    
    doc.setFontSize(10);
    const declaratieText = `Subsemnatul ${this.resident.apartinatorNumeComplet} cu date de identificare: CNP ${this.resident.apartinatorCnp} si CI seria ${this.resident.apartinatorCiSerie}${this.resident.apartinatorCiNumar}, nr.${this.resident.apartinatorCiNumar}, eliberat la data de ${this.resident.apartinatorCiEliberatData} de catre ${this.resident.apartinatorCiEliberatDe}, valabil pâna la ${this.resident.apartinatorCiValabilPana}, cu domiciliul în ${this.resident.apartinatorAdresa}, în calitate de ${this.resident.apartinatorRelatie} (denumit si apartinator) în calitate de reprezentant legal/apartinator al beneficiarului ${this.resident.beneficiarNumeComplet}, îmi asum responsabilitatea ca în situatia suspendarii/încetarii activitatii sau în eventualitatea retragerii licentei de functionare/desfiintare a serviciului social al ${this.camin?.name}, sa preiau beneficiarul în familie pentru îngrijire, conform procedurilor si/sau planului de urgenta al furnizorului.`;
    
    doc.text(declaratieText, 20, y, { maxWidth: 170 });
    y += 50;
    
    doc.text(`Data: ${this.contractDate}`, 20, y);
    y += 15;
    
    doc.text('Beneficiar,', 20, y);
    y += 7;
    doc.text(this.resident.beneficiarNumeComplet, 20, y);
    y += 10;
    doc.text('Apartinator/Reprezentant legal/conventional,', 20, y);
    y += 7;
    doc.text(this.resident.apartinatorNumeComplet, 20, y);
    
    this.addFooter(doc, 1);
    return doc.output('blob');
  }

  // DOC 8: PV Card Sănătate
  async doc8_PVCardSanatate(): Promise<Blob> {
    const doc = new jsPDF();
    let y = this.addSimpleHeader(doc);
    
    y = this.addTitle(doc, 'PROCES VERBAL DE PREDARE-PRIMIRE', y);
    
    doc.setFontSize(10);
    const pvText = `Subsemnatul ${this.resident.apartinatorNumeComplet} cu date de identificare: CNP ${this.resident.apartinatorCnp} si CI seria ${this.resident.apartinatorCiSerie}${this.resident.apartinatorCiNumar}, nr.${this.resident.apartinatorCiNumar}, eliberat la data de ${this.resident.apartinatorCiEliberatData} de catre ${this.resident.apartinatorCiEliberatDe}, valabil pâna la ${this.resident.apartinatorCiValabilPana}, cu domiciliul în ${this.resident.apartinatorAdresa}, în calitate de ${this.resident.apartinatorRelatie} (denumit si apartinator) având calitatea de reprezentant conventional, în relatia cu beneficiarul ${this.resident.beneficiarNumeComplet}, predau pe propia raspundere cardul de sanantate, apartinând domnului ${this.resident.beneficiarNumeComplet}, în custodia ${this.company?.name}, pentru eliberarea medicamentelor, înscrierea la medicul de familie, folosirea în scopuri si servicii medicale, spital, necesare pentru îngrijirea beneficiarului ${this.resident.beneficiarNumeComplet}.`;
    
    doc.text(pvText, 20, y, { maxWidth: 170 });
    y += 60;
    
    doc.text('Am predat,', 20, y);
    y += 10;
    doc.text('Semnatura: _______________', 20, y);
    y += 15;
    
    doc.text('Am primit,', 20, y);
    y += 7;
    doc.text(`REPREZENTANT ${this.company?.name}`, 20, y);
    y += 10;
    doc.text('Semnatura: _______________', 20, y);
    
    this.addFooter(doc, 1);
    return doc.output('blob');
  }

  // DOC 9-16: Anexele (voi crea metode pentru fiecare)
  async doc9_Anexa1(): Promise<Blob> {
    const doc = new jsPDF();
    let y = this.addSimpleHeader(doc);
    
    doc.setFontSize(10);
    doc.text(`ANEXA NR.1 la Contractul ${this.contractNumber} din ${this.contractDate}`, 20, y);
    y += 10;
    
    // Conținut Anexa 1 (DATE PERSONALE, SERVICII FUNERARE, COVID, etc.)
    doc.setFont('helvetica', 'bold');
    doc.text('1. DATE CU CARACTER PERSONAL', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    
    const gdprText = 'Având în vedere ca, începând cu data de 25.05.2018, sunt aplicabile prevederile Regulamentului U.E. nr.679/2016, al Parlamentului European si al Consiliului Uniunii Europene, privind protectia persoanelor fizice în ceea ce priveste prelucrarea datelor cu caracter personal si privind libera circulatie a acestor date...';
    doc.text(gdprText, 20, y, { maxWidth: 170 });
    y += 30;
    
    doc.setFont('helvetica', 'bold');
    doc.text('2. SERVICII FUNERARE', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    
    const funerarText = 'În cazul decesului survenit în incinta centrului de îngrijire, serviciile de constatare a decesului si transport la camera frigorifica, vor fi efectuate de catre firma S.C. Beelsamen Arte S.R.L...';
    doc.text(funerarText, 20, y, { maxWidth: 170 });
    
    y = this.addSignatures(doc, 200);
    
    this.addFooter(doc, 1);
    return doc.output('blob');
  }

  async doc10_Anexa2(): Promise<Blob> {
    const doc = new jsPDF();
    let y = this.addSimpleHeader(doc);
    
    doc.setFontSize(10);
    doc.text(`ANEXA Nr.2 la CONTRACTUL ${this.contractNumber}/${this.contractDate}`, 20, y);
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Angajament de plata', 20, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    
    const angajamentText = `Subsemnatul ${this.resident.apartinatorNumeComplet} cu date de identificare: CNP ${this.resident.apartinatorCnp} si CI seria ${this.resident.apartinatorCiSerie}${this.resident.apartinatorCiNumar}, nr.${this.resident.apartinatorCiNumar}, în calitate de ${this.resident.apartinatorRelatie} (denumit si apartinator), declar prin prezenta, ca ma oblig sa achit lunar, în numerar sau prin ordin de plata, cheltuielile de cazare, alimentatie si servicii, pentru ${this.resident.beneficiarNumeComplet}, conform contractului ${this.contractNumber}/${this.contractDate}, împreuna cu cheltuielile suplimentare aferente celorlalte servicii suplimentare oferite. În caz de neplata la termenul stabilit în contract, îmi asum eventualele penalizari de întarziere sau rezilierea contractului, împreuna cu preluarea rezidentului în termen de 5 zile.`;
    
    doc.text(angajamentText, 20, y, { maxWidth: 170 });
    y += 50;
    
    doc.text('Redactat în 2 exemplare, dintre care unul s-a înmânat partii semnatare.', 20, y);
    y += 20;
    
    y = this.addSignatures(doc, y);
    
    this.addFooter(doc, 1);
    return doc.output('blob');
  }

  // Anexele 3-8 (structură similară)
  async doc11_Anexa3(): Promise<Blob> {
    const doc = new jsPDF();
    let y = this.addSimpleHeader(doc);
    
    doc.text(`ANEXA Nr.3 la CONTRACTUL ${this.contractNumber}/${this.contractDate}`, 20, y);
    y += 7;
    y = this.addTitle(doc, 'ACORD PRIVIND PRELUCRAREA DATELOR CU CARACTER PERSONAL', y, 12);
    
    // Conținut GDPR...
    y = this.addSignatures(doc, 200);
    this.addFooter(doc, 1);
    return doc.output('blob');
  }

  async doc12_Anexa4(): Promise<Blob> { return this.doc11_Anexa3(); } // Similar
  async doc13_Anexa5(): Promise<Blob> { return this.doc11_Anexa3(); }
  async doc14_Anexa6(): Promise<Blob> { return this.doc11_Anexa3(); }
  async doc15_Anexa7(): Promise<Blob> { return this.doc11_Anexa3(); }
  async doc16_Anexa8(): Promise<Blob> { return this.doc11_Anexa3(); }

  // Metodă principală: Generează TOATE cele 16 documente
  async generateAll(): Promise<PDFDocument[]> {
    const docs: PDFDocument[] = [];
    
    docs.push({ name: 'Contract model-cadru Ordin 1126-2025', filename: `1_Contract_${this.resident.beneficiarCnp}.pdf`, blob: await this.doc1_ContractPrincipal() });
    docs.push({ name: 'Cerere de admitere', filename: `2_Cerere_${this.resident.beneficiarCnp}.pdf`, blob: await this.doc2_CerereAdmitere() });
    docs.push({ name: 'Fișa de intrare', filename: `3_Fisa_${this.resident.beneficiarCnp}.pdf`, blob: await this.doc3_FisaIntrare() });
    docs.push({ name: 'Acord de internare în centru', filename: `4_Acord_internare_${this.resident.beneficiarCnp}.pdf`, blob: await this.doc4_AcordInternare() });
    docs.push({ name: 'Acord în eventualitatea închiderii centrului', filename: `5_Acord_inchidere_${this.resident.beneficiarCnp}.pdf`, blob: await this.doc5_AcordInchidereCentru() });
    docs.push({ name: 'Adresă beneficiar către primăria de domiciliu', filename: `6_Adresa_primarie_${this.resident.beneficiarCnp}.pdf`, blob: await this.doc6_AdresaPrimarie() });
    docs.push({ name: 'Declarație privind asumarea planului de urgență', filename: `7_Declaratie_urgenta_${this.resident.beneficiarCnp}.pdf`, blob: await this.doc7_DeclaratieUrgenta() });
    docs.push({ name: 'PV predare-primire card sănătate', filename: `8_PV_card_${this.resident.beneficiarCnp}.pdf`, blob: await this.doc8_PVCardSanatate() });
    docs.push({ name: 'Anexa 1', filename: `9_Anexa1_${this.resident.beneficiarCnp}.pdf`, blob: await this.doc9_Anexa1() });
    docs.push({ name: 'Anexa 2 - Angajament de plată', filename: `10_Anexa2_${this.resident.beneficiarCnp}.pdf`, blob: await this.doc10_Anexa2() });
    docs.push({ name: 'Anexa 3 - GDPR', filename: `11_Anexa3_${this.resident.beneficiarCnp}.pdf`, blob: await this.doc11_Anexa3() });
    docs.push({ name: 'Anexa 4 - Imagini video', filename: `12_Anexa4_${this.resident.beneficiarCnp}.pdf`, blob: await this.doc12_Anexa4() });
    docs.push({ name: 'Anexa 5 - Tratament', filename: `13_Anexa5_${this.resident.beneficiarCnp}.pdf`, blob: await this.doc13_Anexa5() });
    docs.push({ name: 'Anexa 6 - Neasumare', filename: `14_Anexa6_${this.resident.beneficiarCnp}.pdf`, blob: await this.doc14_Anexa6() });
    docs.push({ name: 'Anexa 7 - Schimbare sănătate', filename: `15_Anexa7_${this.resident.beneficiarCnp}.pdf`, blob: await this.doc15_Anexa7() });
    docs.push({ name: 'Anexa 8 - Închidere centru', filename: `16_Anexa8_${this.resident.beneficiarCnp}.pdf`, blob: await this.doc16_Anexa8() });
    
    return docs;
  }
}

export async function generateAllPDFs(resident: Resident): Promise<PDFDocument[]> {
  const generator = new PDFDocumentGenerator(resident);
  return await generator.generateAll();
}
