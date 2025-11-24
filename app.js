// app.js
import { processPDF } from "./js/pdfReader.js";
import { processTransactions } from "./js/transactions.js";
import { displayTransactions, attachCheckboxListeners, updateCounts } from "./js/display.js";
import { initPdfExport } from "./js/pdfExport.js";

const fileInput = document.getElementById("fileInput");
const processBtn = document.getElementById("processBtn");
const resultsList = document.getElementById("resultsList");
const countsDiv = document.getElementById("counts");
const subtractInput = document.getElementById("subtractInput");
const clearBtn = document.getElementById("clearBtn");

let transactions = [];
let majorityDay = null;
let loadingInterval = null;

// ===== Animation de chargement =====
function startLoadingAnimation() {
  let dots = 0;
  let increasing = true;
  const status = document.getElementById("status");
  status.textContent = "Traitement";

  loadingInterval = setInterval(() => {
    status.textContent = "Traitement" + ".".repeat(dots);
    if (increasing) {
      dots++;
      if (dots === 6) increasing = false;
    } else {
      dots--;
      if (dots === 0) increasing = true;
    }
  }, 300);
}

function stopLoadingAnimation() {
  clearInterval(loadingInterval);
  const status = document.getElementById("status");
  status.textContent = "Terminé";
}

// ===== Bouton traiter =====
processBtn.addEventListener("click", async () => {
  const files = [...fileInput.files];
  if (!files.length) return alert("Sélectionne un PDF");

  startLoadingAnimation();
  transactions = [];

  for (const f of files) {
    const results = await processPDF(f);
    transactions.push(...results);
  }

  // Correction : c'est ICI qu'on traite
  const { unique, majorityDay } = processTransactions(transactions);
  stopLoadingAnimation();
  transactions = unique;

  displayTransactions(transactions, resultsList, majorityDay);
  attachCheckboxListeners(transactions, countsDiv);
  updateCounts(transactions, countsDiv);

  // IMPORTANT : réactiver l'export PDF avec les transactions mises à jour
  initPdfExport(transactions, subtractInput);
});

// ===== Bouton clear =====
clearBtn.addEventListener("click", () => {
  fileInput.value = "";
  subtractInput.value = "";
  transactions = [];
  resultsList.innerHTML = "";
  countsDiv.textContent = "Transactions uniques: 0 — Total: 0,00 $";
  document.getElementById("status").textContent = "Statut: prêt";
});
