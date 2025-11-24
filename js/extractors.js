// js/extractors.js

export function extractAmount(text, keyword) {
  const regex = new RegExp(`${keyword}\\s*[:\\s]*([0-9]+[.,]?[0-9]{0,2})\\s*\\$?`, "gi");
  const matches = [...text.matchAll(regex)];
  if (!matches.length) return "N/A";

  const amount = matches[matches.length - 1][1];
  return `${amount} $`;
}

export function extractTaxNumbers(text) {
  return {
    tps: (text.match(/TPS\s*[:\s]*([\w]+)/i) || [,"N/A"])[1],
    tvq: (text.match(/TVQ\s*[:\s]*([\w]+)/i) || [,"N/A"])[1]
  };
}

export function extractAmounts(text) {
  return {
    sousTotal: extractAmount(text, "Sous-total"),
    tpsMontant: extractAmount(text, "TPS"),
    tvqMontant: extractAmount(text, "TVQ"),
    total: extractAmount(text, "Total")
  };
}
