// display.js
import { formatDateTime } from "./utils.js";
import { parseNumber } from "./utils.js"; // ou transactions.js si tu préfères

export function displayTransactions(transactions, resultsList, majorityDay) {
  resultsList.innerHTML = transactions.map((tx, index) => {
    const dateStr = formatDateTime(tx.date);
    const txDay = formatDateTime(tx.date).split(" ")[0]; // YYYY-MM-DD
    const style = (majorityDay && txDay !== majorityDay) ? "color:red;" : "";

    return `
      <li style="${style}">
        <input type="checkbox" class="tx-checkbox" data-index="${index}" checked>
        <strong>${tx.transaction}</strong> — ${dateStr}<br>
        Total: ${tx.total}
      </li>
    `;
  }).join("");
}

export function attachCheckboxListeners(transactions, countsDiv) {
  document.querySelectorAll(".tx-checkbox").forEach(cb => {
    cb.addEventListener("change", () => updateCounts(transactions, countsDiv));
  });
}

export function updateCounts(transactions, countsDiv) {
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
