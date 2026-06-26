import { BracketType, MatchStatus, ParticipantStatus, TournamentStatus, TribeCode } from "@prisma/client";

export interface CreateTournamentInput {
  id?: string;
  title: string;
  description?: string;
  setsToWin?: number;
  tvIntervalSec?: number;
  date?: string | null;
  isActive?: boolean;
  roundsCount?: number;
}

export interface UpdateTournamentInput {
  title?: string;
  description?: string;
  setsToWin?: number;
  tvIntervalSec?: number;
  date?: string | null;
  isTelegramEnabled?: boolean;
  isActive?: boolean;
  status?: TournamentStatus;
  confirmStatusChange?: boolean;
  confirmResetResults?: boolean;
  roundsCount?: number;
}

export interface CreateParticipantInput {
  nickname: string;
  tribe: TribeCode;
  telegramContact?: string | null;
}

export interface UpdateParticipantInput {
  nickname?: string;
  tribe?: TribeCode;
  telegramContact?: string | null;
  status?: ParticipantStatus;
}

export interface UpdateMatchInput {
  status?: MatchStatus;
  scheduledAt?: string | null;
}

export interface SetResultInput {
  winnerId: string;
  scoreA: number;
  scoreB: number;
}

export interface GeneratedMatch {
  id: string;
  tournamentId: string;
  bracketType: BracketType;
  roundNumber: number;
  matchNumber: number;
  sequence: number;
  participantAId: string | null;
  participantBId: string | null;
  status: MatchStatus;
  roundId?: string;
}
