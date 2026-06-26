import { PageTitle } from "../../components/PageTitle";
import { UpcomingMatchesList } from "../../components/UpcomingMatchesList";
import { usePublicOverview, useSchedule } from "../../features/hooks";

export function SchedulePage(): JSX.Element {
  const scheduleQuery = useSchedule();
  const overviewQuery = usePublicOverview();

  if (scheduleQuery.isLoading || overviewQuery.isLoading) {
    return <p className="rounded-lg border border-white/10 bg-panel/80 p-4 text-textMuted">Загрузка расписания...</p>;
  }

  if (scheduleQuery.isError || overviewQuery.isError || !scheduleQuery.data || !overviewQuery.data) {
    return <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">Ошибка загрузки расписания</p>;
  }

  return (
    <div className="space-y-4">
      <PageTitle
        title="Расписание игр"
        subtitle=""
        rightSlot={<span className="text-sm text-textMuted">{overviewQuery.data.tournament.title}</span>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <UpcomingMatchesList title="Согласовано время" matches={scheduleQuery.data.inProgress} />
        <UpcomingMatchesList title="В ожидании согласования" matches={scheduleQuery.data.pending} />
        <UpcomingMatchesList title="Завершенные матчи" matches={scheduleQuery.data.finished} />
      </div>
    </div>
  );
}
