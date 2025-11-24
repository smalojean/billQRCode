// transactions.js
import { formatDay } from "./utils.js";

export function processTransactions(txList) {
  if (!txList.length) return [];

  // Déterminer le jour majoritaire
  const dayCount = {};
  txList.forEach(tx => {
    const dayStr = formatDay(tx.date);
    if (!dayStr) return;
    dayCount[dayStr] = (dayCount[dayStr] || 0) + 1;
  });
  const majorityDay = Object.entries(dayCount).sort((a,b)=>b[1]-a[1])[0]?.[0];

  // Supprimer doublons
  const seen = new Set();
  const unique = [];
  txList.forEach(tx => {
    const key = `${tx.transaction}-${tx.invoiceNumber}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(tx);
    }
  });

  return { unique, majorityDay };
}
