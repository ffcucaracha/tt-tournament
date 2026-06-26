import {
  createTournament,
  createParticipant,
  deleteParticipant,
  fetchAdminMatches,
  fetchAdminParticipants,
  fetchAdminTournaments,
  generateNextRound,
  fetchAuditLog,
  importParticipantsCsv,
  patchParticipant,
  patchTournament,
  resetMatchResult,
  scheduleMatch,
  scheduleMatchAuto,
  seedTournament,
  setMatchResult
} from "../api/adminApi";
import {
  fetchPublicBracket,
  fetchPublicOverview,
  fetchPublicParticipants,
  fetchPublicResults,
  fetchPublicSchedule
} from "../api/publicApi";
import { TournamentRepository } from "./repository.types";

export const apiRepository: TournamentRepository = {
  async getPublicOverview(tournamentId) {
    return fetchPublicOverview(tournamentId);
  },

  async getParticipants(tournamentId) {
    const response = await fetchPublicParticipants(tournamentId);
    return response.items;
  },

  async getSchedule(tournamentId) {
    return fetchPublicSchedule(tournamentId);
  },

  async getBracket(tournamentId) {
    return fetchPublicBracket(tournamentId);
  },

  async getResults(tournamentId) {
    return fetchPublicResults(tournamentId);
  },

  async getAdminTournaments() {
    const response = await fetchAdminTournaments();
    return response.items;
  },

  async createTournament(payload) {
    return createTournament(payload);
  },

  async updateTournament(tournamentId, payload) {
    return patchTournament(tournamentId, payload);
  },

  async getAdminParticipants(tournamentId) {
    const response = await fetchAdminParticipants(tournamentId);
    return response.items;
  },

  async addParticipant(tournamentId, payload) {
    return createParticipant(tournamentId, payload);
  },

  async importParticipantsCsv(tournamentId, csv) {
    return importParticipantsCsv(tournamentId, csv);
  },

  async editParticipant(participantId, payload) {
    return patchParticipant(participantId, payload);
  },

  async removeParticipant(participantId) {
    await deleteParticipant(participantId);
  },

  async seedTournament(tournamentId) {
    await seedTournament(tournamentId);
  },

  async getAdminMatches(tournamentId) {
    const response = await fetchAdminMatches(tournamentId);
    return response.items;
  },

  async generateNextRound(tournamentId) {
    return generateNextRound(tournamentId);
  },

  async scheduleMatch(matchId, scheduledAt) {
    return scheduleMatch(matchId, scheduledAt);
  },

  async scheduleMatchAuto(matchId) {
    return scheduleMatchAuto(matchId);
  },

  async saveMatchResult(matchId, payload) {
    return setMatchResult(matchId, payload);
  },

  async resetMatchResult(matchId) {
    return resetMatchResult(matchId);
  },

  async getAuditLog(tournamentId) {
    const response = await fetchAuditLog(tournamentId);
    return response.items;
  }
};
