import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { MatchStatus, MatchView } from "../common/types";
import { MatchesService } from "./matches.service";

class PatchMatchDto {
  @IsOptional()
  @IsIn(["pending", "finished", "bye"])
  status?: MatchStatus;

  @IsOptional()
  @IsString()
  scheduledAt?: string | null;
}

class ScheduleMatchDto {
  @IsString()
  scheduledAt!: string;
}

class SetResultDto {
  @IsString()
  winnerId!: string;

  @IsInt()
  @Min(0)
  scoreA!: number;

  @IsInt()
  @Min(0)
  scoreB!: number;
}

@Controller("admin")
@UseGuards(AdminAuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get("tournaments/:id/matches")
  list(@Param("id") tournamentId: string): Promise<Record<string, unknown>> {
    return this.matchesService.list(tournamentId);
  }

  @Get("tournaments/:id/rounds")
  listRounds(@Param("id") tournamentId: string): Promise<Record<string, unknown>> {
    return this.matchesService.listRounds(tournamentId);
  }

  @Get("tournaments/:id/rounds/:roundNumber/matches")
  roundMatches(@Param("id") tournamentId: string, @Param("roundNumber") roundNumber: string): Promise<Record<string, unknown>> {
    return this.matchesService.getRoundMatches(tournamentId, Number(roundNumber));
  }

  @Post("tournaments/:id/rounds/next")
  nextRound(@Param("id") tournamentId: string): Promise<Record<string, unknown>> {
    return this.matchesService.generateNextRound(tournamentId);
  }

  @Patch("matches/:matchId")
  patch(@Param("matchId") matchId: string, @Body() body: PatchMatchDto): Promise<MatchView> {
    return this.matchesService.update(matchId, body);
  }

  @Patch("matches/:matchId/schedule")
  schedule(
    @Param("matchId") matchId: string,
    @Body() body: ScheduleMatchDto,
    @Req() request: { admin?: { id: string } }
  ): Promise<MatchView> {
    return this.matchesService.schedule(matchId, body.scheduledAt, request.admin?.id ?? null);
  }

  @Post("matches/:matchId/schedule-auto")
  scheduleAuto(
    @Param("matchId") matchId: string,
    @Req() request: { admin?: { id: string } }
  ): Promise<MatchView> {
    return this.matchesService.scheduleAuto(matchId, request.admin?.id ?? null);
  }

  @Post("matches/:matchId/result")
  result(
    @Param("matchId") matchId: string,
    @Body() body: SetResultDto,
    @Req() request: { admin?: { id: string } }
  ): Promise<MatchView> {
    return this.matchesService.setResult(matchId, body, request.admin?.id ?? null);
  }

  @Post("matches/:matchId/reset-result")
  reset(
    @Param("matchId") matchId: string,
    @Req() request: { admin?: { id: string } }
  ): Promise<MatchView> {
    return this.matchesService.resetResult(matchId, request.admin?.id ?? null);
  }
}
