import { MatchView } from "../api/types";
import { formatIsoDateTimeInOmsk } from "../shared/datetime";
import { tribeIconMap } from "../shared/presentation";
import { ScoreBadge } from "./ScoreBadge";
import { StatusBadge } from "./StatusBadge";

interface MatchCardProps {
  match: MatchView;
  compact?: boolean;
}

export function MatchCard({ match, compact = false }: MatchCardProps): JSX.Element {
  const playerA = match.participantA?.nickname ?? "TBD";
  const playerB = match.participantB?.nickname ?? "TBD";
  const iconA = match.participantA ? tribeIconMap[match.participantA.tribe] : "•";
  const iconB = match.participantB ? tribeIconMap[match.participantB.tribe] : "•";
  return (
    <article className="rounded-lg border border-white/10 bg-panelSoft/90 p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-xs text-textMuted">
          M{match.matchNumber} • {match.bracketType} • R{match.roundNumber}
        </p>
        <StatusBadge status={match.status} />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-textMain">
            {iconA} {playerA}
          </p>
          <p className="text-sm text-textMain">
            {iconB} {playerB}
          </p>
        </div>
        <ScoreBadge scoreA={match.scoreA} scoreB={match.scoreB} />
      </div>
      {!compact ? (
        <p className="mt-2 text-xs text-textMuted">
          {formatIsoDateTimeInOmsk(match.scheduledAt)}
        </p>
      ) : null}
    </article>
  );
}
