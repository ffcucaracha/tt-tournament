import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { CommonModule } from "./common/common.module";
import { MatchesModule } from "./matches/matches.module";
import { ParticipantsModule } from "./participants/participants.module";
import { TelegramModule } from "./telegram/telegram.module";
import { TournamentsModule } from "./tournaments/tournaments.module";

@Module({
  imports: [CommonModule, AuthModule, TournamentsModule, ParticipantsModule, MatchesModule, TelegramModule]
})
export class AppModule {}
