export type TribeCode = "comet" | "satellite" | "star";

export type TournamentStatus = "draft" | "in_progress" | "finished";

export type ParticipantStatus =
  | "registered"
  | "seeded"
  | "active"
  | "eliminated"
  | "finished";

export type MatchStatus = "pending" | "finished" | "bye";

export type MatchResultType = "played" | "technical_loss_a" | "technical_loss_b" | "technical_loss_both";

export type BracketType = "swiss";

export interface Tournament {
  id: string;
  title: string;
  description: string;
  status: TournamentStatus;
  isActive: boolean;
  format: string;
  setsToWin: number;
  tvIntervalSec: number;
  isTelegramEnabled: boolean;
  roundsCount: number;
  currentRound: number;
  date: string | null;
  createdAt: string;
  updatedAt?: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface Participant {
  id: string;
  tournamentId: string;
  nickname: string;
  fullName: string | null;
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
  resultType: MatchResultType | null;
  scheduledAt: string | null;
  scheduleSource: "manual" | "auto" | null;
}

export interface ScheduleResponse {
  finished: MatchView[];
  inProgress: MatchView[];
  pending: MatchView[];
}

export interface BracketRound {
  roundNumber: number;
  status?: "pending" | "in_progress" | "finished";
  startedAt?: string | null;
  completedAt?: string | null;
  scheduledAt?: string | null;
  matches: MatchView[];
}

export interface BracketResponse {
  rounds: BracketRound[];
}

export interface StandingRow {
  participantId: string;
  nickname: string;
  tribe: TribeCode;
  place: number;
  wins: number;
  losses: number;
  score: number;
  games?: number;
  bye?: number;
  buchholz?: number;
  sortReason?: string;
}

export interface TribeStatsRow {
  tribe: TribeCode;
  participantsCount: number;
  totalScore: number;
  averageScore: number;
  totalRankScore: number;
  averageRankScore: number;
  bestPlace: number;
}

export interface ResultsResponse {
  completed: boolean;
  standings: StandingRow[];
  tribeStats: TribeStatsRow[];
}

export interface PublicOverviewResponse {
  tournament: Tournament;
  participantsCount: number;
  inProgressCount: number;
  pendingCount: number;
  finishedCount: number;
}

export interface AuditRecord {
  id: string;
  tournamentId: string;
  adminId: string | null;
  action: string;
  entityType: "tournament" | "match" | "participant";
  entityId: string | null;
  beforeJson: Record<string, unknown> | null;
  afterJson: Record<string, unknown> | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
}

export interface CsvImportSkippedRow {
  row: number;
  raw: string;
  reason: string;
}

export interface CsvImportResult {
  createdCount: number;
  skippedCount: number;
  created: Participant[];
  skipped: CsvImportSkippedRow[];
}
