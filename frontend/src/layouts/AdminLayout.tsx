import { NavLink, Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { logoutAdmin } from "../api/authApi";
import { useAuth } from "../features/auth";
import { AppLayout } from "./AppLayout";

const links = [
  { to: "/admin/tournaments", label: "Турниры" },
  { to: "/admin/participants", label: "Участники" },
  { to: "/admin/matches", label: "Матчи" },
  { to: "/admin/settings", label: "Настройки" },
  { to: "/admin/audit", label: "Аудит" }
];

export function AdminLayout(): JSX.Element {
  const auth = useAuth();
  const navigate = useNavigate();

  const onLogout = async (): Promise<void> => {
    try {
      await logoutAdmin();
    } catch {
      // no-op: local logout is still required
    }
    auth.clearSession();
    navigate("/admin/login", { replace: true });
  };

  return (
    <AppLayout>
      <header className="mb-6 rounded-xl border border-white/10 bg-panel/85 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-accent">Admin Console</p>
            <p className="text-2xl font-semibold text-textMain">Управление турниром</p>
            <p className="mt-1 text-xs text-textMuted">{auth.email ?? "admin"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-2">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-md border px-3 py-1.5 text-sm transition ${
                      isActive
                        ? "border-satellite/60 bg-satellite/10 text-satellite"
                        : "border-white/15 bg-black/15 text-textMuted hover:text-textMain"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <button
              className="rounded-md border border-rose-500/50 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-300"
              onClick={() => void onLogout()}
              type="button"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </AppLayout>
  );
}
