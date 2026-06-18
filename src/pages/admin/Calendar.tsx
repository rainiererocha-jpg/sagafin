import { useEffect, useMemo, useState } from "react";
import { adminSupabase } from "@/lib/adminSupabase";

type Post = {
  blotato_id: string;
  account_id: string | null;
  platform: string | null;
  status: string | null;
  text: string | null;
  scheduled_for: string | null;
  synced_at: string | null;
};

const PLATFORM_DOT: Record<string, string> = {
  instagram: "bg-pink-400",
  linkedin: "bg-sky-400",
  tiktok: "bg-slate-200",
  youtube: "bg-red-400",
};

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function Calendar() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const load = async () => {
    const nowIso = new Date().toISOString();
    const { data } = await adminSupabase
      .from("social_posts")
      .select("*")
      .eq("status", "scheduled")
      .gte("scheduled_for", nowIso)
      .order("scheduled_for", { ascending: true });
    if (data) {
      setPosts(data as Post[]);
      setLastSync((data[0] as Post)?.synced_at ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 60000);
    return () => clearInterval(i);
  }, []);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  // Runway = quantos dias à frente vai o último post agendado
  const runwayDays = useMemo(() => {
    if (posts.length === 0) return 0;
    const last = posts[posts.length - 1].scheduled_for;
    if (!last) return 0;
    return Math.max(0, Math.ceil((new Date(last).getTime() - Date.now()) / 86400000));
  }, [posts]);

  const byDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) {
      if (!p.scheduled_for) continue;
      const key = new Date(p.scheduled_for).toISOString().slice(0, 10);
      (map.get(key) ?? map.set(key, []).get(key)!).push(p);
    }
    return Array.from(map.entries());
  }, [posts]);

  const queueCommand = async (action: "delete" | "reschedule", blotato_id: string, new_time?: string) => {
    const { error } = await adminSupabase.from("social_commands").insert({ action, blotato_id, new_time: new_time ?? null });
    if (error) showToast("❌ " + error.message);
    else showToast(action === "delete" ? "Remoção enfileirada (sincroniza em ~15min)" : "Reagendamento enfileirado");
  };

  const del = (id: string) => {
    if (confirm("Remover este post agendado do Blotato?")) queueCommand("delete", id);
  };
  const reschedule = (id: string, current: string | null) => {
    const def = current ? new Date(current).toISOString().slice(0, 16) : "";
    const v = prompt("Nova data/hora (formato 2026-06-20T14:01):", def);
    if (!v) return;
    const iso = new Date(v).toISOString();
    if (isNaN(Date.parse(iso))) return showToast("Data inválida");
    queueCommand("reschedule", id, iso);
  };

  const runwayColor = runwayDays >= 5 ? "text-teal-400" : runwayDays >= 2 ? "text-yellow-400" : "text-red-400";

  return (
    <div>
      <header className="flex justify-between items-baseline mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Calendário / Fila</h1>
          <div className="text-xs text-slate-500 mt-1">
            {posts.length} posts agendados
            {lastSync && ` · sincronizado ${new Date(lastSync).toLocaleString("pt-BR")}`}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-extrabold ${runwayColor}`}>{runwayDays}d</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">de fôlego na fila</div>
        </div>
      </header>

      {runwayDays < 3 && (
        <div className="mb-6 text-sm bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 rounded-xl p-4">
          ⚠️ A fila está acabando ({runwayDays} dia{runwayDays === 1 ? "" : "s"}). Vá em <b>Gerar</b> e crie um novo lote para a automação não parar.
        </div>
      )}

      {loading && <div className="text-slate-500 text-center py-8">Carregando...</div>}

      {!loading && posts.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-lg text-slate-300 mb-2">Fila vazia.</h3>
          <div className="text-slate-500 text-sm">
            Nenhum post agendado. Se você acabou de reativar, aguarde o próximo sync (~15min) ou rode <code>sync_blotato.py</code>.
          </div>
        </div>
      )}

      {byDay.map(([day, dayPosts]) => (
        <div key={day} className="mb-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{fmtDay(day + "T12:00:00Z")}</div>
          <div className="space-y-2">
            {dayPosts.map((p) => (
              <div key={p.blotato_id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
                <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${PLATFORM_DOT[p.platform ?? ""] ?? "bg-slate-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <span className="font-semibold text-slate-300">{fmtTime(p.scheduled_for!)}</span>
                    <span className="capitalize">{p.platform}</span>
                  </div>
                  <div className="text-sm text-slate-300 truncate">{p.text?.slice(0, 120) || "(sem texto)"}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => reschedule(p.blotato_id, p.scheduled_for)} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-500">Reagendar</button>
                  <button onClick={() => del(p.blotato_id)} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:border-red-500 text-red-300">Remover</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-teal-500 text-slate-950 px-6 py-3 rounded-xl font-bold shadow-2xl z-30">{toast}</div>
      )}
    </div>
  );
}
