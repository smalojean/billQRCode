// app.js
import { processPDF } from "./js/pdfReader.js";

const fileInput = document.getElementById("fileInput");
const processBtn = document.getElementById("processBtn");
const resultsList = document.getElementById("resultsList");
const status = document.getElementById("status");
const countsDiv = document.getElementById("counts");
const subtractInput = document.getElementById("subtractInput");
const previewPdfBtn = document.getElementById("previewPdfBtn");

let transactions = [];
let majorityDay = null;

// ===== Utilitaires =====
function formatDay(date) {
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function formatDateTime(date) {
  if (!date) return "N/A";
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ` +
         `${String(date.getHours()).padStart(2,'0')} h ${String(date.getMinutes()).padStart(2,'0')} min ${String(date.getSeconds()).padStart(2,'0')} s`;
}

function parseNumber(str) {
  if (!str) return 0;
  return parseFloat(str.replace(",", ".").replace(/\s*\$/g,"")) || 0;
}

// ===== Événement : traitement des fichiers =====
processBtn.addEventListener("click", async () => {
  const files = [...fileInput.files];
  if (!files.length) return alert("Sélectionne un PDF");

  status.textContent = "Traitement...";
  transactions = [];

  for (const f of files) {
    const results = await processPDF(f);
    transactions.push(...results);
  }

  // Filtrer et organiser les transactions
  transactions = processTransactions(transactions);

  // Affichage
  displayTransactions();
  updateCounts();
  status.textContent = "Terminé";
});

// ===== Traitement des transactions =====
function processTransactions(txList) {
  if (!txList.length) return [];

  // 1. Déterminer le jour majoritaire
  const dayCount = {};
  txList.forEach(tx => {
    const dayStr = formatDay(tx.date);
    if (!dayStr) return;
    dayCount[dayStr] = (dayCount[dayStr] || 0) + 1;
  });
  majorityDay = Object.entries(dayCount).sort((a,b)=>b[1]-a[1])[0]?.[0];

  // 2. Supprimer doublons (transaction + facture)
  const seen = new Set();
  const unique = [];
  txList.forEach(tx => {
    const key = `${tx.transaction}-${tx.invoiceNumber}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(tx);
    }
  });

  // 3. Trier par date proche de "aujourd'hui" (plus récent en haut)
  const today = new Date();
  unique.sort((a,b) => {
    const diffA = Math.abs(today - a.date);
    const diffB = Math.abs(today - b.date);
    return diffA - diffB;
  });

  return unique;
}

// ===== Affichage dans le HTML =====
function displayTransactions() {
  resultsList.innerHTML = transactions.map((tx, index) => {
    const dateStr = formatDateTime(tx.date);
    const txDay = formatDay(tx.date);
    const style = (majorityDay && txDay !== majorityDay) ? "color:red;" : "";
    return `
      <li style="${style}">
        <input type="checkbox" class="tx-checkbox" data-index="${index}" checked>
        <strong>${tx.transaction}</strong> — ${dateStr}<br>
        Total: ${tx.total}
      </li>
    `;
  }).join("");

  // Ajout d'un listener pour les checkboxes
  document.querySelectorAll(".tx-checkbox").forEach(cb => {
    cb.addEventListener("change", updateCounts);
  });
}

// ===== Mise à jour des totaux =====
function updateCounts() {
  const checkboxes = document.querySelectorAll(".tx-checkbox");
  let uniqueCount = 0;
  let totalSum = 0;

  checkboxes.forEach(cb => {
    if (cb.checked) {
      const tx = transactions[cb.dataset.index];
      uniqueCount++;
      totalSum += parseNumber(tx.total);
    }
  });

  countsDiv.textContent = `Transactions uniques: ${uniqueCount} — Total: ${totalSum.toFixed(2)} $`;
}

// ===== Aperçu PDF =====
previewPdfBtn.addEventListener("click", () => {
  // Récupérer uniquement les transactions cochées
  const checkedTx = Array.from(document.querySelectorAll(".tx-checkbox"))
    .filter(cb => cb.checked)
    .map(cb => transactions[cb.dataset.index]);

  // Calculer le total seulement pour celles cochées
  const totalSum = checkedTx.reduce((acc, tx) => {
    const num = parseFloat(tx.total.replace(",", ".").replace(/\s*\$/g, ""));
    return !isNaN(num) ? acc + num : acc;
  }, 0);

  const subtract = parseFloat(subtractInput.value) || 0;
  const finalTotal = totalSum - subtract;

  // Génération du contenu PDF
  let content = "Sommaire des transactions\n\n";
  checkedTx.forEach(tx => {
    content += `${tx.transaction} — ${formatDateTime(tx.date)}\nTotal: ${tx.total}\n`;
  });

  content += `\nTransactions uniques: ${checkedTx.length} — Total: ${totalSum.toFixed(2)} $\n`;
  content += `Montant à soustraire: ${subtract.toFixed(2)} $\n`;
  content += `Total final: ${finalTotal.toFixed(2)} $`;

  // Génération PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(12);
  const lines = content.split("\n");
  lines.forEach((line, i) => doc.text(10, 10 + i * 7, line));
  doc.save("Apercu_Transactions.pdf");
});
