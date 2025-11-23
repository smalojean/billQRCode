import html2pdf from 'html2pdf.js';

// Stockage global des transactions
let transactions = [];

// Elements
const fileInput = document.getElementById('fileInput');
const processBtn = document.getElementById('processBtn');
const clearBtn = document.getElementById('clearBtn');
const subtractInput = document.getElementById('subtractInput');
const previewPdfBtn = document.getElementById('previewPdfBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const resultsList = document.getElementById('resultsList');
const counts = document.getElementById('counts');
const status = document.getElementById('status');
const pdfContent = document.getElementById('pdf-content');

// Fonction pour mettre à jour l'affichage
function updateUI() {
  resultsList.innerHTML = '';
  let total = 0;
  transactions.forEach(tx => {
    const div = document.createElement('div');
    div.className = 'transaction-card';
    div.innerHTML = `
      <div class="tx-row"><span class="tx-title">${tx.transaction}</span><span>${tx.total}</span></div>
      <div class="tx-sub">Date: ${tx.date}, TPS: ${tx.tps}, TVQ: ${tx.tvq}</div>
    `;
    resultsList.appendChild(div);
    total += parseFloat(tx.total.replace(',', '.').replace('$',''));
  });
  const subtract = parseFloat(subtractInput.value) || 0;
  const finalTotal = total - subtract;
  counts.textContent = `Transactions uniques: ${transactions.length} — Total: ${finalTotal.toFixed(2)} $`;
}

// Réinitialiser
clearBtn.addEventListener('click', () => {
  transactions = [];
  fileInput.value = '';
  subtractInput.value = '';
  updateUI();
});

// Traitement (exemple simple : lecture PDF avec pdf-lib)
processBtn.addEventListener('click', async () => {
  if (!fileInput.files.length) return alert('Sélectionne au moins un fichier');
  status.textContent = 'Statut: traitement...';
  for (const file of fileInput.files) {
    const arrayBuffer = await file.arrayBuffer();
    // Ici tu utiliseras pdf-lib ou pdf.js pour extraire le texte et récupérer les infos
    // Exemple simulé :
    const tx = {
      date: '20251116',
      transaction: 'Transaction #12345',
      tps: 'TPS: 1,92 $',
      tvq: 'TVQ: 3,84 $',
      total: '44,21'
    };
    transactions.push(tx);
  }
  updateUI();
  status.textContent = 'Statut: prêt';
});

// Générer PDF
function generatePDF() {
  pdfContent.innerHTML = '<h1>Transactions</h1>';
  transactions.forEach(tx => {
    const div = document.createElement('div');
    div.className = 'pdf-transaction';
    div.innerHTML = `<span>${tx.transaction}</span><span>${tx.total} $</span>`;
    pdfContent.appendChild(div);
  });
  const total = transactions.reduce((acc, tx) => acc + parseFloat(tx.total.replace(',', '.')), 0);
  const subtract = parseFloat(subtractInput.value) || 0;
  const finalTotal = total - subtract;
  const totalDiv = document.createElement('div');
  totalDiv.className = 'pdf-total';
  totalDiv.textContent = `Total final: ${finalTotal.toFixed(2)} $`;
  pdfContent.appendChild(totalDiv);

  return pdfContent;
}

previewPdfBtn.addEventListener('click', () => {
  html2pdf().from(generatePDF()).set({filename:'preview.pdf'}).preview();
});

downloadPdfBtn.addEventListener('click', () => {
  html2pdf().from(generatePDF()).set({filename:'transactions.pdf'}).save();
});
