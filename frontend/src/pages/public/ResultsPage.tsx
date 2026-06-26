import { PageTitle } from "../../components/PageTitle";
import { RankingTable } from "../../components/RankingTable";
import { usePublicOverview, useResults } from "../../features/hooks";

export function ResultsPage(): JSX.Element {
  const resultsQuery = useResults();
  const overviewQuery = usePublicOverview();

  if (resultsQuery.isLoading) {
    return <p className="rounded-lg border border-white/10 bg-panel/80 p-4 text-textMuted">Загрузка итогов...</p>;
  }

  if (resultsQuery.isError || !resultsQuery.data) {
    return <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">Ошибка загрузки итогов</p>;
  }

  return (
    <div className="space-y-4">
      <PageTitle
        title="Итоги турнира"
        subtitle={
          resultsQuery.data.completed
            ? "Турнир завершён"
            : "Промежуточные итоги. Финальные места появятся после завершения турнира."
        }
        rightSlot={<span className="text-sm text-textMuted">{overviewQuery?.data?.tournament.title}</span>}
      />
      <RankingTable standings={resultsQuery.data.standings} tribeStats={resultsQuery.data.tribeStats} />
    </div>
  );
}
