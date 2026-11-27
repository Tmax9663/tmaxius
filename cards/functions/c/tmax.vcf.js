import { CARDS } from "../../lib/cards.js";

const enc = new TextEncoder();
const fold = (l) => {                       // RFC 6350 line folding
  const out = [];
  while (enc.encode(l).length > 74) {
    let cut = 74;
    while (enc.encode(l.slice(0, cut)).length > 74) cut--;
    out.push(l.slice(0, cut)); l = " " + l.slice(cut);
  }
  out.push(l); return out.join("\r\n");
};

export async function onRequestGet({ params }) {
  const c = CARDS[params.slug];
  if (!c) return new Response("Not found", { status: 404 });
  const lines = [
    "BEGIN:VCARD", "VERSION:3.0",
    `N:;${c.name};;;`, `FN:${c.name}`, `ORG:${c.org}`, `TITLE:${c.title}`,
    `TEL;TYPE=CELL:${c.phone}`, `EMAIL;TYPE=WORK:${c.email}`,
    `URL:${c.url}`, `URL;TYPE=WORK:${c.card}`,
    `ADR;TYPE=WORK:;;;${c.city};;;${c.country}`,
    `NOTE:${c.note}`, `REV:${new Date().toISOString()}`, "END:VCARD"
  ];
  return new Response(lines.map(fold).join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${params.slug}.vcf"`,
      "Cache-Control": "public, max-age=3600"
    }
  });
}