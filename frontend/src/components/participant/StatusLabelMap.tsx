import { Participant } from "api/types";

export const participantStatusLabelMap: Record<Participant["status"], string> = {
  registered: "Зарегистрирован",
  seeded: "Посеян",
  active: "Активен",
  eliminated: "Выбыл",
  finished: "Завершил"
};