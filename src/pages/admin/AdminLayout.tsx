import { NavLink, Outlet } from "react-router-dom";
import { AuthGate, useAdminAuth } from "@/components/admin/AuthGate";

const TABS = [
  { to: "/admin", label: "Aprovações", end: true },
  { to: "/admin/calendar", label: "Calendário", end: false },
  { to: "/admin/metrics", label: "Métricas", end: false },
  { to: "/admin/generate", label: "Gerar", end: false },
];

function Shell() {
  const { user, signOut } = useAdminAuth();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="font-extrabold tracking-tight text-lg">
            Saga · <span className="text-teal-400">Studio</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden sm:inline">{user?.email}</span>
            <button
              onClick={signOut}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-500"
            >
              Sair
            </button>
          </div>
        </div>
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                  isActive
                    ? "border-teal-400 text-teal-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AuthGate>
      <Shell />
    </AuthGate>
  );
}
