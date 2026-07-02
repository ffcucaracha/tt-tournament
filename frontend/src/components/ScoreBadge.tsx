import { MatchResultType } from "../api/types";

interface ScoreBadgeProps {
  scoreA: number | null;
  scoreB: number | null;
  resultType?: MatchResultType | null;
}

export function ScoreBadge({ scoreA, scoreB, resultType }: ScoreBadgeProps): JSX.Element {
  const isTechnical = resultType?.startsWith("technical_loss") ?? false;
  const value = scoreA === null || scoreB === null ? "—" : `${isTechnical ? "тех. " : ""}${scoreA}:${scoreB}`;
  return <span className="rounded-md bg-black/30 px-2 py-1 text-sm font-semibold text-textMain">{value}</span>;
}
