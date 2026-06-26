import { useMemo, useState } from "react";
import { Participant } from "../../api/types";
import { PageTitle } from "../../components/PageTitle";
import { ParticipantBadge } from "../../components/ParticipantBadge";
import { StatsCard } from "../../components/StatsCard";
import { useParticipants, usePublicOverview } from "../../features/hooks";

type SortMode = "registration" | "seed" | "tribe";

function sortParticipants(items: Participant[], sortMode: SortMode): Participant[] {
  const copy = [...items];
  if (sortMode === "registration") {
    return copy.sort((a, b) => a.registrationOrder - b.registrationOrder);
  }
  if (sortMode === "seed") {
    return copy.sort((a, b) => {
      if (a.seedNumber === null) {
        return 1;
      }
      if (b.seedNumber === null) {
        return -1;
      }
      return a.seedNumber - b.seedNumber;
    });
  }
  return copy.sort((a, b) => a.tribe.localeCompare(b.tribe) || a.nickname.localeCompare(b.nickname));
}

export function ParticipantsPage(): JSX.Element {
  const [sortMode, setSortMode] = useState<SortMode>("seed");
  const participantsQuery = useParticipants();
  const overviewQuery = usePublicOverview();

  const participants = useMemo(
    () => sortParticipants(participantsQuery.data ?? [], sortMode),
    [participantsQuery.data, sortMode]
  );

  if (participantsQuery.isLoading || overviewQuery.isLoading) {
    return <p className="rounded-lg border border-white/10 bg-panel/80 p-4 text-textMuted">Загрузка участников...</p>;
  }

  if (participantsQuery.isError || overviewQuery.isError || !overviewQuery.data) {
    return <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">Ошибка загрузки данных</p>;
  }

  return (
    <div className="space-y-4">
      <PageTitle
        title="Участники"
        rightSlot={<span className="text-sm text-textMuted">{overviewQuery?.data?.tournament.title}</span>}
        subtitle={overviewQuery.data.participantsCount > 0 ? `Всего: ${overviewQuery.data.participantsCount}` : undefined}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <StatsCard label="Участников" value={overviewQuery.data.participantsCount} />
        <StatsCard label="Согласовано матчей" value={overviewQuery.data.inProgressCount} accent="blue" />
        <StatsCard label="В ожидании" value={overviewQuery.data.pendingCount} accent="orange" />
        <StatsCard label="Завершено матчей" value={overviewQuery.data.finishedCount} />
      </div>

      <section className="rounded-lg border border-white/10 bg-panel/90 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {[
            { key: "registration", label: "По регистрации" },
            { key: "seed", label: "По посеву" },
            { key: "tribe", label: "По трайбу" }
          ].map((item) => (
            <button
              key={item.key}
              className={`rounded-md border px-3 py-1.5 text-xs ${
                sortMode === item.key
                  ? "border-accent/60 bg-accent/15 text-accent"
                  : "border-white/20 bg-black/15 text-textMuted"
              }`}
              onClick={() => setSortMode(item.key as SortMode)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        {participants.length === 0 ? (
          <p className="text-sm text-textMuted">Участники пока не загружены</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-1 lg:grid-cols-1">
            {participants.map((participant) => (
              <ParticipantBadge key={participant.id} participant={participant} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
