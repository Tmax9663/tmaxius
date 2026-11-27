import qrcode from "qrcode-generator";
import { CARDS } from "../../../lib/cards.js";

export async function onRequestGet({ params }) {
  const c = CARDS[params.slug];
  if (!c) return new Response("Not found", { status: 404 });
  const qr = qrcode(0, "M");
  qr.addData(c.card); qr.make();
  const n = qr.getModuleCount(), s = 8, q = 4, size = (n + q * 2) * s;
  let d = "";
  for (let r = 0; r < n; r++)
    for (let col = 0; col < n; col++)
      if (qr.isDark(r, col)) d += `M${(col + q) * s} ${(r + q) * s}h${s}v${s}h-${s}z`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#123C8C"/></svg>`;
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" }
  });
}