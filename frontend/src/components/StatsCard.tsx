interface StatsCardProps {
  label: string;
  value: string | number;
  accent?: "mint" | "blue" | "orange";
}

const accentMap = {
  mint: "border-accent/60 text-accent",
  blue: "border-satellite/60 text-satellite",
  orange: "border-comet/60 text-comet"
};

export function StatsCard({ label, value, accent = "mint" }: StatsCardProps): JSX.Element {
  return (
    <article className={`rounded-lg border bg-panel/90 p-4 ${accentMap[accent]}`}>
      <p className="text-xs uppercase tracking-wide text-textMuted">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </article>
  );
}
