// app.js (module)
import QrScanner from "https://unpkg.com/qr-scanner@1.4.2/qr-scanner.min.js";

/*
  CONFIGURATION:
  Remplace WORKER_URL par l'URL de ton Cloudflare Worker déployé, ex:
  const WORKER_URL = "https://ton-worker.xxxx.workers.dev/";
*/
const WORKER_URL = "https://odd-mode-66e4.smalojean.workers.dev/"; // <--- configure ceci

/* DOM */
const fileInput = document.getElementById("fileInput");
const processBtn = document.getElementById("processBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");
const countsEl = document.getElementById("counts");
const resultsList = document.getElementById("resultsList");
const subtractInput = document.getElementById("subtractInput");
const previewPdfBtn = document.getElementById("previewPdfBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const pdfContent = document.getElementById("pdf-content");

/* état */
const transactionsMap = new Map(); // key = trxKey (ex '61007-2') -> {transaction, totalStr, totalNum, url}

/* utilitaires */
function parseCurrencyToNumber(str){
  if(!str) return 0;
  const cleaned = String(str).replace(/\u00A0/g," ").replace(/\s/g,"").replace(/\$/g,"").replace("CAD","");
  const norm = cleaned.indexOf(",") !== -1 && cleaned.indexOf(".") === -1 ? cleaned.replace(",", ".") : cleaned.replace(",", "");
  const n = parseFloat(norm);
  return Number.isFinite(n) ? n : 0;
}
function formatCurrency(n){
  return n.toLocaleString("fr-CA", {minimumFractionDigits:2, maximumFractionDigits:2}) + " $";
}
function setStatus(t){ statusEl.textContent = "Statut: " + t; }

/* mise à jour UI mobile */
function refreshUI(){
  resultsList.innerHTML = "";
  for(const [key, v] of transactionsMap){
    const card = document.createElement("div");
    card.className = "transaction-card";
    const row = document.createElement("div"); row.className="tx-row";
    const title = document.createElement("div"); title.className="tx-title"; title.textContent = v.transaction;
    const amount = document.createElement("div"); amount.className="tx-amount"; amount.textContent = v.totalStr;
    row.appendChild(title); row.appendChild(amount);
    const sub = document.createElement("div"); sub.className="tx-sub";
    const a = document.createElement("a"); a.href = v.url; a.target="_blank"; a.rel="noopener";
    a.textContent = v.url.length>48 ? v.url.slice(0,48)+"…" : v.url;
    sub.appendChild(a);
    card.appendChild(row); card.appendChild(sub);
    resultsList.appendChild(card);
  }
  const total = Array.from(transactionsMap.values()).reduce((s,x)=> s + x.totalNum, 0);
  countsEl.textContent = `Transactions uniques: ${transactionsMap.size} — Total: ${formatCurrency(total)}`;
}

/* extraction HTML -> transaction + total */
function extractFromHtml(html, sourceUrl){
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // transaction
  let transactionText = null;
  const bolds = doc.querySelectorAll("b");
  for(const b of bolds){
    const t = b.textContent.trim();
    if(t.startsWith("Transaction #")){
      transactionText = t; break;
    }
  }
  if(!transactionText){
    const all = doc.body?.innerText || "";
    const m = all.match(/Transaction\s*#\s*([A-Za-z0-9\-\_]+)/i);
    if(m) transactionText = "Transaction #"+m[1];
  }

  // total
  let totalStr = null;
  const totalCell = doc.querySelector(".kx-rangee-total .kx-cellule-montant");
  if(totalCell) totalStr = totalCell.textContent.trim();
  else {
    const all = doc.body?.innerText || "";
    const m2 = all.match(/Total[\s:\n]*([\d\.,]+\s*\$)/i);
    if(m2) totalStr = m2[1].trim();
  }

  return { transactionText, totalStr, sourceUrl };
}

/* fetch via worker proxy */
async function fetchViaProxy(url){
  if(!WORKER_URL) throw new Error("WORKER_URL non configuré.");
  const target = WORKER_URL + "?url=" + encodeURIComponent(url);
  const r = await fetch(target);
  if(!r.ok) throw new Error("Proxy error " + r.status);
  return await r.text();
}

/* process single URL */
async function handleUrl(url){
  try{
    setStatus("Récupération…");
    const html = await fetchViaProxy(url);
    const { transactionText, totalStr } = extractFromHtml(html, url);
    if(!transactionText) {
      console.warn("Transaction non trouvée pour", url);
      return { ok:false, reason:"no-transaction", url };
    }
    if(!totalStr) {
      console.warn("Total non trouvé pour", url);
      return { ok:false, reason:"no-total", url };
    }
    const m = transactionText.match(/Transaction\s*#\s*(.+)/i);
    const trxKey = m ? m[1].trim() : transactionText;
    const totalNum = parseCurrencyToNumber(totalStr);
    if(!transactionsMap.has(trxKey)){
      transactionsMap.set(trxKey, {
        transaction: "Transaction #"+trxKey,
        totalStr,
        totalNum,
        url
      });
    } else {
      console.info("Duplicate ignored", trxKey);
    }
    refreshUI();
    return { ok:true, trxKey };
  } catch(err){
    console.error("handleUrl error", err);
    return { ok:false, reason:err.message, url };
  } finally {
    setStatus("Prêt");
  }
}

/* process files: scan QR then fetch */
async function processFiles(files){
  setStatus("Lecture QR & traitement");
  for(const file of files){
    try{
      setStatus(`Scan: ${file.name}`);
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult:false });
      if(!result) { console.warn("Aucun QR:", file.name); continue; }
      const urlCandidate = result.split(/\s+/).find(s => s.startsWith("http"));
      if(!urlCandidate){ console.warn("QR n'est pas URL:", result); continue; }
      // skip if already exact url present
      const already = Array.from(transactionsMap.values()).some(v => v.url === urlCandidate);
      if(already){ console.info("URL déjà traitée:", urlCandidate); continue; }
      await handleUrl(urlCandidate);
    } catch(err){
      console.warn("Scan error", file.name, err);
    }
  }
  setStatus("Terminé");
}

/* PDF: construire contenu HTML et générer via html2pdf */
async function ensureHtml2pdf(){
  if(window.html2pdf) return;
  return new Promise((resolve,reject)=>{
    const s = document.createElement("script");
    s.src = "https://unpkg.com/html2pdf.js@0.9.3/dist/html2pdf.bundle.min.js";
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

function buildPdfHtml(subtract){
  const rows = Array.from(transactionsMap.values()).map(v =>
    `<tr>
      <td style="border:1px solid #ddd;padding:6px;">${v.transaction}</td>
      <td style="border:1px solid #ddd;padding:6px;text-align:right;">${v.totalStr}</td>
      <td style="border:1px solid #ddd;padding:6px;">${v.url}</td>
    </tr>`
  ).join("");

  const total = Array.from(transactionsMap.values()).reduce((s,x)=> s + x.totalNum, 0);
  const finalTotal = total - (Number.isFinite(subtract) ? subtract : 0);

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;padding:18px;">
      <h2>Résumé des transactions</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <thead>
          <tr>
            <th style="border:1px solid #ddd;padding:8px;text-align:left">Transaction</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:right">Montant</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:left">Source</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div style="margin-top:12px;font-size:1rem;">
        <p>Total avant soustraction: <strong>${formatCurrency(total)}</strong></p>
        <p>Montant soustrait: <strong>${formatCurrency(subtract || 0)}</strong></p>
        <p style="font-size:1.1rem">Total final: <strong>${formatCurrency(finalTotal)}</strong></p>
      </div>
    </div>
  `;
}

/* handlers */
processBtn.addEventListener("click", async ()=>{
  const files = fileInput.files ? Array.from(fileInput.files) : [];
  if(files.length === 0){ alert("Choisis au moins une image."); return; }
  processBtn.disabled = true;
  try{ await processFiles(files); } finally { processBtn.disabled = false; }
});

clearBtn.addEventListener("click", ()=>{
  transactionsMap.clear(); refreshUI(); setStatus("Réinitialisé");
});

previewPdfBtn.addEventListener("click", async ()=>{
  const subtract = parseFloat(subtractInput.value || "0");
  const html = buildPdfHtml(subtract);
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
});

downloadPdfBtn.addEventListener("click", async ()=>{
  try{
    await ensureHtml2pdf();
    const subtract = parseFloat(subtractInput.value || "0");
    pdfContent.innerHTML = buildPdfHtml(subtract);
    pdfContent.style.display = "block";
    const opt = {
      margin:10,
      filename: `rapport-transactions-${new Date().toISOString().slice(0,10)}.pdf`,
      image:{type:'jpeg',quality:0.98},
      html2canvas:{scale:2},
      jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}
    };
    await window.html2pdf().set(opt).from(pdfContent).save();
  } catch(err){
    console.error("PDF error", err); alert("Erreur génération PDF: " + err.message);
  } finally {
    pdfContent.style.display = "none";
  }
});

/* init */
refreshUI();
setStatus("Prêt. Configure WORKER_URL dans app.js si nécessaire.");
