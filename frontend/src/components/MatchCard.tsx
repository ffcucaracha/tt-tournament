import { Link } from "react-router-dom";
import { MatchView } from "../api/types";
import { formatIsoDateTimeInOmsk } from "../shared/datetime";
import { tribeIconMap } from "../shared/presentation";
import { ScoreBadge } from "./ScoreBadge";
import { StatusBadge } from "./StatusBadge";

interface MatchCardProps {
  match: MatchView;
  compact?: boolean;
  participantLinks?: boolean;
}

function PlayerName({
  participant,
  fallback,
  participantLinks
}: {
  participant: MatchView["participantA"];
  fallback: string;
  participantLinks: boolean;
}): JSX.Element {
  if (!participant) {
    return <span>{fallback}</span>;
  }

  if (!participantLinks) {
    return <span>{participant.nickname}</span>;
  }

  return (
    <Link className="text-accent hover:text-accent/80" to={`/participants/${participant.id}`}>
      {participant.nickname}
    </Link>
  );
}

export function MatchCard({ match, compact = false, participantLinks = true }: MatchCardProps): JSX.Element {
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
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-textMain">
            {iconA} <PlayerName fallback={playerA} participant={match.participantA} participantLinks={participantLinks} />
          </p>
          <p className="text-sm text-textMain">
            {iconB} <PlayerName fallback={playerB} participant={match.participantB} participantLinks={participantLinks} />
          </p>
        </div>
        <ScoreBadge scoreA={match.scoreA} scoreB={match.scoreB} resultType={match.resultType} />
      </div>
      {!compact ? (
        <p className="mt-2 text-xs text-textMuted">
          {formatIsoDateTimeInOmsk(match.scheduledAt)}
        </p>
      ) : null}
    </article>
  );
}
