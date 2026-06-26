-- Enforce unique non-null seed numbers inside each tournament.
CREATE UNIQUE INDEX "Participant_tournamentId_seedNumber_key" ON "Participant"("tournamentId", "seedNumber");
