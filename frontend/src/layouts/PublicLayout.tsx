import { NavLink, Outlet } from "react-router-dom";
import { TournamentStatus } from "../api/types";
import { usePublicOverview } from "../features/hooks";
import { AppLayout } from "./AppLayout";

const links = [
  { to: "/participants", label: "Участники" },
  { to: "/schedule", label: "Расписание" },
  { to: "/bracket", label: "Сетка" },
  { to: "/results", label: "Итоги" },
  { to: "/tv", label: "TV" }
];

const tournamentStatusLabelMap: Record<TournamentStatus, string> = {
  draft: "Подготовка",
  in_progress: "Турнир идет",
  finished: "Завершен"
};

export function PublicLayout(): JSX.Element {
  const overviewQuery = usePublicOverview();
  const tournamentTitle = overviewQuery.data?.tournament.title ?? "Ping Pong Ping • Омск";
  const tournamentStatus = overviewQuery.data?.tournament.status;

  return (
    <AppLayout>
      <header className="mb-6 rounded-xl border border-white/10 bg-panel/85 p-4 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/reference.png"
              alt="Tournament logo"
              className="h-16 w-16 rounded-full border border-accent/40 object-cover"
            />
            <div>
              <p className="text-xs uppercase tracking-wide text-accent">Table Tennis Tournament</p>
              <p className="text-xl font-semibold">{tournamentTitle}</p>
              <p className="mt-0.5 text-xs text-textMuted">
                Статус:{" "}
                <span className="text-textMain">
                  {tournamentStatus ? tournamentStatusLabelMap[tournamentStatus] : "Недоступен"}
                </span>
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-md border px-3 py-1.5 text-sm transition ${
                    isActive
                      ? "border-accent/60 bg-accent/10 text-accent"
                      : "border-white/15 bg-black/15 text-textMuted hover:text-textMain"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <Outlet />
    </AppLayout>
  );
}
