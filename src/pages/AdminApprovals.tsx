import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const TOKEN = import.meta.env.VITE_APPROVAL_TOKEN as string | undefined;
const APPROVAL_URL = (import.meta.env.VITE_APPROVAL_SUPABASE_URL as string) ?? "https://ojesmvryqehcmaolkbsd.supabase.co";
const APPROVAL_KEY = (import.meta.env.VITE_APPROVAL_SUPABASE_ANON_KEY as string) ?? "sb_publishable_QSRU-LZga7oHclWgMM7OBQ_5wUfvZM2";

const supabase = createClient(APPROVAL_URL, APPROVAL_KEY);

type Item = {
  id: string;
  created_at: string;
  topic_id: string;
  format: "reel" | "carousel";
  title: string;
  hook: string | null;
  status: "pending" | "approved" | "rejected" | "posted" | "failed" | "processing";
  slides_urls: string[] | null;
  video_url: string | null;
  thumb_url: string | null;
  caption_instagram: string | null;
  caption_linkedin: string | null;
  cover_idx: number | null;
  cover_label: string | null;
  scheduled_for: string | null;
  posted_ig_url: string | null;
  posted_li_url: string | null;
};

const STATUS_LABELS: Record<Item["status"], string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  processing: "Processando",
  posted: "Publicado",
  failed: "Falhou",
};

const STATUS_COLORS: Record<Item["status"], string> = {
  pending: "border-l-yellow-400 bg-yellow-50/5",
  approved: "border-l-teal-400 bg-teal-50/5",
  rejected: "border-l-red-400 bg-red-50/5 opacity-70",
  processing: "border-l-blue-400 bg-blue-50/5",
  posted: "border-l-slate-400 bg-slate-50/5 opacity-80",
  failed: "border-l-red-500 bg-red-50/10",
};

export default function AdminApprovals() {
  const [params] = useSearchParams();
  const providedToken = params.get("t");

  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<Item["status"] | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Auth check
  if (!TOKEN) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex items-center justify-center">
        <div>VITE_APPROVAL_TOKEN não configurado.</div>
      </div>
    );
  }
  if (providedToken !== TOKEN) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">🔒 Acesso restrito</div>
          <div className="text-slate-400 text-sm">Token inválido ou ausente.</div>
        </div>
      </div>
    );
  }

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pending_approvals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setItems(data as Item[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // refresh a cada 30s
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const approve = async (id: string) => {
    if (!confirm("Aprovar e postar agora? O agente local vai detectar em até 2 minutos.")) return;
    const { error } = await supabase
      .from("pending_approvals")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      showToast("❌ Erro: " + error.message);
    } else {
      showToast("✓ Aprovado — agente local detectará em até 2min");
      load();
    }
  };

  const reject = async (id: string) => {
    if (!confirm("Rejeitar este item?")) return;
    const { error } = await supabase
      .from("pending_approvals")
      .update({ status: "rejected" })
      .eq("id", id);
    if (!error) { showToast("Rejeitado"); load(); }
  };

  const counts = {
    all: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
    processing: items.filter((i) => i.status === "processing").length,
    posted: items.filter((i) => i.status === "posted").length,
    failed: items.filter((i) => i.status === "failed").length,
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-baseline mb-4 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Saga · <span className="text-teal-400">Aprovações</span>
            </h1>
            <div className="text-xs text-slate-500 mt-1">
              {items.length} itens · atualiza a cada 30s · agente posta em até 2min após aprovação
            </div>
          </div>
          <button
            onClick={load}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-500"
          >
            ↻ Atualizar agora
          </button>
        </header>

        {/* Filters */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {(["pending", "approved", "processing", "posted", "rejected", "failed", "all"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                filter === k
                  ? "bg-teal-500 text-slate-950"
                  : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-500"
              }`}
            >
              {k === "all" ? "Todos" : STATUS_LABELS[k]}
              <span className="ml-1.5 opacity-70 font-bold">{counts[k]}</span>
            </button>
          ))}
        </div>

        {loading && <div className="text-slate-500 text-center py-8">Carregando...</div>}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-lg text-slate-300 mb-2">Nada por aqui.</h3>
            <div className="text-slate-500 text-sm">
              Sem itens com status "{filter === "all" ? "Todos" : STATUS_LABELS[filter as Item["status"]]}".
            </div>
          </div>
        )}

        {filtered.map((item) => (
          <div
            key={item.id}
            className={`bg-slate-900 border border-slate-800 border-l-4 rounded-2xl p-6 mb-5 ${STATUS_COLORS[item.status]}`}
          >
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <div className="text-xl font-bold leading-tight">{item.title}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {item.format} · id: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-teal-400 text-[11px]">{item.topic_id}</code>
                  {item.scheduled_for && ` · agendado: ${new Date(item.scheduled_for).toLocaleString("pt-BR")}`}
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 whitespace-nowrap">
                {STATUS_LABELS[item.status]}
              </span>
            </div>

            {/* Carousel preview */}
            {item.format === "carousel" && item.slides_urls && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                {item.slides_urls.map((url, i) => (
                  <div key={i} className="aspect-[4/5] rounded-lg overflow-hidden bg-slate-800 relative">
                    <img src={url} alt={`slide ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute top-1 left-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reel preview */}
            {item.format === "reel" && item.video_url && (
              <div className="flex gap-4 mb-4">
                <video controls poster={item.thumb_url ?? undefined} src={item.video_url} className="rounded-lg bg-black max-w-[280px]" />
                {item.thumb_url && (
                  <div className="text-xs text-slate-400">
                    <div className="uppercase font-semibold mb-1">Capa</div>
                    <img src={item.thumb_url} alt="thumb" className="w-32 rounded" />
                  </div>
                )}
              </div>
            )}

            {/* Captions */}
            {(item.caption_instagram || item.caption_linkedin) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {item.caption_instagram && (
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <div className="text-[11px] text-teal-400 font-bold tracking-wider uppercase mb-2">Instagram</div>
                    <div className="text-xs text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                      {item.caption_instagram}
                    </div>
                  </div>
                )}
                {item.caption_linkedin && (
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <div className="text-[11px] text-teal-400 font-bold tracking-wider uppercase mb-2">LinkedIn</div>
                    <div className="text-xs text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                      {item.caption_linkedin}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action bar */}
            {item.status === "pending" && (
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => approve(item.id)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-slate-950 font-bold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition"
                >
                  ✓ Aprovar e Postar
                </button>
                <button
                  onClick={() => reject(item.id)}
                  className="px-5 py-2.5 rounded-xl bg-transparent text-slate-400 border border-slate-700 hover:border-slate-500 font-semibold"
                >
                  Rejeitar
                </button>
              </div>
            )}

            {item.posted_ig_url && (
              <div className="flex gap-3 mt-3 text-xs">
                <a href={item.posted_ig_url} target="_blank" rel="noopener" className="text-teal-400 hover:underline font-semibold">
                  ↗ Instagram
                </a>
                {item.posted_li_url && (
                  <a href={item.posted_li_url} target="_blank" rel="noopener" className="text-teal-400 hover:underline font-semibold">
                    ↗ LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-teal-500 text-slate-950 px-6 py-3 rounded-xl font-bold shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
