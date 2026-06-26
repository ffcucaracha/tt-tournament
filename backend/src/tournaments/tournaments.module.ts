import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminTournamentsController } from "./admin-tournaments.controller";
import { PublicTournamentsController } from "./public-tournaments.controller";
import { TournamentsService } from "./tournaments.service";

@Module({
  imports: [AuthModule],
  controllers: [PublicTournamentsController, AdminTournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService]
})
export class TournamentsModule {}
