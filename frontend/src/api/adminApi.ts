import { request } from "./httpClient";
import { AuditRecord, CsvImportResult, MatchResultType, MatchView, Participant, Tournament, TournamentStatus } from "./types";

export async function fetchAdminTournaments(): Promise<{ items: Tournament[] }> {
  return request<{ items: Tournament[] }>("/admin/tournaments");
}

export async function createTournament(
  payload: {
    title: string;
    description?: string;
    setsToWin?: number;
    tvIntervalSec?: number;
    roundsCount?: number;
    date?: string | null;
    isActive?: boolean;
  }
): Promise<Tournament> {
  return request<Tournament>("/admin/tournaments", { method: "POST", json: payload });
}

export async function patchTournament(
  tournamentId: string,
  payload: Partial<{
    title: string;
    description: string;
    setsToWin: number;
    tvIntervalSec: number;
    roundsCount: number;
    date: string | null;
    isTelegramEnabled: boolean;
    isActive: boolean;
    status: TournamentStatus;
    confirmStatusChange: boolean;
    confirmResetResults: boolean;
  }>
): Promise<Tournament> {
  return request<Tournament>(`/admin/tournaments/${tournamentId}`, { method: "PATCH", json: payload });
}

export async function fetchAdminParticipants(tournamentId: string): Promise<{ items: Participant[] }> {
  return request<{ items: Participant[] }>(`/admin/tournaments/${tournamentId}/participants`);
}

export async function createParticipant(
  tournamentId: string,
  payload: { nickname: string; fullName?: string | null; tribe: "comet" | "satellite" | "star"; telegramContact?: string | null }
): Promise<Participant> {
  return request<Participant>(`/admin/tournaments/${tournamentId}/participants`, { method: "POST", json: payload });
}

export async function patchParticipant(
  participantId: string,
  payload: Partial<{
    nickname: string;
    fullName: string | null;
    tribe: "comet" | "satellite" | "star";
    telegramContact: string | null;
    status: "registered" | "seeded" | "active" | "eliminated" | "finished";
  }>
): Promise<Participant> {
  return request<Participant>(`/admin/participants/${participantId}`, { method: "PATCH", json: payload });
}

export async function deleteParticipant(participantId: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/admin/participants/${participantId}`, { method: "DELETE" });
}

export async function seedTournament(tournamentId: string): Promise<{ seeded: Participant[] }> {
  return request<{ seeded: Participant[] }>(`/admin/tournaments/${tournamentId}/seed`, { method: "POST" });
}

export async function importParticipantsCsv(tournamentId: string, csv: string): Promise<CsvImportResult> {
  return request<CsvImportResult>(`/admin/tournaments/${tournamentId}/participants/import-csv`, {
    method: "POST",
    json: { csv }
  });
}

export async function fetchAdminMatches(tournamentId: string): Promise<{ items: MatchView[] }> {
  return request<{ items: MatchView[] }>(`/admin/tournaments/${tournamentId}/matches`);
}

export async function generateNextRound(tournamentId: string): Promise<{ round: number }> {
  return request<{ round: number }>(`/admin/tournaments/${tournamentId}/rounds/next`, { method: "POST" });
}

export async function scheduleMatch(matchId: string, scheduledAt: string): Promise<MatchView> {
  return request<MatchView>(`/admin/matches/${matchId}/schedule`, {
    method: "PATCH",
    json: { scheduledAt }
  });
}

export async function scheduleMatchAuto(matchId: string): Promise<MatchView> {
  return request<MatchView>(`/admin/matches/${matchId}/schedule-auto`, { method: "POST" });
}

export async function setMatchResult(
  matchId: string,
  payload: { resultType?: MatchResultType; winnerId?: string | null; scoreA?: number; scoreB?: number }
): Promise<MatchView> {
  return request<MatchView>(`/admin/matches/${matchId}/result`, { method: "POST", json: payload });
}

export async function resetMatchResult(matchId: string): Promise<MatchView> {
  return request<MatchView>(`/admin/matches/${matchId}/reset-result`, { method: "POST" });
}

export async function fetchAuditLog(tournamentId: string): Promise<{ items: AuditRecord[] }> {
  return request<{ items: AuditRecord[] }>(`/admin/tournaments/${tournamentId}/audit-log`);
}
