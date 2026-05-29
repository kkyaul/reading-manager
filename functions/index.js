const { onRequest } = require("firebase-functions/v2/https");
const fetch = require("node-fetch");

exports.aladinSearch = onRequest(
  { cors: ["https://kkyaul.github.io"], region: "asia-northeast3" },
  async (req, res) => {
    const query = req.query.q;
    if (!query) { res.status(400).json({ error: "query required" }); return; }

    const TTB = "ttbkkyaul03232310001"; // ← 여기에 TTB 키 입력
    const url = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx`
      + `?ttbkey=${TTB}&Query=${encodeURIComponent(query)}`
      + `&QueryType=Title&MaxResults=10&SearchTarget=Book&output=js&Version=20131101`;

    try {
      const apiRes = await fetch(url);
      const data   = await apiRes.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);