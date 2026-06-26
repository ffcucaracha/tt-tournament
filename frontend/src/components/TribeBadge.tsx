import { TribeCode } from "../api/types";
import { tribeColorMap, tribeIconMap, tribeLabelMap } from "../shared/presentation";
import { cn } from "../shared/cn";

interface TribeBadgeProps {
  tribe: TribeCode;
  compact?: boolean;
}

export function TribeBadge({ tribe, compact = false }: TribeBadgeProps): JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        tribeColorMap[tribe]
      )}
    >
      <span>{tribeIconMap[tribe]}</span>
      {!compact ? <span>{tribeLabelMap[tribe]}</span> : null}
    </span>
  );
}
