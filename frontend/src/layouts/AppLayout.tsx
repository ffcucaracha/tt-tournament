import { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen bg-[radial-gradient(1100px_700px_at_20%_-10%,rgba(104,243,191,0.18),transparent),radial-gradient(900px_700px_at_90%_10%,rgba(57,168,255,0.16),transparent),#070a0f] text-textMain">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">{children}</div>
    </div>
  );
}
