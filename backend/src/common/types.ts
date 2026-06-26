export type TournamentStatus = "draft" | "in_progress" | "finished";

export type TribeCode = "comet" | "satellite" | "star";

export type ParticipantStatus =
  | "registered"
  | "seeded"
  | "active"
  | "eliminated"
  | "finished";

export type MatchStatus =
  | "pending"
  | "finished"
  | "bye";

export type BracketType = "swiss";

export type ScheduleSource = "manual" | "auto";

export type AuditAction =
  | "tournament.seed"
  | "tournament.reseed"
  | "match.result.create"
  | "match.result.update"
  | "match.result.reset"
  | "match.schedule.manual"
  | "match.schedule.auto";

export interface Tournament {
  id: string;
  title: string;
  description: string;
  status: TournamentStatus;
  isActive: boolean;
  format: "swiss";
  setsToWin: number;
  tvIntervalSec: number;
  isTelegramEnabled: boolean;
  roundsCount: number;
  currentRound: number;
  date: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface Participant {
  id: string;
  tournamentId: string;
  nickname: string;
  tribe: TribeCode;
  telegramContact: string | null;
  registrationOrder: number;
  seedNumber: number | null;
  status: ParticipantStatus;
  finalPlace: number | null;
  finalScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  bracketType: BracketType;
  roundNumber: number;
  matchNumber: number;
  participantAId: string | null;
  participantBId: string | null;
  winnerId: string | null;
  loserId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  status: MatchStatus;
  scheduledAt: string | null;
  scheduleSource: ScheduleSource | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditRecord {
  id: string;
  tournamentId: string;
  adminId: string | null;
  action: AuditAction;
  entityType: "tournament" | "match" | "participant";
  entityId: string | null;
  beforeJson: Record<string, unknown> | null;
  afterJson: Record<string, unknown> | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
}

export interface ParticipantView {
  id: string;
  nickname: string;
  tribe: TribeCode;
}

export interface MatchView {
  id: string;
  bracketType: BracketType;
  roundNumber: number;
  matchNumber: number;
  participantA: ParticipantView | null;
  participantB: ParticipantView | null;
  winnerId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  status: MatchStatus;
  scheduledAt: string | null;
  scheduleSource: ScheduleSource | null;
}
