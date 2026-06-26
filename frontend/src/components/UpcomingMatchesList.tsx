import { MatchView } from "../api/types";
import { MatchCard } from "./MatchCard";

interface UpcomingMatchesListProps {
  title: string;
  matches: MatchView[];
}

export function UpcomingMatchesList({ title, matches }: UpcomingMatchesListProps): JSX.Element {
  return (
    <section className="rounded-lg border border-white/10 bg-panel/90 p-4">
      <h3 className="mb-3 text-lg font-semibold text-textMain">{title}</h3>
      {matches.length === 0 ? (
        <p className="text-sm text-textMuted">Нет матчей в этом блоке</p>
      ) : (
        <div className="space-y-2">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </section>
  );
}
