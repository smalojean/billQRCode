// pdfExport.js
import { formatDateTime, parseNumber } from "./utils.js";

export function initPdfExport(transactions, subtractInput) {
  const previewPdfBtn = document.getElementById("previewPdfBtn");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");
  let currentPdfUrl = null;

  previewPdfBtn.addEventListener("click", () => {
    const checkedTx = Array.from(document.querySelectorAll(".tx-checkbox"))
      .filter(cb => cb.checked)
      .map(cb => transactions[cb.dataset.index]);

    if (!checkedTx.length) return alert("Sélectionne au moins une transaction");

    const totalSum = checkedTx.reduce((acc, tx) => {
      return acc + parseNumber(tx.total);
    }, 0);
    const subtract = parseNumber(subtractInput.value) || 0;
    const finalTotal = totalSum - subtract;

    let content = "Sommaire des transactions\n\n";
    checkedTx.forEach(tx => {
      content += `${tx.transaction} — ${formatDateTime(tx.date)}\nTotal: ${tx.total}\n`;
    });
    content += `\nTransactions uniques: ${checkedTx.length} — Total: ${totalSum.toFixed(2)} $\n`;
    content += `Montant à soustraire: ${subtract.toFixed(2)} $\n`;
    content += `Total final: ${finalTotal.toFixed(2)} $`;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(12);
    content.split("\n").forEach((line, i) => doc.text(10, 10 + i * 7, line));

    if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl);
    currentPdfUrl = URL.createObjectURL(doc.output("blob"));

    const modal = document.getElementById("pdfPreviewModal");
    const frame = document.getElementById("pdfPreviewFrame");
    frame.src = currentPdfUrl;
    modal.style.display = "block";
  });

  downloadPdfBtn.addEventListener("click", () => {
    const checkedTx = Array.from(document.querySelectorAll(".tx-checkbox"))
      .filter(cb => cb.checked)
      .map(cb => transactions[cb.dataset.index]);

    if (!checkedTx.length) return alert("Sélectionne au moins une transaction");

    const totalSum = checkedTx.reduce((acc, tx) => {
      return acc + parseNumber(tx.total);
    }, 0);

    const subtract = parseNumber(subtractInput.value) || 0;
    const finalTotal = totalSum - subtract;

    let content = "Sommaire des transactions\n\n";

    checkedTx.forEach(tx => {
      content += `${tx.transaction} — ${formatDateTime(tx.date)}\nTotal: ${tx.total}\n`;
    });

    content += `\nTransactions uniques: ${checkedTx.length} — Total: ${totalSum.toFixed(2)} $\n`;
    content += `Montant à soustraire: ${subtract.toFixed(2)} $\n`;
    content += `Total final: ${finalTotal.toFixed(2)} $`;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(12);

    content.split("\n").forEach((line, i) => {
        doc.text(10, 10 + i * 7, line);
    });

    let fileName = "Resultat";
    if (checkedTx[0]?.date) {
      const d = checkedTx[0].date;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth()+1).padStart(2,"0");
      const dd = String(d.getDate()).padStart(2,"0");
      fileName = `Factures_${yyyy}-${mm}-${dd}`;
    }

    doc.save(fileName + ".pdf");
  });
}