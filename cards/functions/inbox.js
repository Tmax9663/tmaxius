const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.INBOX_KEY || url.searchParams.get("key") !== env.INBOX_KEY)
    return new Response("Unauthorized", { status: 401 });
  const list = await env.LEADS.list({ limit: 100 });
  const rows = [];
  for (const k of list.keys) {
    const v = JSON.parse((await env.LEADS.get(k.name)) || "{}");
    rows.push(`<tr><td>${esc(v.ts)}</td><td>${esc(k.name.split(":")[0])}</td><td>${esc(v.name)}</td><td>${esc(v.contact)}</td><td>${esc(v.message)}</td></tr>`);
  }
  rows.reverse();
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>TmaxCards inbox</title><style>body{font:14px system-ui;padding:20px}td,th{border:1px solid #ccc;padding:6px 10px;text-align:left}table{border-collapse:collapse}</style><h1>Leads (${rows.length})</h1><table><tr><th>When</th><th>Card</th><th>Name</th><th>Contact</th><th>Message</th></tr>${rows.join("")}</table>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}