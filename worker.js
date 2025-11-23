// worker.js
export default {
  async fetch(request) {
    try {
      const url = new URL(request.url).searchParams.get("url");
      if (!url) return new Response("Missing url", { status: 400 });
      // Optionnel : restreindre domaines pour sécurité
      // const allowed = ["revenuquebec.ca","qr.mev-web.ca"];
      // if (!allowed.some(d => url.includes(d))) return new Response("Domain not allowed", {status:403});

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; QR-Scraper/1.0)"
        }
      });
      const text = await res.text();

      return new Response(text, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET"
        }
      });
    } catch (err) {
      return new Response("Worker error: " + err.message, { status: 500 });
    }
  }
};
