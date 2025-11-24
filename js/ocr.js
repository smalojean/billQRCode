// js/ocr.js
export async function extractTextFromPage(page) {
  const content = await page.getTextContent();

  if (content.items.length > 0) {
    return content.items.map(i => i.str).join(" ");
  }

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
