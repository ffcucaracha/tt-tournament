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
      <details className="rounded-md border border-white/10 bg-panel/90 px-4 py-3 text-sm text-textMuted">
        <summary className="cursor-pointer select-none text-textMain">Как считается место</summary>
        <div className="mt-2 space-y-1 text-xs leading-5">
          <p>1. Больше очков: победа и bye дают 1 очко, поражение даёт 0.</p>
          <p>2. При равных очках выше игрок с большим Buchholz.</p>
          <p>3. При равном Buchholz выше игрок с большим числом побед.</p>
          <p>4. Если всё равно равенство, применяется техническая сортировка.</p>
          <p>Баллы — отдельный зачёт для рейтинга трайбов: чем выше место, тем больше баллов.</p>
        </div>
      </details>
      <RankingTable standings={resultsQuery.data.standings} tribeStats={resultsQuery.data.tribeStats} />
    </div>
  );
}
