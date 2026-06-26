import { request } from "./httpClient";
import {
  BracketResponse,
  PublicOverviewResponse,
  ResultsResponse,
  ScheduleResponse,
  TribeStatsRow,
  Participant
} from "./types";

export async function fetchPublicOverview(tournamentId: string): Promise<PublicOverviewResponse> {
  return request<PublicOverviewResponse>(`/tournaments/${tournamentId}/public`);
}

export async function fetchPublicParticipants(tournamentId: string): Promise<{ items: Participant[] }> {
  return request<{ items: Participant[] }>(`/tournaments/${tournamentId}/participants`);
}

export async function fetchPublicSchedule(tournamentId: string): Promise<ScheduleResponse> {
  return request<ScheduleResponse>(`/tournaments/${tournamentId}/schedule`);
}

export async function fetchPublicBracket(tournamentId: string): Promise<BracketResponse> {
  return request<BracketResponse>(`/tournaments/${tournamentId}/bracket`);
}

export async function fetchPublicResults(tournamentId: string): Promise<ResultsResponse> {
  return request<ResultsResponse>(`/tournaments/${tournamentId}/results`);
}

export async function fetchPublicTribeStats(tournamentId: string): Promise<{ items: TribeStatsRow[] }> {
  return request<{ items: TribeStatsRow[] }>(`/tournaments/${tournamentId}/tribe-stats`);
}
