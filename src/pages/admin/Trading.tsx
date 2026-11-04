import { useEffect, useState } from "react";
import { adminSupabase } from "@/lib/adminSupabase";
import { useAdminAuth } from "@/components/admin/AuthGate";

type Run = { id: string; started_at: string; finished_at: string | null; trade_date: string | null; slot: string | null; status: string; error: string | null; n_symbols: number; n_candidates: number; n_published: number; n_closed: number; cost_usd_estimate: number | null; log: string | null };
type Conta = { captured_at: string; account_number: string | null; net_liq: number | null; option_bp: number | null; stock_bp: number | null; pl_day: number | null; pl_ytd: number | null; positions: { symbol: string; type: string; qty: number; direction: string; avg_open: number | null; close_price: number | null }[] };
type Estudo = { id: string; slug: string; status: string; horizon: string; symbol: string; strategy_type: string; title: string; published_at: string; result_pct: number | null; reviewed: boolean; model: string | null };

const usd = (v: number | null | undefined) => (v == null ? "—" : `US$ ${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`);
const dt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR") : "—");
const STATUS: Record<string, string> = { running: "text-blue-300", done: "text-teal-300", failed: "text-red-400", skipped: "text-slate-400", dry_run: "text-yellow-300" };

export default function AdminTrading() {
  const { user } = useAdminAuth();
  const [runs, setRuns] = useState<Run[]>([]);
  const [conta, setConta] = useState<Conta | null>(null);
  const [estudos, setEstudos] = useState<Estudo[]>([]);
  const [slot, setSlot] = useState("");
  const [dry, setDry] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [r, c, e] = await Promise.all([
      adminSupabase.from("trading_runs").select("*").order("started_at", { ascending: false }).limit(20),
      adminSupabase.from("account_snapshots").select("*").order("captured_at", { ascending: false }).limit(1),
      adminSupabase.from("trade_studies").select("id, slug, status, horizon, symbol, strategy_type, title, published_at, result_pct, reviewed, model").order("published_at", { ascending: false }).limit(40),
    ]);
    if (r.data) setRuns(r.data as Run[]);
    if (c.data?.[0]) setConta(c.data[0] as Conta);
    if (e.data) setEstudos(e.data as Estudo[]);
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const rodar = async () => {
    setBusy(true); setMsg(null);
    try {
      const { data } = await adminSupabase.auth.getSession();
      const jwt = data.session?.access_token;
      const r = await fetch("/api/trading-run", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` }, body: JSON.stringify({ slot, dry_run: dry }) });
      const j = await r.json();
      setMsg(r.ok ? `Workflow disparado (${j.slot}, ${j.dry_run ? "dry run" : "real"}). Acompanhe em GitHub → Actions; o log aparece aqui em ~1–3 min.` : `Erro: ${j.error}`);
    } catch (e) {
      setMsg(`Erro: ${(e as Error).message}`);
    } finally { setBusy(false); }
  };

  const toggleReviewed = async (e: Estudo) => {
    await adminSupabase.from("trade_studies").update({ reviewed: !e.reviewed }).eq("id", e.id);
    load();
  };

  return (
    <div className="grid gap-8">
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="font-bold text-lg mb-1">Agente de Trading</h2>
        <p className="text-sm text-slate-400 mb-4">Roda 4x por dia de pregão via GitHub Actions. Aqui você dispara uma execução manual (sempre com <code>force</code>).</p>
        <div className="flex flex-wrap items-center gap-3">
          <select value={slot} onChange={(e) => setSlot(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
            <option value="">slot automático (horário de NY)</option>
            <option value="pre_open">pre_open</option><option value="mid_morning">mid_morning</option><option value="mid_afternoon">mid_afternoon</option><option value="post_close">post_close</option>
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dry} onChange={(e) => setDry(e.target.checked)} /> dry run (não publica)</label>
          <button onClick={rodar} disabled={busy} className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-bold text-sm disabled:opacity-50">{busy ? "Disparando…" : "Rodar agora"}</button>
          <span className="text-xs text-slate-500">por {user?.email}</span>
        </div>
        {msg && <p className="text-sm mt-3 text-slate-300">{msg}</p>}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="font-bold text-lg mb-3">Conta tastytrade (privado)</h2>
        {conta ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              {[["Net liq", usd(conta.net_liq)], ["Option BP", usd(conta.option_bp)], ["Stock BP", usd(conta.stock_bp)], ["P/L dia", usd(conta.pl_day)], ["Conta", conta.account_number ?? "—"]].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-slate-800/60 p-3"><div className="text-[10px] uppercase tracking-widest text-slate-500">{l}</div><div className="font-semibold tabular-nums">{v}</div></div>
              ))}
            </div>
            <div className="text-xs text-slate-500 mb-2">Snapshot {dt(conta.captured_at)} · {conta.positions?.length ?? 0} posição(ões)</div>
            {conta.positions?.length ? (
              <table className="w-full text-sm"><thead className="text-[11px] uppercase text-slate-500"><tr><th className="text-left py-1">Símbolo</th><th className="text-left py-1">Tipo</th><th className="text-right py-1">Qtd</th><th className="text-right py-1">Preço médio</th><th className="text-right py-1">Último</th></tr></thead>
                <tbody>{conta.positions.map((p, i) => <tr key={i} className="border-t border-slate-800 tabular-nums"><td className="py-1">{p.symbol}</td><td className="py-1 text-slate-400">{p.type}</td><td className="py-1 text-right">{p.direction === "Short" ? "-" : ""}{p.qty}</td><td className="py-1 text-right">{p.avg_open ?? "—"}</td><td className="py-1 text-right">{p.close_price ?? "—"}</td></tr>)}</tbody></table>
            ) : null}
          </>
        ) : <p className="text-sm text-slate-500">Nenhum snapshot ainda. Rode o agente (sem dry run) para gravar o primeiro.</p>}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="font-bold text-lg mb-3">Execuções</h2>
        {runs.length ? (
          <table className="w-full text-sm"><thead className="text-[11px] uppercase text-slate-500"><tr><th className="text-left py-1">Início</th><th className="text-left py-1">Slot</th><th className="text-left py-1">Status</th><th className="text-right py-1">Símb.</th><th className="text-right py-1">Cand.</th><th className="text-right py-1">Publ.</th><th className="text-right py-1">Enc.</th><th className="text-right py-1">Custo IA</th><th className="text-left py-1">Erro / log</th></tr></thead>
            <tbody>{runs.map((r) => <tr key={r.id} className="border-t border-slate-800 tabular-nums align-top"><td className="py-1 whitespace-nowrap">{dt(r.started_at)}</td><td className="py-1">{r.slot ?? "—"}</td><td className={`py-1 font-semibold ${STATUS[r.status] ?? ""}`}>{r.status}</td><td className="py-1 text-right">{r.n_symbols}</td><td className="py-1 text-right">{r.n_candidates}</td><td className="py-1 text-right">{r.n_published}</td><td className="py-1 text-right">{r.n_closed}</td><td className="py-1 text-right">{r.cost_usd_estimate != null ? `$${r.cost_usd_estimate}` : "—"}</td><td className="py-1 text-xs text-slate-400 max-w-[280px] truncate" title={r.error ?? r.log ?? ""}>{r.error ?? r.log ?? ""}</td></tr>)}</tbody></table>
        ) : <p className="text-sm text-slate-500">Nenhuma execução registrada.</p>}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="font-bold text-lg mb-3">Estudos (revisão)</h2>
        {estudos.length ? (
          <table className="w-full text-sm"><thead className="text-[11px] uppercase text-slate-500"><tr><th className="text-left py-1">Publicado</th><th className="text-left py-1">Estudo</th><th className="text-left py-1">Horizonte</th><th className="text-left py-1">Status</th><th className="text-right py-1">Resultado</th><th className="text-center py-1">Revisado</th></tr></thead>
            <tbody>{estudos.map((e) => <tr key={e.id} className="border-t border-slate-800 align-top"><td className="py-1 whitespace-nowrap text-slate-400">{dt(e.published_at)}</td><td className="py-1"><a className="text-teal-300 hover:underline" href={`/trading/${e.slug}`} target="_blank" rel="noreferrer">{e.symbol} · {e.title}</a><div className="text-[11px] text-slate-500">{e.strategy_type} · {e.model ?? ""}</div></td><td className="py-1">{e.horizon}</td><td className="py-1">{e.status}</td><td className="py-1 text-right tabular-nums">{e.result_pct != null ? `${e.result_pct}%` : "—"}</td><td className="py-1 text-center"><input type="checkbox" checked={e.reviewed} onChange={() => toggleReviewed(e)} /></td></tr>)}</tbody></table>
        ) : <p className="text-sm text-slate-500">Nenhum estudo publicado ainda.</p>}
      </section>
    </div>
  );
}
