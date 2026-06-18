import { useEffect, useState } from "react";
import { adminSupabase } from "@/lib/adminSupabase";
import { useAdminAuth } from "@/components/admin/AuthGate";

type Req = {
  id: string;
  created_at: string;
  type: string;
  status: "queued" | "running" | "done" | "failed" | "manual";
  result_summary: string | null;
  error: string | null;
  finished_at: string | null;
};

const TYPES = [
  { type: "daily_post", title: "Gerar 1 post agora", desc: "Reel ou carrossel do dia (alterna automático). Automático: cai em Aprovações.", emoji: "📷" },
  { type: "weekly_video", title: "Gerar vídeo da semana", desc: "Vídeo 60s com clone IA (próximo tema do WEEKLY_PLAN). Roda no chat (geração criativa).", emoji: "🎬" },
  { type: "batch_posts", title: "Gerar lote (10 posts)", desc: "10 posts estáticos IG+LinkedIn — reabastece a fila. Roda no chat (geração criativa).", emoji: "📦" },
];

const STATUS_LABELS: Record<Req["status"], string> = {
  queued: "Na fila", running: "Rodando", done: "Concluído", failed: "Falhou", manual: "Rodar no chat",
};
const STATUS_COLORS: Record<Req["status"], string> = {
  queued: "text-yellow-400", running: "text-blue-400", done: "text-teal-400", failed: "text-red-400", manual: "text-purple-400",
};

export default function Generate() {
  const { user } = useAdminAuth();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { data } = await adminSupabase
      .from("generation_requests")
      .select("id,created_at,type,status,result_summary,error,finished_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setReqs(data as Req[]);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
  }, []);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  const request = async (type: string) => {
    setBusy(type);
    const { error } = await adminSupabase.from("generation_requests").insert({
      type, status: "queued", requested_by: user?.email ?? null,
    });
    setBusy(null);
    if (error) showToast("❌ " + error.message);
    else { showToast("✓ Pedido enfileirado — o agente local começa em até 3min"); load(); }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Gerar conteúdo</h1>
      <p className="text-xs text-slate-500 mb-6">
        O agente local detecta o pedido em até 3 min, gera o conteúdo e envia para <b>Aprovações</b>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {TYPES.map((t) => (
          <button
            key={t.type}
            onClick={() => request(t.type)}
            disabled={busy === t.type}
            className="text-left bg-slate-900 border border-slate-800 hover:border-teal-500 rounded-2xl p-5 transition disabled:opacity-60"
          >
            <div className="text-3xl mb-3">{t.emoji}</div>
            <div className="font-bold text-slate-100 mb-1">{t.title}</div>
            <div className="text-xs text-slate-400 leading-relaxed">{t.desc}</div>
            <div className="mt-4 inline-block text-[11px] font-bold text-teal-400">
              {busy === t.type ? "Enfileirando…" : "Solicitar →"}
            </div>
          </button>
        ))}
      </div>

      <div className="text-sm font-bold text-slate-200 mb-3">Últimos pedidos</div>
      {reqs.length === 0 && <div className="text-slate-500 text-sm">Nenhum pedido ainda.</div>}
      <div className="space-y-2">
        {reqs.map((r) => (
          <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-200">
                {TYPES.find((t) => t.type === r.type)?.title ?? r.type}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {new Date(r.created_at).toLocaleString("pt-BR")}
                {r.result_summary && ` · ${r.result_summary}`}
                {r.error && <span className="text-red-400"> · {r.error.slice(0, 80)}</span>}
              </div>
            </div>
            <span className={`text-xs font-bold whitespace-nowrap ${STATUS_COLORS[r.status]}`}>
              {STATUS_LABELS[r.status]}
            </span>
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-teal-500 text-slate-950 px-6 py-3 rounded-xl font-bold shadow-2xl z-30">{toast}</div>
      )}
    </div>
  );
}
