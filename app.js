import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
import QrScanner from "https://cdn.jsdelivr.net/npm/qr-scanner@1.4.2/qr-scanner.min.js";
import { PDFDocument } from "https://cdn.jsdelivr.net/npm/pdf-lib@1.21.1/dist/pdf-lib.min.js";

const fileInput = document.getElementById('fileInput');
const processBtn = document.getElementById('processBtn');
const clearBtn = document.getElementById('clearBtn');
const previewPdfBtn = document.getElementById('previewPdfBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const subtractInput = document.getElementById('subtractInput');
const status = document.getElementById('status');
const counts = document.getElementById('counts');
const resultsList = document.getElementById('resultsList');
const pdfContent = document.getElementById('pdf-content');

let transactions = [];

function updateUI() {
  resultsList.innerHTML = '';
  let total = 0;
  transactions.forEach(tx => {
    const div = document.createElement('div');
    div.className = 'transaction-card';
    div.innerHTML = `
      <div class="tx-row"><span class="tx-title">${tx.transaction}</span><span>${tx.total}</span></div>
      <div class="tx-sub">TPS: ${tx.tps} — TVQ: ${tx.tvq}</div>
    `;
    resultsList.appendChild(div);
    total += parseFloat(tx.total.replace(',', '.').replace('$','').trim());
  });
  const subtract = parseFloat(subtractInput.value) || 0;
  counts.innerText = `Transactions uniques: ${transactions.length} — Total: ${(total - subtract).toFixed(2)} $`;
}

async function processImage(file) {
  return new Promise((resolve, reject) => {
    QrScanner.scanImage(file)
      .then(result => {
        try {
          // Ici, on suppose que le QR code contient un JSON de transaction
          const tx = JSON.parse(result);
          transactions.push(tx);
          resolve();
        } catch(e){
          console.warn('QR non parsable', e);
          resolve();
        }
      })
      .catch(e => {
        console.warn('QR non détecté', e);
        resolve();
      });
  });
}

async function processPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  let text = '';
  const pages = pdfDoc.getPages();
  for (const page of pages) {
    text += await page.getTextContent ? await page.getTextContent() : '';
  }
  // Parse le texte pour extraire transaction/TPS/TVQ/Total
  const txMatch = text.match(/Transaction #(\d+)/);
  const tpsMatch = text.match(/TPS:\s*([\dA-Z]+)/);
  const tvqMatch = text.match(/TVQ:\s*([\dA-Z]+)/);
  const totalMatch = text.match(/Total\s*[:\s]*([\d,\.]+)/);

  if(txMatch && totalMatch){
    transactions.push({
      transaction: `Transaction #${txMatch[1]}`,
      tps: tpsMatch ? tpsMatch[1] : 'N/A',
      tvq: tvqMatch ? tvqMatch[1] : 'N/A',
      total: totalMatch[1] + ' $'
    });
  }
}

processBtn.addEventListener('click', async () => {
  const files = Array.from(fileInput.files);
  if(!files.length) return alert('Veuillez sélectionner au moins un fichier');
  status.innerText = 'Statut: traitement en cours...';
  for(const file of files){
    if(file.type.startsWith('image/')){
      await processImage(file);
    } else if(file.type === 'application/pdf'){
      await processPDF(file);
    }
  }
  updateUI();
  status.innerText = 'Statut: prêt';
});

clearBtn.addEventListener('click', () => {
  transactions = [];
  fileInput.value = '';
  updateUI();
});

subtractInput.addEventListener('input', updateUI);

function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;
  doc.setFontSize(12);
  doc.text("Transactions", 10, y); y += 10;
  let total = 0;
  transactions.forEach(tx => {
    doc.text(`${tx.transaction} — Total: ${tx.total}`, 10, y); y += 8;
    doc.text(`TPS: ${tx.tps} — TVQ: ${tx.tvq}`, 10, y); y += 8;
    total += parseFloat(tx.total.replace(',', '.').replace('$','').trim());
  });
  const subtract = parseFloat(subtractInput.value) || 0;
  doc.text(`\nTotal après soustraction: ${(total - subtract).toFixed(2)} $`, 10, y+10);
  return doc;
}

previewPdfBtn.addEventListener('click', () => {
  const doc = generatePDF();
  pdfContent.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.src = doc.output('bloburl');
  iframe.width = '100%';
  iframe.height = '500';
  pdfContent.style.display = 'block';
  pdfContent.appendChild(iframe);
});

downloadPdfBtn.addEventListener('click', () => {
  const doc = generatePDF();
  doc.save('transactions.pdf');
});
