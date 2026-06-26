import { BracketType, Match, Participant, Tournament, TribeCode } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { MatchView, ParticipantView } from "../types";

export type MatchWithParticipants = Prisma.MatchGetPayload<{
  include: {
    participantA: true;
    participantB: true;
  };
}>;

export function serializeTournament(row: Tournament): Record<string, unknown> {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    isActive: row.isActive,
    format: row.format,
    setsToWin: row.setsToWin,
    tvIntervalSec: row.tvIntervalSec,
    isTelegramEnabled: row.isTelegramEnabled,
    roundsCount: row.roundsCount,
    currentRound: row.currentRound,
    date: row.date ? row.date.toISOString().slice(0, 10) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    finishedAt: row.finishedAt ? row.finishedAt.toISOString() : null
  };
}

export function serializeParticipant(row: Participant): Record<string, unknown> {
  return {
    id: row.id,
    tournamentId: row.tournamentId,
    nickname: row.nickname,
    tribe: row.tribe,
    telegramContact: row.telegramContact,
    registrationOrder: row.registrationOrder,
    seedNumber: row.seedNumber,
    status: row.status,
    finalPlace: row.finalPlace,
    finalScore: row.finalScore,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function toParticipantView(participant: Participant | null): ParticipantView | null {
  if (!participant) {
    return null;
  }
  return {
    id: participant.id,
    nickname: participant.nickname,
    tribe: participant.tribe
  };
}

export function toMatchView(row: MatchWithParticipants): MatchView {
  return {
    id: row.id,
    bracketType: row.bracketType,
    roundNumber: row.roundNumber,
    matchNumber: row.matchNumber,
    participantA: toParticipantView(row.participantA),
    participantB: toParticipantView(row.participantB),
    winnerId: row.winnerId,
    scoreA: row.scoreA,
    scoreB: row.scoreB,
    status: row.status,
    scheduledAt: row.scheduledAt ? row.scheduledAt.toISOString() : null,
    scheduleSource: row.scheduleSource
  };
}

export function groupBracket(rows: MatchWithParticipants[], bracketType: BracketType): Array<{ roundNumber: number; matches: MatchView[] }> {
  const scoped = rows.filter((row) => row.bracketType === bracketType);
  const grouped = new Map<number, MatchWithParticipants[]>();
  for (const row of scoped) {
    grouped.set(row.roundNumber, [...(grouped.get(row.roundNumber) ?? []), row]);
  }
  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([roundNumber, matches]) => ({
      roundNumber,
      matches: matches.sort((a, b) => a.matchNumber - b.matchNumber).map((item) => toMatchView(item))
    }));
}

export function aggregateTribeStats(
  standings: Array<{ tribe: TribeCode; score: number; place: number }>
): Array<{
  tribe: TribeCode;
  participantsCount: number;
  totalScore: number;
  averageScore: number;
  totalRankScore: number;
  averageRankScore: number;
  bestPlace: number;
}> {
  const participantsTotal = standings.length;
  const grouped = new Map<TribeCode, { participantsCount: number; totalScore: number; totalRankScore: number; bestPlace: number }>();
  for (const row of standings) {
    const current = grouped.get(row.tribe) ?? { participantsCount: 0, totalScore: 0, totalRankScore: 0, bestPlace: 999 };
    current.participantsCount += 1;
    current.totalScore += row.score;
    current.totalRankScore += participantsTotal - row.place + 1;
    current.bestPlace = Math.min(current.bestPlace, row.place);
    grouped.set(row.tribe, current);
  }
  return [...grouped.entries()]
    .map(([tribe, value]) => ({
      tribe,
      participantsCount: value.participantsCount,
      totalScore: value.totalScore,
      averageScore: Number((value.totalScore / value.participantsCount).toFixed(2)),
      totalRankScore: value.totalRankScore,
      averageRankScore: Number((value.totalRankScore / value.participantsCount).toFixed(2)),
      bestPlace: value.bestPlace
    }))
    .sort((a, b) => b.averageRankScore - a.averageRankScore);
}

export function formatScheduleRow(match: MatchView, index: number): string {
  const playerA = match.participantA?.nickname ?? "TBD";
  const playerB = match.participantB?.nickname ?? "TBD";
  const when = match.scheduledAt
    ? new Date(match.scheduledAt).toLocaleString("ru-RU", { timeZone: "Asia/Omsk" })
    : "согласовывают время";
  return `${index + 1}. ${playerA} vs ${playerB} — ${when}`;
}

export function toMatchSnapshot(row: Match): Record<string, unknown> {
  return {
    id: row.id,
    tournamentId: row.tournamentId,
    bracketType: row.bracketType,
    roundNumber: row.roundNumber,
    matchNumber: row.matchNumber,
    winnerId: row.winnerId,
    loserId: row.loserId,
    scoreA: row.scoreA,
    scoreB: row.scoreB,
    status: row.status,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    scheduleSource: row.scheduleSource
  };
}
