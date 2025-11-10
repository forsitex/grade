import jsPDF from 'jspdf';
import { Resident } from '@/types/resident';
import { COMPANIES, CAMINE, LOGO_URL, CONTACT_PHONE } from './constants';

// Font românesc pentru caractere speciale
const FONT_SIZE = {
  TITLE: 16,
  SUBTITLE: 14,
  HEADING: 12,
  BODY: 10,
  SMALL: 8
};

const MARGIN = {
  LEFT: 20,
  RIGHT: 20,
  TOP: 20,
  BOTTOM: 20
};

export class PDFGenerator {
  private doc: jsPDF;
  private resident: Resident;
  private company: any;
  private camin: any;
  private currentY: number = MARGIN.TOP;

  constructor(resident: Resident) {
    this.doc = new jsPDF();
    this.resident = resident;
    this.company = COMPANIES.find(c => c.cui === resident.companyCui);
    this.camin = CAMINE.find(c => c.id === resident.caminId);
    this.currentY = MARGIN.TOP;
  }

  // Helper: Adaugă antet standard
  private addHeader(documentTitle: string) {
    const pageWidth = this.doc.internal.pageSize.width;
    
    // Organizație
    this.doc.setFontSize(FONT_SIZE.BODY);
    this.doc.text(this.company?.name || '', MARGIN.LEFT, this.currentY);
    this.currentY += 5;
    
    // Cămin
    this.doc.text(this.camin?.name || '', MARGIN.LEFT, this.currentY);
    this.currentY += 5;
    
    // Contact
    this.doc.text(`Tel: ${CONTACT_PHONE}`, MARGIN.LEFT, this.currentY);
    this.currentY += 10;
    
    // Titlu document
    this.doc.setFontSize(FONT_SIZE.TITLE);
    this.doc.setFont('helvetica', 'bold');
    const titleWidth = this.doc.getTextWidth(documentTitle);
    this.doc.text(documentTitle, (pageWidth - titleWidth) / 2, this.currentY);
    this.currentY += 10;
    
    this.doc.setFont('helvetica', 'normal');
  }

  // Helper: Adaugă footer
  private addFooter(pageNumber: number) {
    const pageHeight = this.doc.internal.pageSize.height;
    const pageWidth = this.doc.internal.pageSize.width;
    
    this.doc.setFontSize(FONT_SIZE.SMALL);
    this.doc.text(
      `Pagina nr. ${pageNumber}`,
      MARGIN.LEFT,
      pageHeight - 15
    );
    
    this.doc.text(
      'Document generat prin aplicatia de gestiune inteligenta pentru servicii sociale www.iCamin.ro',
      MARGIN.LEFT,
      pageHeight - 10
    );
  }

  // Helper: Verifică dacă trebuie pagină nouă
  private checkNewPage(spaceNeeded: number = 20) {
    const pageHeight = this.doc.internal.pageSize.height;
    if (this.currentY + spaceNeeded > pageHeight - MARGIN.BOTTOM - 20) {
      this.doc.addPage();
      this.currentY = MARGIN.TOP;
      return true;
    }
    return false;
  }

  // Helper: Text cu wrap
  private addText(text: string, x: number, fontSize: number = FONT_SIZE.BODY, bold: boolean = false) {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    
    const pageWidth = this.doc.internal.pageSize.width;
    const maxWidth = pageWidth - MARGIN.LEFT - MARGIN.RIGHT;
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    lines.forEach((line: string) => {
      this.checkNewPage();
      this.doc.text(line, x, this.currentY);
      this.currentY += fontSize * 0.4;
    });
  }

