export function formatDay(date) {
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export function formatDateTime(date) {
  if (!date) return "N/A";
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ` +
         `${String(date.getHours()).padStart(2,'0')} h ${String(date.getMinutes()).padStart(2,'0')} min ${String(date.getSeconds()).padStart(2,'0')} s`;
}

export function parseNumber(str) {
  if (!str) return 0;
  return parseFloat(str.replace(",", ".").replace(/\s*\$/g,"")) || 0;
}

export let loadingInterval;
export function startLoadingAnimation(statusEl) {
  let dots = 0;
  let increasing = true;
  statusEl.textContent = "Traitement";
  loadingInterval = setInterval(() => {
    statusEl.textContent = "Traitement" + ".".repeat(dots);
    if (increasing) {
      dots++;
      if (dots === 6) increasing = false;
    } else {
      dots--;
      if (dots === 0) increasing = true;
    }
  }, 300);
}

export function stopLoadingAnimation(statusEl) {
  clearInterval(loadingInterval);
  statusEl.textContent = "Terminé";
}
