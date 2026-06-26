import { FormEvent, useEffect, useState } from "react";
import { TournamentStatus } from "../../api/types";
import { PageTitle } from "../../components/PageTitle";
import { useAdminTournaments, useUpdateTournament } from "../../features/hooks";

const tournamentStatusLabelMap: Record<TournamentStatus, string> = {
  draft: "Подготовка",
  in_progress: "Турнир идёт",
  finished: "Завершён"
};

export function AdminSettingsPage(): JSX.Element {
  const tournamentsQuery = useAdminTournaments();
  const updateMutation = useUpdateTournament();
  const tournament = tournamentsQuery.data?.find((item) => item.isActive) ?? tournamentsQuery.data?.[0];

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [setsToWin, setSetsToWin] = useState(2);
  const [tvIntervalSec, setTvIntervalSec] = useState(10);
  const [roundsCount, setRoundsCount] = useState(5);
  const [isTelegramEnabled, setIsTelegramEnabled] = useState(false);

  useEffect(() => {
    if (!tournament) {
      return;
    }
    setTitle(tournament.title);
    setDate(tournament.date ?? "");
    setSetsToWin(tournament.setsToWin);
    setTvIntervalSec(tournament.tvIntervalSec);
    setRoundsCount(tournament.roundsCount);
    setIsTelegramEnabled(tournament.isTelegramEnabled);
  }, [tournament]);

  const onSubmit = (event: FormEvent): void => {
    event.preventDefault();
    updateMutation.mutate({
      title,
      date: date || null,
      setsToWin,
      tvIntervalSec,
      roundsCount: Math.min(10, Math.max(1, roundsCount)),
      isTelegramEnabled
    });
  };

  const finishTournament = (): void => {
    if (!tournament || tournament.status !== "in_progress") {
      return;
    }
    if (!window.confirm("Завершить турнир? После подтверждения статус будет переведен в finished.")) {
      return;
    }
    updateMutation.mutate({
      status: "finished",
      confirmStatusChange: true
    });
  };

  const rollbackToPending = (): void => {
    if (!tournament || tournament.status !== "in_progress") {
      return;
    }
    if (
      !window.confirm(
        "Вернуть турнир в подготовку? Все результаты матчей будут soft-delete (очищены), а турнир перейдет в draft."
      )
    ) {
      return;
    }
    updateMutation.mutate({
      status: "draft",
      confirmStatusChange: true,
      confirmResetResults: true
    });
  };

  if (tournamentsQuery.isLoading) {
    return <p className="rounded-lg border border-white/10 bg-panel/80 p-4 text-textMuted">Загрузка настроек...</p>;
  }

  if (tournamentsQuery.isError || !tournament) {
    return <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">Ошибка загрузки настроек</p>;
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Настройки турнира" subtitle="Конфигурация турнирного режима и TV-экрана" />
      <section className="rounded-lg border border-white/10 bg-panel/90 p-4">
        <p className="text-xs text-textMuted">Статус турнира</p>
        <p className="mt-1 text-lg font-semibold text-textMain">{tournamentStatusLabelMap[tournament.status]}</p>

        {tournament.status === "draft" ? (
          <p className="mt-2 text-sm text-textMuted">Подготовка: добавляйте участников и запускайте посев.</p>
        ) : null}

        {tournament.status === "finished" ? (
          <p className="mt-2 text-sm text-textMuted">Турнир завершён. Повторный запуск из UI недоступен.</p>
        ) : null}

        {tournament.status === "in_progress" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-300 disabled:opacity-60"
              onClick={rollbackToPending}
              disabled={updateMutation.isPending}
              type="button"
            >
              Вернуть в подготовку (soft reset результатов)
            </button>
            <button
              className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 disabled:opacity-60"
              onClick={finishTournament}
              disabled={updateMutation.isPending}
              type="button"
            >
              Завершить турнир
            </button>
          </div>
        ) : null}
      </section>

      <form className="grid gap-3 rounded-lg border border-white/10 bg-panel/90 p-4 md:grid-cols-2" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-xs text-textMuted">Название</span>
          <input
            className="mt-1 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-textMuted">Дата</span>
          <input
            className="mt-1 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-textMuted">Побед по партиям</span>
          <input
            className="mt-1 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
            type="number"
            min={1}
            value={setsToWin}
            onChange={(event) => setSetsToWin(Number(event.target.value))}
          />
        </label>
        <label className="block">
          <span className="text-xs text-textMuted">Интервал TV (сек)</span>
          <input
            className="mt-1 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
            type="number"
            min={5}
            value={tvIntervalSec}
            onChange={(event) => setTvIntervalSec(Number(event.target.value))}
          />
        </label>
        <label className="block">
          <span className="text-xs text-textMuted">Количество туров (1-10)</span>
          <input
            className="mt-1 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
            type="number"
            min={1}
            max={10}
            value={roundsCount}
            onChange={(event) => setRoundsCount(Number(event.target.value))}
            disabled={tournament.status !== "draft"}
          />
        </label>
        <label className="col-span-full inline-flex items-center gap-2 text-sm text-textMain">
          <input checked={isTelegramEnabled} onChange={(event) => setIsTelegramEnabled(event.target.checked)} type="checkbox" />
          Telegram-уведомления включены
        </label>
        <button
          className="col-span-full rounded-md border border-accent/60 bg-accent/10 px-3 py-2 text-sm text-accent disabled:opacity-60"
          disabled={updateMutation.isPending}
          type="submit"
        >
          Сохранить настройки
        </button>
      </form>
    </div>
  );
}