  // DOCUMENT 1: Contract Principal
  async generateContractPrincipal(): Promise<Blob> {
    this.doc = new jsPDF();
    this.currentY = MARGIN.TOP;
    
    this.addHeader('CONTRACT DE SERVICII SOCIALE');
    
    // Subtitlu
    this.doc.setFontSize(FONT_SIZE.BODY);
    this.addText(
      'încheiat între furnizorul de servicii sociale si beneficiar sau, dupa caz, reprezentantul legal al acestuia',
      MARGIN.LEFT
    );
    this.currentY += 5;
    
    // Număr contract
    this.doc.setFont('helvetica', 'bold');
    this.addText(
      `${this.resident.numarDosar} NR. ${this.resident.numarContract} / ${new Date(this.resident.dataInregistrare).toLocaleDateString('ro-RO')}`,
      MARGIN.LEFT,
      FONT_SIZE.BODY,
      true
    );
    this.currentY += 10;
    
    // 1. Părțile contractante
    this.addText('1. Partile contractante:', MARGIN.LEFT, FONT_SIZE.BODY, true);
    this.currentY += 5;
    
    this.addText(
      `1.1. ${this.company?.name}, denumita în continuare furnizor de servicii sociale, reprezentata de catre ${this.company?.representative} în calitate de ${this.company?.position}`,
      MARGIN.LEFT + 5
    );
    this.currentY += 3;
    
    this.addText('si:', MARGIN.LEFT);
    this.currentY += 5;
    
    // Beneficiar
    const beneficiarText = `1.2. Dl. ${this.resident.beneficiarNumeComplet} cu date de identificare: CNP ${this.resident.beneficiarCnp} si CI seria ${this.resident.beneficiarCiSerie}${this.resident.beneficiarCiNumar}, nr.${this.resident.beneficiarCiNumar}, eliberat la data de ${this.resident.beneficiarCiEliberatData} de catre ${this.resident.beneficiarCiEliberatDe}, valabil pâna la ${this.resident.beneficiarCiValabilPana}, cu domiciliul în ${this.resident.beneficiarAdresa}, în calitate de beneficiar,`;
    
    this.addText(beneficiarText, MARGIN.LEFT + 5);
    this.currentY += 5;
    
    // Aparținător
    const apartinatorText = `${this.resident.apartinatorNumeComplet} cu date de identificare: CNP ${this.resident.apartinatorCnp} si CI seria ${this.resident.apartinatorCiSerie}${this.resident.apartinatorCiNumar}, nr.${this.resident.apartinatorCiNumar}, eliberat la data de ${this.resident.apartinatorCiEliberatData} de catre ${this.resident.apartinatorCiEliberatDe}, valabil pâna la ${this.resident.apartinatorCiValabilPana}, cu domiciliul în ${this.resident.apartinatorAdresa}, în calitate de ${this.resident.apartinatorRelatie} (denumit si apartinator)`;
    
    this.addText(apartinatorText, MARGIN.LEFT + 5);
    this.currentY += 10;
    
    // Continuă cu restul secțiunilor...
    // (Voi adăuga toate secțiunile conform textului extras)
    
    this.addFooter(1);
    
    return this.doc.output('blob');
  }

  // DOCUMENT 2: Cerere de Admitere
  async generateCerereAdmitere(): Promise<Blob> {
    this.doc = new jsPDF();
    this.currentY = MARGIN.TOP;
    
    // Antet
    this.doc.setFontSize(FONT_SIZE.BODY);
    this.doc.text(this.company?.name || '', MARGIN.LEFT, this.currentY);
    this.currentY += 5;
    this.doc.text(`Telefon: ${CONTACT_PHONE}`, MARGIN.LEFT, this.currentY);
    this.currentY += 10;
    
    // Număr înregistrare
    this.doc.text(`Nr. ${this.resident.numarContract}/${new Date(this.resident.dataInregistrare).toLocaleDateString('ro-RO')}`, MARGIN.LEFT, this.currentY);
    this.currentY += 15;
    
    // Titlu
    this.doc.setFontSize(FONT_SIZE.TITLE);
    this.doc.setFont('helvetica', 'bold');
    const pageWidth = this.doc.internal.pageSize.width;
    const titleWidth = this.doc.getTextWidth('CERERE DE ADMITERE');
    this.doc.text('CERERE DE ADMITERE', (pageWidth - titleWidth) / 2, this.currentY);
    this.currentY += 15;
    
    // Conținut
    this.doc.setFontSize(FONT_SIZE.BODY);
    this.doc.setFont('helvetica', 'normal');
    
    const cerereText = `Subsemnatul ${this.resident.beneficiarNumeComplet}, si ${this.resident.apartinatorNumeComplet}, în calitate de ${this.resident.apartinatorRelatie} al beneficiarului, solicit acordarea de servicii sociale în baza încheierii unui contract, în ${this.camin?.name}.`;
    
    this.addText(cerereText, MARGIN.LEFT);
    this.currentY += 10;
    
    const motivText = `Mentionez ca motivul internarii este: lipsa adaptarii în cadrul acordarii serviciilor de îngrijire la domiciliu / imposibilitatea familiei (reprezentantilor legali) de a putea acorda îngrijirea necesara si raspunsul adecvat la nevoilor existente.`;
    
    this.addText(motivText, MARGIN.LEFT);
    this.currentY += 20;
    
    // Data și semnătură
    this.doc.text(`Data: ${new Date(this.resident.dataInregistrare).toLocaleDateString('ro-RO')}`, MARGIN.LEFT, this.currentY);
    this.currentY += 15;
    
    this.doc.text('Semnatura:', MARGIN.LEFT, this.currentY);
    this.currentY += 5;
    this.doc.line(MARGIN.LEFT + 30, this.currentY, MARGIN.LEFT + 100, this.currentY);
    
    this.addFooter(1);
    
    return this.doc.output('blob');
  }

  // Metodă principală pentru generare toate documentele
  async generateAllDocuments(): Promise<{ [key: string]: Blob }> {
    const documents: { [key: string]: Blob } = {};
    
    documents['contract_principal'] = await this.generateContractPrincipal();
    documents['cerere_admitere'] = await this.generateCerereAdmitere();
    // ... va continua cu toate cele 16 documente
    
    return documents;
  }
}

// Funcție helper pentru generare
export async function generateAllPDFsForResident(resident: Resident): Promise<{ [key: string]: Blob }> {
  const generator = new PDFGenerator(resident);
  return await generator.generateAllDocuments();
}
