import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { adminSupabase } from "@/lib/adminSupabase";

type SP = { platform: string | null; status: string | null; posted_at: string | null; scheduled_for: string | null };
type PA = { status: string | null };

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#ec4899",
  linkedin: "#38bdf8",
  tiktok: "#e2e8f0",
  youtube: "#f87171",
};

function weekKey(iso: string) {
  const d = new Date(iso);
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-S${String(week).padStart(2, "0")}`;
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className={`text-3xl font-extrabold ${color ?? "text-slate-100"}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">{label}</div>
    </div>
  );
}

export default function Metrics() {
  const [social, setSocial] = useState<SP[]>([]);
  const [approvals, setApprovals] = useState<PA[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: a }] = await Promise.all([
        adminSupabase.from("social_posts").select("platform,status,posted_at,scheduled_for").limit(1000),
        adminSupabase.from("pending_approvals").select("status").limit(1000),
      ]);
      setSocial((s as SP[]) ?? []);
      setApprovals((a as PA[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const published = social.filter((p) => p.status === "published");
  const failed = social.filter((p) => p.status === "failed");
  const scheduled = social.filter((p) => p.status === "scheduled");

  const runwayDays = useMemo(() => {
    const future = scheduled.map((p) => p.scheduled_for).filter(Boolean).sort() as string[];
    if (!future.length) return 0;
    return Math.max(0, Math.ceil((new Date(future[future.length - 1]).getTime() - Date.now()) / 86400000));
  }, [scheduled]);

  const perWeek = useMemo(() => {
    const map = new Map<string, { week: string; publicados: number; falhas: number }>();
    for (const p of published) {
      const k = weekKey(p.posted_at ?? p.scheduled_for ?? new Date().toISOString());
      const row = map.get(k) ?? { week: k, publicados: 0, falhas: 0 };
      row.publicados++; map.set(k, row);
    }
    for (const p of failed) {
      const k = weekKey(p.scheduled_for ?? p.posted_at ?? new Date().toISOString());
      const row = map.get(k) ?? { week: k, publicados: 0, falhas: 0 };
      row.falhas++; map.set(k, row);
    }
    return Array.from(map.values()).sort((a, b) => a.week.localeCompare(b.week)).slice(-12);
  }, [published, failed]);

  const byPlatform = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of published) map.set(p.platform ?? "?", (map.get(p.platform ?? "?") ?? 0) + 1);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [published]);

  const funnel = useMemo(() => {
    const order = ["pending", "approved", "processing", "posted", "rejected", "failed"];
    const labels: Record<string, string> = {
      pending: "Pendente", approved: "Aprovado", processing: "Processando",
      posted: "Publicado", rejected: "Rejeitado", failed: "Falhou",
    };
    const map = new Map<string, number>();
    for (const a of approvals) map.set(a.status ?? "?", (map.get(a.status ?? "?") ?? 0) + 1);
    return order.filter((s) => map.has(s)).map((s) => ({ etapa: labels[s], qtd: map.get(s)! }));
  }, [approvals]);

  if (loading) return <div className="text-slate-500 text-center py-8">Carregando métricas…</div>;

  const hasData = social.length > 0 || approvals.length > 0;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight mb-6">Métricas e Resultados</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Publicados" value={published.length} color="text-teal-400" />
        <Stat label="Agendados" value={scheduled.length} color="text-sky-400" />
        <Stat label="Falhas" value={failed.length} color={failed.length ? "text-red-400" : "text-slate-100"} />
        <Stat label="Fôlego da fila" value={`${runwayDays}d`} color={runwayDays >= 3 ? "text-teal-400" : "text-yellow-400"} />
      </div>

      {!hasData && (
        <div className="text-sm bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-400">
          Ainda sem dados sincronizados. Rode <code>sync_blotato.py</code> (ou aguarde o sync agendado) para popular publicados/agendados.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {perWeek.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="text-sm font-bold text-slate-200 mb-4">Publicados × Falhas por semana</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={perWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} />
                <Bar dataKey="publicados" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                <Bar dataKey="falhas" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {byPlatform.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="text-sm font-bold text-slate-200 mb-4">Publicados por plataforma</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byPlatform} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {byPlatform.map((e) => (
                    <Cell key={e.name} fill={PLATFORM_COLORS[e.name] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {funnel.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:col-span-2">
            <div className="text-sm font-bold text-slate-200 mb-4">Funil de aprovação</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <YAxis type="category" dataKey="etapa" tick={{ fontSize: 11, fill: "#64748b" }} width={90} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} />
                <Bar dataKey="qtd" fill="#2dd4bf" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-600 mt-6">
        Engajamento (curtidas/comentários/views) será exibido quando disponível via Blotato/Instagram. Hoje o painel mostra métricas operacionais.
      </div>
    </div>
  );
}
