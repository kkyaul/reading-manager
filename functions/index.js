// ============================================================
// functions/index.js
// Firebase Functions — 알라딘 검색 프록시 + 이미지 프록시
// ============================================================
const { onRequest } = require("firebase-functions/v2/https");
const https = require("https");

// ── 알라딘 책 검색 프록시 ────────────────────────────────────
exports.aladinSearch = onRequest(
  { cors: ["https://kkyaul.github.io"], region: "asia-northeast3" },
  async (req, res) => {
    const query = req.query.q;
    if (!query) { res.status(400).json({ error: "query required" }); return; }

    const TTB = "ttbkkyaul03232310001"; // ← TTB 키 입력
    const url = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx`
      + `?ttbkey=${TTB}&Query=${encodeURIComponent(query)}`
      + `&QueryType=Title&MaxResults=10&SearchTarget=Book&output=js&Version=20131101`;

    try {
      const data = await _httpsGet(url);
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

// ── 이미지 프록시 (CORS 우회 + Storage 업로드용) ─────────────
exports.proxyImage = onRequest(
  { cors: ["https://kkyaul.github.io"], region: "asia-northeast3" },
  async (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl) { res.status(400).send("url required"); return; }

    // 알라딘 도메인만 허용
    if (!imageUrl.startsWith("https://image.aladin.co.kr")) {
      res.status(403).send("forbidden domain");
      return;
    }

    try {
      const { buffer, contentType } = await _httpsGetBuffer(imageUrl);
      res.set("Content-Type", contentType || "image/jpeg");
      res.set("Cache-Control", "public, max-age=86400");
      res.send(buffer);
    } catch (e) {
      res.status(500).send(e.message);
    }
  }
);

// ── 내부 헬퍼 ────────────────────────────────────────────────

/** https GET → 텍스트 반환 */
function _httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

/** https GET → Buffer + contentType 반환 (이미지용) */
function _httpsGetBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      const chunks = [];
      const contentType = res.headers['content-type'];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({
        buffer: Buffer.concat(chunks),
        contentType,
      }));
    }).on('error', reject);
  });
}