import { apiRepository } from "./apiRepository";
import { mockRepository } from "./mockRepository";
import { TournamentRepository } from "./repository.types";

const source = (import.meta.env.VITE_DATA_SOURCE ?? "api").toLowerCase();

export const tournamentRepository: TournamentRepository = source === "mock" ? mockRepository : apiRepository;
