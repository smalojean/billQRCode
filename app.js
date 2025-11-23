// Récupération de PDF.js injecté dans window
const pdfjsLib = window.pdfjsLib;

const fileInput = document.getElementById("fileInput");
const processBtn = document.getElementById("processBtn");
const resultsList = document.getElementById("resultsList");
const status = document.getElementById("status");

let transactions = [];

// Extraction du texte d'une page PDF
async function extractTextFromPage(page) {
  const content = await page.getTextContent();

  if (content.items.length > 0) {
    return content.items.map(i => i.str).join(" ");
  }

  console.warn("Aucun texte détecté → OCR...");

  const viewport = page.getViewport({ scale: 3 });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: ctx, viewport }).promise;

  const result = await Tesseract.recognize(canvas, "fra", {
    logger: m => console.log(m)
  });

  return result.data.text;
}

// Extraction des montants après un mot-clé
function extractAmountAfterKeyword(text, keyword) {
  // Cherche n'importe quel nombre suivi éventuellement d'un $ après le mot-clé
  const regex = new RegExp(`${keyword}\\s*[:\\s]*([0-9]+[.,]?[0-9]{0,2})\\s*\\$?`, 'gi');
  const matches = [...text.matchAll(regex)];
  if (matches.length === 0) return "N/A";

  // Prend le dernier montant trouvé
  let amount = matches[matches.length - 1][1];

  return amount + " $";
}

// Extraction de toutes les transactions dans un PDF
async function processPDF(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let text = "";

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    text += await extractTextFromPage(page) + " ";
  }

  // Normalisation des espaces
  text = text.replace(/\s+/g, " ").trim();
  console.log("Texte final extrait :", text);

  // Recherche toutes les transactions
  const txMatches = [...text.matchAll(/Transaction #([\d-]+)/gi)];

  if (!txMatches.length) {
    console.warn("Aucune transaction trouvée");
    return;
  }

  for (const match of txMatches) {
    // Extraire la portion de texte autour de la transaction pour éviter de confondre plusieurs
    const txStart = match.index;
    const nextTx = text.indexOf("Transaction #", txStart + 1);
    const txText = nextTx > -1 ? text.slice(txStart, nextTx) : text.slice(txStart);

    // Extraction des données
    // const tpsNumMatch = txText.match(/TPS\s*[:\s]*([\d\w]+)/i);
    // const tvqNumMatch = txText.match(/TVQ\s*[:\s]*([\d\w]+)/i);
    // const sousTotal = extractAmountAfterKeyword(txText, "Sous-total");
    // const tpsMontant = extractAmountAfterKeyword(txText, "TPS");
    // const tvqMontant = extractAmountAfterKeyword(txText, "TVQ");
    const total = extractAmountAfterKeyword(txText, "Total");

    transactions.push({
      transaction: `Transaction #${match[1]}`,
    //   tps: tpsNumMatch ? tpsNumMatch[1] : "N/A",
    //   tvq: tvqNumMatch ? tvqNumMatch[1] : "N/A",
    //   sousTotal,
    //   tpsMontant,
    //   tvqMontant,
      total
    });
  }
}

processBtn.addEventListener("click", async () => {
  const files = [...fileInput.files];
  if (!files.length) return alert("Sélectionne un PDF");

  status.textContent = "Traitement...";
  transactions = [];

  for (const f of files) {
    await processPDF(f);
  }

  console.log("Transactions :", transactions);
  status.textContent = "Terminé";

  // Affichage clair
  resultsList.innerHTML = transactions.map(tx => `
    <li>
      <strong>${tx.transaction}</strong><br>
      Total: ${tx.total}
    </li>
  `).join("");
});
