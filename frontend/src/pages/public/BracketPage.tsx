import { useEffect, useMemo, useState } from "react";
import { PageTitle } from "../../components/PageTitle";
import { useBracket, usePublicOverview } from "../../features/hooks";
import { MatchCard } from "../../components/MatchCard";

export function BracketPage(): JSX.Element {
  const bracketQuery = useBracket();
  const overviewQuery = usePublicOverview();
  const [selectedRound, setSelectedRound] = useState<number | "all">("all");

  const rounds = bracketQuery.data?.rounds ?? [];
  const tournament = overviewQuery.data?.tournament;
  const currentRoundNumber = tournament?.currentRound ?? 0;
  const currentRound = rounds.find((round) => round.roundNumber === currentRoundNumber);
  const roundCompletedWaiting = tournament
    ? tournament.status === "in_progress" &&
    currentRoundNumber > 0 &&
    currentRoundNumber < tournament.roundsCount &&
    currentRound?.status === "finished"
    : false;

  useEffect(() => {
    if (currentRoundNumber > 0) {
      setSelectedRound(currentRoundNumber);
    }
  }, [currentRoundNumber]);

  const visibleMatches = useMemo(() => {
    return selectedRound === "all"
      ? rounds.map((round) => round.matches)
      : rounds.filter((round) => round.roundNumber === selectedRound).map((round) => round.matches);
  }, [rounds, selectedRound]);

  if (bracketQuery.isLoading) {
    return <p className="rounded-lg border border-white/10 bg-panel/80 p-4 text-textMuted">Загрузка туров...</p>;
  }

  if (bracketQuery.isError || !bracketQuery.data) {
    return <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">Ошибка загрузки туров</p>;
  }

  return (
    <div className="space-y-4">
      <PageTitle
        title="Туры"
        subtitle={tournament ? `Раунд ${tournament.currentRound} из ${tournament.roundsCount}` : "Swiss system"}
        rightSlot={<span className="text-sm text-textMuted">{tournament?.title}</span>}
      />
      {roundCompletedWaiting ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Тур завершен, ожидание следующего тура
        </p>
      ) : null}
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          className={`rounded-md border px-3 py-1.5 text-sm ${selectedRound === "all" ? "border-accent/70 bg-accent/20 text-accent" : "border-white/20 bg-black/20 text-textMain"}`}
          onClick={() => setSelectedRound("all")}
          type="button"
        >
          Все туры
        </button>
        {rounds.map((round) => (
          <button
            key={round.roundNumber}
            className={`rounded-md border px-3 py-1.5 text-sm ${selectedRound === round.roundNumber ? "border-accent/70 bg-accent/20 text-accent" : "border-white/20 bg-black/20 text-textMain"}`}
            onClick={() => setSelectedRound(round.roundNumber)}
            type="button"
          >
            Тур {round.roundNumber}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        <section className="rounded-lg border border-white/10 bg-panel/90 p-4">
          <div className="text-sm grid grid-cols-3 gap-2">
            {visibleMatches.flat().map((m) => <MatchCard key={m.id} match={m} compact />)}
          </div>
        </section>
      </div>
    </div>
  );
}
