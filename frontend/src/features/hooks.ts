import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tournamentRepository } from "../data/repository";
import { MatchResultType, TournamentStatus } from "../api/types";

export const ACTIVE_TOURNAMENT_ID = "active";
const PUBLIC_LIVE_REFETCH_INTERVAL_MS = 5_000;
const PUBLIC_PARTICIPANTS_REFETCH_INTERVAL_MS = 15_000;

export function usePublicOverview() {
  return useQuery({
    queryKey: ["public-overview", ACTIVE_TOURNAMENT_ID],
    queryFn: () => tournamentRepository.getPublicOverview(ACTIVE_TOURNAMENT_ID),
    refetchInterval: PUBLIC_LIVE_REFETCH_INTERVAL_MS
  });
}

export function useParticipants() {
  return useQuery({
    queryKey: ["participants", ACTIVE_TOURNAMENT_ID],
    queryFn: () => tournamentRepository.getParticipants(ACTIVE_TOURNAMENT_ID),
    refetchInterval: PUBLIC_PARTICIPANTS_REFETCH_INTERVAL_MS
  });
}

export function useSchedule() {
  return useQuery({
    queryKey: ["schedule", ACTIVE_TOURNAMENT_ID],
    queryFn: () => tournamentRepository.getSchedule(ACTIVE_TOURNAMENT_ID),
    refetchInterval: PUBLIC_LIVE_REFETCH_INTERVAL_MS
  });
}

export function useBracket() {
  return useQuery({
    queryKey: ["bracket", ACTIVE_TOURNAMENT_ID],
    queryFn: () => tournamentRepository.getBracket(ACTIVE_TOURNAMENT_ID),
    refetchInterval: PUBLIC_LIVE_REFETCH_INTERVAL_MS
  });
}

export function useResults() {
  return useQuery({
    queryKey: ["results", ACTIVE_TOURNAMENT_ID],
    queryFn: () => tournamentRepository.getResults(ACTIVE_TOURNAMENT_ID),
    refetchInterval: PUBLIC_LIVE_REFETCH_INTERVAL_MS
  });
}

export function useAdminParticipants() {
  return useQuery({
    queryKey: ["admin-participants", ACTIVE_TOURNAMENT_ID],
    queryFn: () => tournamentRepository.getAdminParticipants(ACTIVE_TOURNAMENT_ID)
  });
}

export function useAdminMatches() {
  return useQuery({
    queryKey: ["admin-matches", ACTIVE_TOURNAMENT_ID],
    queryFn: () => tournamentRepository.getAdminMatches(ACTIVE_TOURNAMENT_ID)
  });
}

export function useAdminTournaments() {
  return useQuery({
    queryKey: ["admin-tournaments"],
    queryFn: () => tournamentRepository.getAdminTournaments()
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      title: string;
      description?: string;
      setsToWin?: number;
      tvIntervalSec?: number;
      roundsCount?: number;
      date?: string | null;
      isActive?: boolean;
    }) => tournamentRepository.createTournament(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-tournaments"] });
      void queryClient.invalidateQueries({ queryKey: ["public-overview", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["participants", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-participants", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["schedule", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-matches", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["bracket", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["results", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log", ACTIVE_TOURNAMENT_ID] });
    }
  });
}

export function useActivateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tournamentId: string) => tournamentRepository.updateTournament(tournamentId, { isActive: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-tournaments"] });
      void queryClient.invalidateQueries({ queryKey: ["public-overview", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["participants", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-participants", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["schedule", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-matches", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["bracket", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["results", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log", ACTIVE_TOURNAMENT_ID] });
    }
  });
}

export function useUpdateTournamentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      tournamentId: string;
        data: Partial<{
          status: TournamentStatus;
          roundsCount: number;
          confirmStatusChange: boolean;
          confirmResetResults: boolean;
        }>;
    }) => tournamentRepository.updateTournament(payload.tournamentId, payload.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-tournaments"] });
      void queryClient.invalidateQueries({ queryKey: ["public-overview", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["participants", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-participants", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["schedule", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-matches", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["bracket", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["results", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log", ACTIVE_TOURNAMENT_ID] });
    }
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: ["audit-log", ACTIVE_TOURNAMENT_ID],
    queryFn: () => tournamentRepository.getAuditLog(ACTIVE_TOURNAMENT_ID)
  });
}

export function useAddParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      nickname: string;
      fullName?: string | null;
      tribe: "comet" | "satellite" | "star";
      telegramContact?: string | null;
    }) =>
      tournamentRepository.addParticipant(ACTIVE_TOURNAMENT_ID, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["participants", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-participants", ACTIVE_TOURNAMENT_ID] });
    }
  });
}

export function useImportParticipantsCsv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { csv: string }) => tournamentRepository.importParticipantsCsv(ACTIVE_TOURNAMENT_ID, payload.csv),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["participants", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-participants", ACTIVE_TOURNAMENT_ID] });
    }
  });
}

export function useEditParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      participantId: string;
      data: Partial<{
        nickname: string;
        fullName: string | null;
        tribe: "comet" | "satellite" | "star";
        telegramContact: string | null;
        status: "registered" | "seeded" | "active" | "eliminated" | "finished";
      }>;
    }) => tournamentRepository.editParticipant(payload.participantId, payload.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["participants", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-participants", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["public-overview", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["schedule", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["bracket", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-matches", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["results", ACTIVE_TOURNAMENT_ID] });
    }
  });
}

export function useRemoveParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participantId: string) => tournamentRepository.removeParticipant(participantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["participants", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-participants", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["public-overview", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["schedule", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["bracket", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-matches", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["results", ACTIVE_TOURNAMENT_ID] });
    }
  });
}

export function useSeedTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => tournamentRepository.seedTournament(ACTIVE_TOURNAMENT_ID),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["participants", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-participants", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-matches", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["bracket", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log", ACTIVE_TOURNAMENT_ID] });
    }
  });
}

export function useScheduleMatchAuto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => tournamentRepository.scheduleMatchAuto(matchId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["schedule", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-matches", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log", ACTIVE_TOURNAMENT_ID] });
    }
  });
}

export function useGenerateNextRound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => tournamentRepository.generateNextRound(ACTIVE_TOURNAMENT_ID),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-matches", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["schedule", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["results", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["bracket", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["public-overview", ACTIVE_TOURNAMENT_ID] });
    }
  });
}

export function useScheduleMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { matchId: string; scheduledAt: string }) =>
      tournamentRepository.scheduleMatch(payload.matchId, payload.scheduledAt),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["schedule", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-matches", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log", ACTIVE_TOURNAMENT_ID] });
    }
  });
}

export function useSetMatchResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      matchId: string;
      resultType?: MatchResultType;
      winnerId?: string | null;
      scoreA?: number;
      scoreB?: number;
    }) =>
      tournamentRepository.saveMatchResult(payload.matchId, {
        resultType: payload.resultType,
        winnerId: payload.winnerId,
        scoreA: payload.scoreA,
        scoreB: payload.scoreB
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-matches", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["schedule", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["results", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log", ACTIVE_TOURNAMENT_ID] });
    }
  });
}

export function useUpdateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<{
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
    }>) => tournamentRepository.updateTournament(ACTIVE_TOURNAMENT_ID, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-tournaments"] });
      void queryClient.invalidateQueries({ queryKey: ["public-overview", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["participants", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-participants", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["schedule", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["admin-matches", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["bracket", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["results", ACTIVE_TOURNAMENT_ID] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log", ACTIVE_TOURNAMENT_ID] });
    }
  });
}
