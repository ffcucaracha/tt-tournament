import { MatchStatus, TribeCode } from "../api/types";

export const tribeLabelMap: Record<TribeCode, string> = {
  comet: "Комета",
  satellite: "Спутник",
  star: "Звезда"
};

export const tribeIconMap: Record<TribeCode, string> = {
  comet: "☄️",
  satellite: "🛰️",
  star: "⭐"
};

export const tribeColorMap: Record<TribeCode, string> = {
  comet: "bg-comet/20 text-comet border-comet/60",
  satellite: "bg-satellite/20 text-satellite border-satellite/60",
  star: "bg-star/20 text-star border-star/60"
};

export const statusLabelMap: Record<MatchStatus, string> = {
  pending: "В ожидании",
  finished: "Завершён",
  bye: "BYE"
};

export const statusColorMap: Record<MatchStatus, string> = {
  pending: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  finished: "bg-sky-500/20 text-sky-200 border-sky-500/40",
  bye: "bg-indigo-500/20 text-indigo-200 border-indigo-500/40"
};
