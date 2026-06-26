import { AutoRotator } from "../../components/AutoRotator";
import { MatchCard } from "../../components/MatchCard";
import { ParticipantBadge } from "../../components/ParticipantBadge";
import { RankingTable } from "../../components/RankingTable";
import { useBracket, useParticipants, usePublicOverview, useResults, useSchedule } from "../../features/hooks";

export function TvPage(): JSX.Element {
  const overview = usePublicOverview();
  const participants = useParticipants();
  const schedule = useSchedule();
  const bracket = useBracket();
  const results = useResults();

  if (overview.isLoading || participants.isLoading || schedule.isLoading || bracket.isLoading || results.isLoading) {
    return <p className="rounded-lg border border-white/10 bg-panel/80 p-4 text-textMuted">Загрузка TV-режима...</p>;
  }

  if (
    overview.isError ||
    participants.isError ||
    schedule.isError ||
    bracket.isError ||
    results.isError ||
    !overview.data ||
    !participants.data ||
    !schedule.data ||
    !bracket.data ||
    !results.data
  ) {
    return <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">Ошибка TV-режима</p>;
  }

  const slides = [
    {
      key: "participants",
      title: "Участники",
      content: (
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {participants.data.slice(0, 12).map((participant) => (
            <ParticipantBadge key={participant.id} participant={participant} />
          ))}
        </div>
      )
    },
    {
      key: "schedule",
      title: "Расписание",
      content: (
        <div className="grid gap-3 lg:grid-cols-2">
          {[...schedule.data.inProgress, ...schedule.data.pending]
            .slice(0, 6)
            .map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
        </div>
      )
    },
    {
      key: "bracket",
      title: "Туры",
      content: (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {bracket.data.rounds
            .flatMap((round) => round.matches)
            .slice(0, 6)
            .map((match) => (
              <MatchCard key={match.id} match={match} compact />
            ))}
        </div>
      )
    },
    {
      key: "results",
      title: "Итоги",
      content: <RankingTable standings={results.data.standings} tribeStats={results.data.tribeStats} />
    }
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-panel/90 p-4">
        <h1 className="text-2xl font-semibold">{overview.data.tournament.title}</h1>
      </div>
      <AutoRotator slides={slides} intervalSec={overview.data.tournament.tvIntervalSec ?? 10} />
    </div>
  );
}
