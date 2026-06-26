import { AuditRecord } from "../../api/types";
import { PageTitle } from "../../components/PageTitle";
import { useAuditLog } from "../../features/hooks";
import { formatIsoDateTimeInOmsk, formatIsoInOmsk } from "../../shared/datetime";

type AuditParticipant = {
  id: string;
  nickname: string;
  tribe?: string;
};

type MatchAuditSnapshot = {
  roundNumber?: number;
  matchNumber?: number;
  participantA?: AuditParticipant | null;
  participantB?: AuditParticipant | null;
  winner?: AuditParticipant | null;
  scoreA?: number | null;
  scoreB?: number | null;
  status?: string;
  scheduledAt?: string | null;
};

function asMatchSnapshot(value: Record<string, unknown> | null): MatchAuditSnapshot {
  return (value ?? {}) as MatchAuditSnapshot;
}

function playerName(player: AuditParticipant | null | undefined): string {
  return player?.nickname ?? "TBD";
}

function matchTitle(snapshot: MatchAuditSnapshot): string {
  const round = snapshot.roundNumber ?? "—";
  const match = snapshot.matchNumber ?? "—";
  return `Тур ${round}, матч ${match}`;
}

function matchPlayers(snapshot: MatchAuditSnapshot): string {
  return `${playerName(snapshot.participantA)} vs ${playerName(snapshot.participantB)}`;
}

function matchScore(snapshot: MatchAuditSnapshot): string {
  if (snapshot.scoreA === null || snapshot.scoreA === undefined || snapshot.scoreB === null || snapshot.scoreB === undefined) {
    return "— : —";
  }
  return `${snapshot.scoreA} : ${snapshot.scoreB}`;
}

function actionView(row: AuditRecord): { title: string; badge: string; badgeClassName: string } {
  if (row.action === "match.schedule.manual") {
    return {
      title: "Назначен матч",
      badge: "Расписание",
      badgeClassName: "border-satellite/60 bg-satellite/10 text-satellite"
    };
  }
  if (row.action === "match.schedule.auto") {
    return {
      title: "Матч назначен автоматически",
      badge: "Автослот",
      badgeClassName: "border-accent/60 bg-accent/10 text-accent"
    };
  }
  if (row.action === "match.result.create") {
    return {
      title: "Сыгран матч",
      badge: "Результат",
      badgeClassName: "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
    };
  }
  if (row.action === "match.result.update") {
    return {
      title: "Изменен результат",
      badge: "Правка",
      badgeClassName: "border-amber-500/60 bg-amber-500/10 text-amber-200"
    };
  }
  if (row.action === "match.result.reset") {
    return {
      title: "Сброшен результат",
      badge: "Сброс",
      badgeClassName: "border-rose-500/60 bg-rose-500/10 text-rose-200"
    };
  }
  return {
    title: row.action.startsWith("tournament.") ? "Операция турнира" : "Действие",
    badge: row.action,
    badgeClassName: "border-white/20 bg-black/20 text-textMuted"
  };
}

function AuditCard({ row }: { row: AuditRecord }): JSX.Element {
  const before = asMatchSnapshot(row.beforeJson);
  const after = asMatchSnapshot(row.afterJson);
  const snapshot = row.afterJson ? after : before;
  const view = actionView(row);
  const isSchedule = row.action.includes("schedule");
  const isResult = row.action.includes("result");

  return (
    <article className="rounded-lg border border-white/10 bg-panel/90 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs ${view.badgeClassName}`}>{view.badge}</span>
            <h3 className="text-base font-semibold text-textMain">{view.title}</h3>
          </div>
          <p className="mt-1 text-sm text-textMuted">
            {matchTitle(snapshot)} · {matchPlayers(snapshot)}
          </p>
        </div>
        <div className="text-right text-xs text-textMuted">
          <p>{formatIsoInOmsk(row.createdAt)}</p>
          <p>{row.adminId ? `admin ${row.adminId.slice(0, 8)}` : "system"}</p>
        </div>
      </div>

      {isSchedule ? (
        <div className="mt-3 grid gap-2 rounded-md border border-white/10 bg-black/20 p-3 text-sm md:grid-cols-2">
          <div>
            <p className="text-xs text-textMuted">Было</p>
            <p className="text-textMain">{formatIsoDateTimeInOmsk(before.scheduledAt ?? null)}</p>
          </div>
          <div>
            <p className="text-xs text-textMuted">Стало</p>
            <p className="text-textMain">{formatIsoDateTimeInOmsk(after.scheduledAt ?? null)}</p>
          </div>
        </div>
      ) : null}

      {isResult ? (
        <div className="mt-3 grid gap-2 rounded-md border border-white/10 bg-black/20 p-3 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs text-textMuted">Игроки</p>
            <p className="text-textMain">{matchPlayers(snapshot)}</p>
          </div>
          <div>
            <p className="text-xs text-textMuted">{row.action === "match.result.create" ? "Счет" : "Было"}</p>
            <p className="text-textMain">{row.action === "match.result.create" ? matchScore(after) : matchScore(before)}</p>
          </div>
          <div>
            <p className="text-xs text-textMuted">{row.action === "match.result.create" ? "Победитель" : "Стало"}</p>
            <p className="text-textMain">
              {row.action === "match.result.create" ? playerName(after.winner) : matchScore(after)}
            </p>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function AdminAuditPage(): JSX.Element {
  const auditQuery = useAuditLog();

  if (auditQuery.isLoading) {
    return <p className="rounded-lg border border-white/10 bg-panel/80 p-4 text-textMuted">Загрузка аудита...</p>;
  }

  if (auditQuery.isError || !auditQuery.data) {
    return <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">Ошибка загрузки аудита</p>;
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Аудит действий" subtitle="История расписания и результатов матчей" />
      {auditQuery.data.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-panel/90 p-6 text-sm text-textMuted">
          История пока пустая. Здесь появятся назначенные матчи, сыгранные матчи и изменения результатов.
        </div>
      ) : (
        <div className="space-y-3">
          {auditQuery.data.map((row) => (
            <AuditCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
