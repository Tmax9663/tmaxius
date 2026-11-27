import { CARDS } from "../../../lib/cards.js";

export async function onRequestPost({ request, params, env }) {
  if (!CARDS[params.slug]) return Response.json({ ok: false }, { status: 404 });
  let b; try { b = await request.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  const name = String(b.name || "").trim().slice(0, 80);
  const contact = String(b.contact || "").trim().slice(0, 120);
  const message = String(b.message || "").trim().slice(0, 2000);
  if (b.company) return Response.json({ ok: true });   // honeypot → fake success
  if (!name || !contact || !message) return Response.json({ ok: false }, { status: 422 });
  const key = `${params.slug}:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;
  await env.LEADS.put(key, JSON.stringify({
    name, contact, message, lang: b.lang || "en",
    country: request.cf?.country || "", ts: new Date().toISOString()
  }));
  return Response.json({ ok: true });
}