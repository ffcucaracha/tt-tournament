import { ReactNode } from "react";

interface PageTitleProps {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
}

export function PageTitle({ title, subtitle, rightSlot }: PageTitleProps): JSX.Element {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-panel/85 p-5 shadow-glow md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-textMain md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-textMuted md:text-base">{subtitle}</p> : null}
      </div>
      {rightSlot ? <div>{rightSlot}</div> : null}
    </div>
  );
}
