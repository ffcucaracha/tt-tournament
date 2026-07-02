import { FormEvent, useEffect, useMemo, useState } from "react";
import { MatchResultType, MatchView } from "../../api/types";
import { MatchCard } from "../../components/MatchCard";
import { PageTitle } from "../../components/PageTitle";
import {
  useAdminMatches,
  useGenerateNextRound,
  usePublicOverview,
  useBracket,
  useScheduleMatch,
  useScheduleMatchAuto,
  useSetMatchResult
} from "../../features/hooks";
import DatetimeForm from "../../components/match/DatetimeForm";
import { isoToOmskDateTimeLocalValue, omskDateTimeLocalValueToIso } from "../../shared/datetime";

export function AdminMatchesPage(): JSX.Element {
  const matchesQuery = useAdminMatches();
  const overviewQuery = usePublicOverview();
  const bracketQuery = useBracket();
  const scheduleMutation = useScheduleMatch();
  const setResultMutation = useSetMatchResult();
  const nextRoundMutation = useGenerateNextRound();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [scheduledAtLocal, setScheduledAtLocal] = useState<string>("");
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [resultType, setResultType] = useState<MatchResultType>("played");
  const [resultError, setResultError] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | "all">("all");
  const matches = matchesQuery.data ?? [];

  const roundOptions = useMemo(() => {
    const rounds = [...new Set(matches.map((match) => match.roundNumber))].sort((a, b) => a - b);
    return rounds;
  }, [matches]);

  const visibleMatches = useMemo(() => {
    const filtered = selectedRound === "all"
      ? matches
      : matches.filter((match) => match.roundNumber === selectedRound);

    const rank = (match: MatchView): number => {
      if (match.status === "pending" && !match.scheduledAt) return 0;
      if (match.status === "pending" && match.scheduledAt) return 1;
      return 2;
    };

    return [...filtered].sort((a, b) => {
      const groupDiff = rank(a) - rank(b);
      if (groupDiff !== 0) return groupDiff;
      if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
      return a.matchNumber - b.matchNumber;
    });
  }, [matches, selectedRound]);

  const selectedMatch = useMemo(
    () => visibleMatches.find((item) => item.id === selectedMatchId) ?? null,
    [visibleMatches, selectedMatchId]
  );

  useEffect(() => {
    if (!selectedMatchId) return;
    if (visibleMatches.some((match) => match.id === selectedMatchId)) return;
    setSelectedMatchId(null);
  }, [selectedMatchId, visibleMatches]);

  const onSubmitSchedule = (event: FormEvent): void => {
    event.preventDefault();
    if (!selectedMatch || !scheduledAtLocal) {
      return;
    }
    const scheduledAtIso = omskDateTimeLocalValueToIso(scheduledAtLocal);
    if (!scheduledAtIso) {
      return;
    }
    scheduleMutation.mutate({
      matchId: selectedMatch.id,
      scheduledAt: scheduledAtIso
    });
  };

  const onSubmitResult = (event: FormEvent): void => {
    event.preventDefault();
    setResultError(null);
    if (!selectedMatch) {
      return;
    }
    if (resultType !== "played") {
      saveTechnicalResult(resultType);
      return;
    }
    if (!selectedMatch.scheduledAt) {
      return;
    }
    if (!selectedMatch.participantA || !selectedMatch.participantB) {
      setResultError("Нельзя сохранить результат: у матча не определены оба участника.");
      return;
    }
    const normalizedScoreA = Math.max(0, scoreA);
    const normalizedScoreB = Math.max(0, scoreB);
    if (normalizedScoreA === normalizedScoreB) {
      setResultError("Счет не может быть равным. Укажите результат, по которому определяется победитель.");
      return;
    }
    if (
      selectedMatch.status === "finished" &&
      !window.confirm("Матч уже завершен. Подтвердите редактирование результата.")
    ) {
      return;
    }
    const winnerId = normalizedScoreA > normalizedScoreB ? selectedMatch.participantA.id : selectedMatch.participantB.id;
    setResultMutation.mutate({
      matchId: selectedMatch.id,
      resultType: "played",
      winnerId,
      scoreA: normalizedScoreA,
      scoreB: normalizedScoreB
    });
  };

  const saveTechnicalResult = (selectedResultType: MatchResultType): void => {
    setResultError(null);
    if (!selectedMatch || selectedResultType === "played") {
      return;
    }
    if (!selectedMatch.participantA || !selectedMatch.participantB) {
      setResultError("Нельзя сохранить результат: у матча не определены оба участника.");
      return;
    }
    if (
      selectedMatch.status === "finished" &&
      !window.confirm("Матч уже завершен. Подтвердите редактирование результата.")
    ) {
      return;
    }
    const winnerId =
      selectedResultType === "technical_loss_a"
        ? selectedMatch.participantB.id
        : selectedResultType === "technical_loss_b"
          ? selectedMatch.participantA.id
          : null;

    setResultMutation.mutate({
      matchId: selectedMatch.id,
      resultType: selectedResultType,
      winnerId,
      scoreA: 0,
      scoreB: 0
    });
  };

  if (matchesQuery.isLoading) {
    return <p className="rounded-lg border border-white/10 bg-panel/80 p-4 text-textMuted">Загрузка матчей...</p>;
  }

  if (matchesQuery.isError || !matchesQuery.data) {
    return <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">Ошибка загрузки матчей</p>;
  }

  const tournament = overviewQuery.data?.tournament;
  const currentRoundNumber = tournament?.currentRound ?? 0;
  const currentRound = bracketQuery.data?.rounds.find((round) => round.roundNumber === currentRoundNumber);
  const canGenerateNextRound =
    tournament?.status === "in_progress" &&
    currentRound?.status === "finished" &&
    currentRoundNumber < (tournament?.roundsCount ?? 0);

  return (
    <div className="space-y-4">
      <PageTitle title="Админка матчей" subtitle="Расписание, ввод результата" />
      {canGenerateNextRound ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="text-sm text-amber-200">
            Текущий тур завершен. Предстоит генерация следующего тура.
          </p>
          <button
            className="mt-2 rounded-md border border-accent/60 bg-accent/10 px-3 py-2 text-sm text-accent disabled:opacity-60"
            disabled={nextRoundMutation.isPending}
            onClick={() => nextRoundMutation.mutate()}
            type="button"
          >
            Сгенерировать следующий тур
          </button>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-white/10 bg-panel/90 p-4 lg:col-span-2">
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              className={`rounded-md border px-3 py-1.5 text-sm ${selectedRound === "all" ? "border-accent/70 bg-accent/20 text-accent" : "border-white/20 bg-black/20 text-textMain"}`}
              onClick={() => setSelectedRound("all")}
              type="button"
            >
              Все туры
            </button>
            {roundOptions.map((roundNumber) => (
              <button
                key={roundNumber}
                className={`rounded-md border px-3 py-1.5 text-sm ${selectedRound === roundNumber ? "border-accent/70 bg-accent/20 text-accent" : "border-white/20 bg-black/20 text-textMain"}`}
                onClick={() => setSelectedRound(roundNumber)}
                type="button"
              >
                Тур {roundNumber}
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            {visibleMatches.map((match) => (
              <button
                key={match.id}
                className={`text-left ${selectedMatchId === match.id ? "ring-2 ring-accent/50" : ""}`}
                onClick={() => {
                  setSelectedMatchId(match.id);
                  setScheduledAtLocal(isoToOmskDateTimeLocalValue(match.scheduledAt));
                  setScoreA(match.scoreA ?? 0);
                  setScoreB(match.scoreB ?? 0);
                  setResultType(match.resultType ?? "played");
                  setResultError(null);
                }}
                type="button"
              >
                <MatchCard match={match} participantLinks={false} />
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-panel/90 p-4">
          <h3 className="mb-3 text-lg font-semibold text-textMain">Операции</h3>
          {!selectedMatch ? (
            <p className="text-sm text-textMuted">Выберите матч в списке</p>
          ) : (
            <div className="space-y-3">
              {selectedMatch.status === "pending" ? (
                <DatetimeForm
                  scheduledAtLocal={scheduledAtLocal}
                  setScheduledAtLocal={setScheduledAtLocal}
                  onSubmitSchedule={onSubmitSchedule}
                  scheduleMutation={scheduleMutation}
                  selectedMatch={selectedMatch}
                />
              ) : null}

              {selectedMatch.status === "finished" || selectedMatch.status === "pending" ? (
                <form className="space-y-2" onSubmit={onSubmitResult}>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "played", label: "Обычный счет" },
                      { value: "technical_loss_a", label: `Тех. ${selectedMatch.participantA?.nickname ?? "A"}` },
                      { value: "technical_loss_b", label: `Тех. ${selectedMatch.participantB?.nickname ?? "B"}` },
                      { value: "technical_loss_both", label: "Тех. обоим" }
                    ].map((item) => (
                      <button
                        key={item.value}
                        className={`rounded-md border px-3 py-2 text-xs ${
                          resultType === item.value
                            ? "border-accent/70 bg-accent/15 text-accent"
                            : "border-white/20 bg-black/20 text-textMuted"
                        }`}
                        onClick={() => setResultType(item.value as MatchResultType)}
                        type="button"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {!selectedMatch.scheduledAt && resultType === "played" ? (
                    <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                      Сначала назначьте дату и время матча, затем можно сохранить результат.
                    </p>
                  ) : null}
                  {selectedMatch.status === "finished" ? (
                    <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                      Матч уже завершен. Изменение результата требует подтверждения.
                    </p>
                  ) : null}
                  <div className={`grid grid-cols-2 gap-2 ${resultType === "played" ? "" : "opacity-50"}`}>
                    <label className="block">
                      <span className="text-xs text-textMuted">{selectedMatch.participantA?.nickname ?? "Участник A"}</span>
                      <input
                        className="mt-1 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
                        disabled={resultType !== "played"}
                        type="number"
                        min={0}
                        value={scoreA}
                        onChange={(event) => setScoreA(Math.max(0, Number(event.target.value)))}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-textMuted">{selectedMatch.participantB?.nickname ?? "Участник B"}</span>
                      <input
                        className="mt-1 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
                        disabled={resultType !== "played"}
                        type="number"
                        min={0}
                        value={scoreB}
                        onChange={(event) => setScoreB(Math.max(0, Number(event.target.value)))}
                      />
                    </label>
                  </div>
                  {resultError ? (
                    <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                      {resultError}
                    </p>
                  ) : null}
                  <button
                    className="w-full rounded-md border border-satellite/60 bg-satellite/10 px-3 py-2 text-sm text-satellite disabled:opacity-60"
                    disabled={
                      setResultMutation.isPending ||
                      (resultType === "played" && !selectedMatch.scheduledAt) ||
                      !selectedMatch.participantA ||
                      !selectedMatch.participantB
                    }
                    type="submit"
                  >
                    {resultType === "played"
                      ? selectedMatch.status === "finished" ? "Сохранить изменения" : "Сохранить результат"
                      : "Сохранить технический результат"}
                  </button>
                </form>
              ) : null}

              {/* {selectedMatch.status !== "pending" &&
              selectedMatch.status !== "in_progress" &&
              selectedMatch.status !== "finished" ? (
                <p className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-textMuted">
                  Для статуса «{statusLabelMap[selectedMatch.status]}» операции в этой форме не требуются.
                </p>
              ) : null} */}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
