import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generatePDF(invoice, settings) {
  const doc = new jsPDF();
  const currency = settings.currency || 'EUR';
  const fmt = (n) => `${parseFloat(n).toFixed(2)} ${currency}`;

  // Header
  doc.setFillColor(2, 132, 199);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.business_name || 'Mon Entreprise', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.business_email || '', 14, 26);
  doc.text(settings.business_phone || '', 14, 32);

  // Invoice number
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`FACTURE ${invoice.number}`, 140, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const statusLabels = { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', cancelled: 'Annulée' };
  doc.text(`Statut: ${statusLabels[invoice.status] || invoice.status}`, 140, 26);
  doc.text(`Date: ${invoice.issue_date}`, 140, 32);

  // Business address
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.text(settings.business_address || '', 14, 50);

  // Client info
  doc.setFillColor(248, 250, 252);
  doc.rect(110, 45, 90, 35, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text('FACTURER À :', 114, 53);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.client_name || '', 114, 60);
  if (invoice.client_company) doc.text(invoice.client_company, 114, 66);
  if (invoice.client_email) doc.text(invoice.client_email, 114, 72);
  if (invoice.client_address) doc.text(invoice.client_address, 114, 78);

  // Dates
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Date d'émission : ${invoice.issue_date}`, 14, 62);
  doc.text(`Date d'échéance : ${invoice.due_date}`, 14, 70);

  // Items table
  const subtotal = (invoice.items || []).reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const taxAmt = subtotal * ((invoice.tax_rate || 0) / 100);

  autoTable(doc, {
    startY: 90,
    head: [['Description', 'Qté', 'Prix unitaire', 'Total']],
    body: (invoice.items || []).map(i => [
      i.description,
      i.quantity,
      fmt(i.unit_price),
      fmt(i.quantity * i.unit_price)
    ]),
    headStyles: { fillColor: [2, 132, 199], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 90 }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    styles: { fontSize: 9, cellPadding: 5 },
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // Totals
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text('Sous-total :', 140, finalY);
  doc.text(fmt(subtotal), 195, finalY, { align: 'right' });
  doc.text(`TVA (${invoice.tax_rate || 0}%) :`, 140, finalY + 8);
  doc.text(fmt(taxAmt), 195, finalY + 8, { align: 'right' });

  doc.setFillColor(2, 132, 199);
  doc.rect(130, finalY + 12, 70, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL :', 140, finalY + 20);
  doc.text(fmt(invoice.total), 195, finalY + 20, { align: 'right' });

  // Notes
  if (invoice.notes) {
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Notes :', 14, finalY + 30);
    doc.text(invoice.notes, 14, finalY + 38);
  }

  // Footer
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 280, 210, 17, 'F');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Généré par FreelanceFlow', 105, 290, { align: 'center' });

  doc.save(`Facture-${invoice.number}.pdf`);
}
