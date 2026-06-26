import { Controller, Get, Param } from "@nestjs/common";
import { TournamentsService } from "./tournaments.service";

@Controller("tournaments")
export class PublicTournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get(":id/public")
  getTournamentPublic(@Param("id") tournamentId: string): Promise<Record<string, unknown>> {
    return this.tournamentsService.getPublicOverview(tournamentId);
  }

  @Get(":id/participants")
  getParticipants(@Param("id") tournamentId: string): Promise<Record<string, unknown>> {
    return this.tournamentsService.getPublicParticipants(tournamentId);
  }

  @Get(":id/schedule")
  getSchedule(@Param("id") tournamentId: string): Promise<Record<string, unknown>> {
    return this.tournamentsService.getPublicSchedule(tournamentId);
  }

  @Get(":id/bracket")
  getBracket(@Param("id") tournamentId: string): Promise<Record<string, unknown>> {
    return this.tournamentsService.getPublicBracket(tournamentId);
  }

  @Get(":id/results")
  getResults(@Param("id") tournamentId: string): Promise<Record<string, unknown>> {
    return this.tournamentsService.getPublicResults(tournamentId);
  }

  @Get(":id/tribe-stats")
  getTribeStats(@Param("id") tournamentId: string): Promise<Record<string, unknown>> {
    return this.tournamentsService.getPublicTribeStats(tournamentId);
  }
}
