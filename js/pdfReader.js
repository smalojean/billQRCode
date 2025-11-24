// js/pdfReader.js
import { extractTextFromPage } from "./ocr.js";
import { extractAmounts, extractTaxNumbers } from "./extractors.js";

function parseDateFromInvoiceNumber(invoiceNum) {
  if (!invoiceNum || invoiceNum.length < 14) return null;
  const year = parseInt(invoiceNum.slice(0, 4));
  const month = parseInt(invoiceNum.slice(4, 6)) - 1;
  const day = parseInt(invoiceNum.slice(6, 8));
  const hour = parseInt(invoiceNum.slice(8, 10));
  const min = parseInt(invoiceNum.slice(10, 12));
  const sec = parseInt(invoiceNum.slice(12, 14));
  return new Date(year, month, day, hour, min, sec);
}

export async function processPDF(file) {
  const pdfjsLib = window.pdfjsLib;
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let fullText = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    fullText += await extractTextFromPage(page) + " ";
  }
  fullText = fullText.replace(/\s+/g, " ").trim();

  // Extraire tous les numéros de facture à 14 chiffres dans le PDF
  const invoiceNumbers = [...fullText.matchAll(/\b\d{14}\b/g)].map(m => m[0]);

  const txMatches = [...fullText.matchAll(/Transaction #([\d-]+)/gi)];
  if (!txMatches.length) return [];

  const results = [];
  for (const match of txMatches) {
    const start = match.index;
    const next = fullText.indexOf("Transaction #", start + 1);
    const txText = next > -1 ? fullText.slice(start, next) : fullText.slice(start);

    // Chercher le numéro de facture le plus proche avant "Transaction #"
    let invoiceNumber = null;
    for (let i = invoiceNumbers.length - 1; i >= 0; i--) {
      if (fullText.indexOf(invoiceNumbers[i]) < start) {
        invoiceNumber = invoiceNumbers[i];
        break;
      }
    }

    results.push({
      transaction: `Transaction #${match[1]}`,
      ...extractTaxNumbers(txText),
      ...extractAmounts(txText),
      invoiceNumber,
      date: parseDateFromInvoiceNumber(invoiceNumber)
    });
  }

  return results;
}
