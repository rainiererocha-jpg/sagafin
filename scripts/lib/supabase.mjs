// Acesso REST ao Supabase com a service role (só em CI/servidor, nunca no navegador).
import { env, fetchJson, fail } from "./util.mjs";

export function sbHeaders(extra = {}) {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...extra };
}

export function sbUrl(path) {
  return `${env("SUPABASE_URL").replace(/\/$/, "")}/rest/v1/${path}`;
}

/** GET em uma tabela/view. `query` é a string PostgREST (ex.: "slug=eq.x&select=id"). */
export async function sbSelect(table, query, extraHeaders = {}) {
  const r = await fetchJson(sbUrl(`${table}?${query}`), { headers: sbHeaders(extraHeaders) });
  if (!r.ok && r.status !== 416) fail(`Supabase (${table} select) HTTP ${r.status}: ${r.text.slice(0, 300)}`);
  return Array.isArray(r.json) ? r.json : [];
}

/** INSERT (ou UPSERT com `onConflict`) devolvendo as linhas gravadas. */
export async function sbInsert(table, rows, { onConflict, ignoreDuplicates = false } = {}) {
  const prefer = [
    "return=representation",
    onConflict ? (ignoreDuplicates ? "resolution=ignore-duplicates" : "resolution=merge-duplicates") : null,
  ].filter(Boolean).join(",");
  const q = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : "";
  const r = await fetchJson(sbUrl(`${table}${q}`), {
    method: "POST",
    headers: sbHeaders({ Prefer: prefer }),
    body: JSON.stringify(rows),
  });
  if (!r.ok) fail(`Supabase (${table} insert) HTTP ${r.status}: ${r.text.slice(0, 500)}`);
  return Array.isArray(r.json) ? r.json : [];
}

/** PATCH filtrado por query PostgREST. */
export async function sbUpdate(table, query, patch) {
  const r = await fetchJson(sbUrl(`${table}?${query}`), {
    method: "PATCH",
    headers: sbHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(patch),
  });
  if (!r.ok) fail(`Supabase (${table} update) HTTP ${r.status}: ${r.text.slice(0, 500)}`);
  return Array.isArray(r.json) ? r.json : [];
}

/** Chama uma função RPC. */
export async function sbRpc(fn, args = {}) {
  const r = await fetchJson(`${env("SUPABASE_URL").replace(/\/$/, "")}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: sbHeaders(),
    body: JSON.stringify(args),
  });
  if (!r.ok) fail(`Supabase (rpc ${fn}) HTTP ${r.status}: ${r.text.slice(0, 500)}`);
  return r.json;
}

/** Upload de um arquivo binário para o Storage (bucket público). Devolve a URL pública. */
export async function sbUpload(bucket, objectPath, buffer, contentType = "image/png") {
  const base = env("SUPABASE_URL").replace(/\/$/, "");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  const r = await fetch(`${base}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": contentType, "x-upsert": "true" },
    body: buffer,
  });
  if (!r.ok) fail(`Supabase (storage upload) HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return `${base}/storage/v1/object/public/${bucket}/${objectPath}`;
}
