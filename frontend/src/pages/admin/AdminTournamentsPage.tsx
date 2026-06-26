import { FormEvent, useState } from "react";
import { Tournament, TournamentStatus } from "../../api/types";
import { PageTitle } from "../../components/PageTitle";
import {
  useActivateTournament,
  useAdminTournaments,
  useCreateTournament,
  useUpdateTournamentStatus
} from "../../features/hooks";

const statusLabelMap: Record<TournamentStatus, string> = {
  draft: "Подготовка",
  in_progress: "Турнир идет",
  finished: "Завершен"
};

export function AdminTournamentsPage(): JSX.Element {
  const tournamentsQuery = useAdminTournaments();
  const createMutation = useCreateTournament();
  const activateMutation = useActivateTournament();
  const statusMutation = useUpdateTournamentStatus();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [setsToWin, setSetsToWin] = useState(2);
  const [tvIntervalSec, setTvIntervalSec] = useState(10);
  const [roundsCount, setRoundsCount] = useState(5);
  const [makeActiveOnCreate, setMakeActiveOnCreate] = useState(true);

  const activeTournament = tournamentsQuery.data?.find((item) => item.isActive) ?? null;

  const onSubmitCreate = (event: FormEvent): void => {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }
    createMutation.mutate(
      {
        title: title.trim(),
        date: date || null,
        setsToWin: Math.max(1, setsToWin),
        tvIntervalSec: Math.max(5, tvIntervalSec),
        roundsCount: Math.min(10, Math.max(1, roundsCount)),
        isActive: makeActiveOnCreate
      },
      {
        onSuccess: () => {
          setTitle("");
          setDate("");
          setSetsToWin(2);
          setTvIntervalSec(10);
          setRoundsCount(5);
          setMakeActiveOnCreate(true);
        }
      }
    );
  };

  const activateTournament = (tournament: Tournament): void => {
    if (tournament.isActive) {
      return;
    }
    if (!window.confirm(`Сделать турнир "${tournament.title}" активным?`)) {
      return;
    }
    activateMutation.mutate(tournament.id);
  };

  const finishTournament = (tournament: Tournament): void => {
    if (tournament.status !== "in_progress") {
      return;
    }
    if (!window.confirm(`Завершить турнир "${tournament.title}"?`)) {
      return;
    }
    statusMutation.mutate({
      tournamentId: tournament.id,
      data: {
        status: "finished",
        confirmStatusChange: true
      }
    });
  };

  const rollbackToPending = (tournament: Tournament): void => {
    if (tournament.status !== "in_progress") {
      return;
    }
    if (!window.confirm(`Вернуть турнир "${tournament.title}" в подготовку и очистить результаты матчей?`)) {
      return;
    }
    statusMutation.mutate({
      tournamentId: tournament.id,
      data: {
        status: "draft",
        confirmStatusChange: true,
        confirmResetResults: true
      }
    });
  };

  if (tournamentsQuery.isLoading) {
    return <p className="rounded-lg border border-white/10 bg-panel/80 p-4 text-textMuted">Загрузка турниров...</p>;
  }

  if (tournamentsQuery.isError || !tournamentsQuery.data) {
    return <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">Ошибка загрузки турниров</p>;
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Турниры" subtitle="Управление списком турниров и активным турниром" />

      <section className="rounded-lg border border-white/10 bg-panel/90 p-4">
        <p className="text-xs text-textMuted">Активный турнир</p>
        <p className="mt-1 text-lg font-semibold text-textMain">{activeTournament?.title ?? "Не выбран"}</p>
      </section>

      <section className="rounded-lg border border-white/10 bg-panel/90 p-4">
        <p className="mb-3 text-sm font-medium text-textMain">Создать турнир</p>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmitCreate}>
          <label className="block">
            <span className="text-xs text-textMuted">Название</span>
            <input
              className="mt-1 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={createMutation.isPending}
            />
          </label>
          <label className="block">
            <span className="text-xs text-textMuted">Дата</span>
            <input
              className="mt-1 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={createMutation.isPending}
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
              disabled={createMutation.isPending}
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
              disabled={createMutation.isPending}
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
              disabled={createMutation.isPending}
            />
          </label>
          <label className="col-span-full inline-flex items-center gap-2 text-sm text-textMain">
            <input
              checked={makeActiveOnCreate}
              onChange={(event) => setMakeActiveOnCreate(event.target.checked)}
              disabled={createMutation.isPending}
              type="checkbox"
            />
            Сделать активным сразу после создания
          </label>
          <button
            className="col-span-full rounded-md border border-accent/60 bg-accent/10 px-3 py-2 text-sm text-accent disabled:opacity-60"
            type="submit"
            disabled={createMutation.isPending || !title.trim()}
          >
            Создать турнир
          </button>
        </form>
      </section>

      {createMutation.isError ? (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {createMutation.error instanceof Error ? createMutation.error.message : "Ошибка создания турнира"}
        </p>
      ) : null}

      {activateMutation.isError ? (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {activateMutation.error instanceof Error ? activateMutation.error.message : "Ошибка активации турнира"}
        </p>
      ) : null}

      {statusMutation.isError ? (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {statusMutation.error instanceof Error ? statusMutation.error.message : "Ошибка изменения статуса турнира"}
        </p>
      ) : null}

      <section className="overflow-auto rounded-lg border border-white/10 bg-panel/90 p-4">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="text-textMuted">
              <th className="pb-2">Название</th>
              <th className="pb-2">Статус</th>
              <th className="pb-2">Активный</th>
              <th className="pb-2">Побед по партиям</th>
              <th className="pb-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {tournamentsQuery.data.map((tournament) => (
              <tr className="border-t border-white/5" key={tournament.id}>
                <td className="py-2 text-textMain">{tournament.title}</td>
                <td className="py-2 text-textMuted">{statusLabelMap[tournament.status]}</td>
                <td className="py-2">
                  {tournament.isActive ? (
                    <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                      Да
                    </span>
                  ) : (
                    <span className="rounded border border-white/20 px-2 py-0.5 text-xs text-textMuted">Нет</span>
                  )}
                </td>
                <td className="py-2 text-textMuted">{tournament.setsToWin}</td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-md border border-satellite/60 bg-satellite/10 px-2.5 py-1 text-xs text-satellite disabled:opacity-60"
                      type="button"
                      onClick={() => activateTournament(tournament)}
                      disabled={tournament.isActive || activateMutation.isPending || statusMutation.isPending}
                    >
                      Сделать активным
                    </button>
                    {tournament.status === "in_progress" ? (
                      <>
                        <button
                          className="rounded-md border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300 disabled:opacity-60"
                          type="button"
                          onClick={() => rollbackToPending(tournament)}
                          disabled={activateMutation.isPending || statusMutation.isPending}
                        >
                          В подготовку
                        </button>
                        <button
                          className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 disabled:opacity-60"
                          type="button"
                          onClick={() => finishTournament(tournament)}
                          disabled={activateMutation.isPending || statusMutation.isPending}
                        >
                          Завершить
                        </button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
