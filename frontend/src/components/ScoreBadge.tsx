interface ScoreBadgeProps {
  scoreA: number | null;
  scoreB: number | null;
}

export function ScoreBadge({ scoreA, scoreB }: ScoreBadgeProps): JSX.Element {
  const value = scoreA === null || scoreB === null ? "—" : `${scoreA}:${scoreB}`;
  return <span className="rounded-md bg-black/30 px-2 py-1 text-sm font-semibold text-textMain">{value}</span>;
}
