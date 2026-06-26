declare module "@g-loot/react-tournament-brackets" {
  import { ComponentType, ReactNode } from "react";

  export const MATCH_STATES: {
    PLAYED: "PLAYED";
    NO_SHOW: "NO_SHOW";
    WALK_OVER: "WALK_OVER";
    NO_PARTY: "NO_PARTY";
    DONE: "DONE";
    SCORE_DONE: "SCORE_DONE";
  };

  export const Match: ComponentType<any>;
  export const SVGViewer: ComponentType<any>;
  export const DoubleEliminationBracket: ComponentType<any>;
  export const SingleEliminationBracket: ComponentType<any>;
  export const createTheme: (theme: Record<string, unknown>) => Record<string, unknown>;

  export type SvgWrapperProps = {
    children: ReactNode;
    [key: string]: unknown;
  };
}
