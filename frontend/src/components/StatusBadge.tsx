import { MatchStatus } from "../api/types";
import { cn } from "../shared/cn";
import { statusColorMap, statusLabelMap } from "../shared/presentation";

interface StatusBadgeProps {
  status: MatchStatus;
}

export function StatusBadge({ status }: StatusBadgeProps): JSX.Element {
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", statusColorMap[status])}>
      {statusLabelMap[status]}
    </span>
  );
}
