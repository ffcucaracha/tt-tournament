import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { TournamentStatus } from "../common/types";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { TournamentsService } from "./tournaments.service";

class CreateTournamentDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  setsToWin?: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  tvIntervalSec?: number;

  @IsOptional()
  @IsString()
  date?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  roundsCount?: number;
}

class UpdateTournamentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  setsToWin?: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  tvIntervalSec?: number;

  @IsOptional()
  @IsString()
  date?: string | null;

  @IsOptional()
  @IsBoolean()
  isTelegramEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(["draft", "in_progress", "finished"])
  status?: TournamentStatus;

  @IsOptional()
  @IsBoolean()
  confirmStatusChange?: boolean;

  @IsOptional()
  @IsBoolean()
  confirmResetResults?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  roundsCount?: number;
}

@Controller("admin/tournaments")
@UseGuards(AdminAuthGuard)
export class AdminTournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  listTournaments(): Promise<Record<string, unknown>> {
    return this.tournamentsService.listAdminTournaments();
  }

  @Post()
  createTournament(@Body() body: CreateTournamentDto): Promise<Record<string, unknown>> {
    return this.tournamentsService.createTournament(body);
  }

  @Get(":id")
  getTournament(@Param("id") tournamentId: string): Promise<Record<string, unknown>> {
    return this.tournamentsService.getTournament(tournamentId);
  }

  @Patch(":id")
  patchTournament(@Param("id") tournamentId: string, @Body() body: UpdateTournamentDto): Promise<Record<string, unknown>> {
    return this.tournamentsService.updateTournament(tournamentId, body);
  }

  @Delete(":id")
  deleteTournament(@Param("id") tournamentId: string): Promise<Record<string, unknown>> {
    return this.tournamentsService.deleteTournament(tournamentId);
  }

  @Get(":id/audit-log")
  getAuditLog(@Param("id") tournamentId: string): Promise<Record<string, unknown>> {
    return this.tournamentsService.getAuditLog(tournamentId);
  }
}
