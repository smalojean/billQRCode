// js/pdfBuilder.js
export function buildPdf(transactions, subtract) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Sommaire des transactions", 10, 10);

  let y = 20;
  let totalSum = 0;

  // Liste des transactions sans modification
  for (const tx of transactions) {
    const num = parseFloat(tx.total.replace(",", ".").replace(/\s*\$/g, ""));

    if (!isNaN(num)) totalSum += num;

    doc.setFontSize(11);
    doc.text(`${tx.transaction} — Total: ${num.toFixed(2)} $`, 10, y);

    y += 8;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  }

  // Calcul final après la liste
  const finalAfterSubtract = totalSum - subtract;

  y += 10;
  doc.setFontSize(13);

  doc.text(`Transactions uniques: ${transactions.length}`, 10, y);
  y += 7;

  doc.text(`Total: ${totalSum.toFixed(2)} $`, 10, y);
  y += 7;

  doc.text(`Montant à soustraire: ${subtract.toFixed(2)} $`, 10, y);
  y += 7;

  doc.text(`Total final: ${finalAfterSubtract.toFixed(2)} $`, 10, y);

  // Retourne un Blob pour l'aperçu
  return doc.output("blob");
}
