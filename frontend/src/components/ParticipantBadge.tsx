import { Participant } from "../api/types";
import { TribeBadge } from "./TribeBadge";

interface ParticipantBadgeProps {
  participant: Participant;
}

export function ParticipantBadge({ participant }: ParticipantBadgeProps): JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-panelSoft/80 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="w-7 rounded bg-black/30 px-2 py-0.5 text-center text-xs text-textMuted">
          {participant.seedNumber ?? "—"}
        </span>
        <span className="text-sm text-textMain">{participant.nickname}</span>
      </div>
      <TribeBadge tribe={participant.tribe} compact />
    </div>
  );
}
