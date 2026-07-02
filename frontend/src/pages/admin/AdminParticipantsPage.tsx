import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { CsvImportResult, Participant } from "../../api/types";
import { PageTitle } from "../../components/PageTitle";
import {
  useAddParticipant,
  useAdminParticipants,
  useAdminTournaments,
  useEditParticipant,
  useImportParticipantsCsv,
  useRemoveParticipant,
  useSeedTournament
} from "../../features/hooks";
import ParticipantList from "../../components/participant/ParticipantList";

type ParticipantsSortMode = "created_at" | "seed_number";


export function AdminParticipantsPage(): JSX.Element {
  const participantsQuery = useAdminParticipants();
  const tournamentsQuery = useAdminTournaments();
  const addMutation = useAddParticipant();
  const editMutation = useEditParticipant();
  const removeMutation = useRemoveParticipant();
  const importMutation = useImportParticipantsCsv();
  const seedMutation = useSeedTournament();
  const tournament = tournamentsQuery.data?.find((item) => item.isActive) ?? tournamentsQuery.data?.[0];
  const participantsCount = participantsQuery.data?.length ?? 0;
  const canSeed = tournament?.status === "draft" && participantsCount >= 10;
  const canManageParticipants = tournament?.status === "draft";
  const recommendedRounds = participantsCount <= 15 ? 5 : participantsCount <= 23 ? 5 : 6;

  const [nickname, setNickname] = useState("");
  const [fullName, setFullName] = useState("");
  const [tribe, setTribe] = useState<"comet" | "satellite" | "star">("comet");
  const [contact, setContact] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [csvReport, setCsvReport] = useState<CsvImportResult | null>(null);
  const [sortMode, setSortMode] = useState<ParticipantsSortMode>("created_at");

  const onSubmit = (event: FormEvent): void => {
    event.preventDefault();
    if (!nickname.trim()) {
      return;
    }
    addMutation.mutate({
      nickname: nickname.trim(),
      fullName: fullName.trim() || null,
      tribe,
      telegramContact: contact.trim() || null
    });
    setNickname("");
    setFullName("");
    setContact("");
  };

  const onCsvFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setCsvFileName(file.name);
    setCsvReport(null);
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsText(file, "utf-8");
  };

  const onSubmitCsvImport = (event: FormEvent): void => {
    event.preventDefault();
    const csv = csvText.trim();
    if (!csv) {
      return;
    }
    importMutation.mutate(
      { csv },
      {
        onSuccess: (result) => {
          setCsvReport(result);
        }
      }
    );
  };

  const sortedParticipants = useMemo<Participant[]>(() => {
    const items = [...(participantsQuery.data ?? [])];

    if (sortMode === "seed_number") {
      return items.sort((left, right) => {
        const leftSeed = left.seedNumber;
        const rightSeed = right.seedNumber;
        if (leftSeed === null && rightSeed === null) {
          return left.registrationOrder - right.registrationOrder;
        }
        if (leftSeed === null) {
          return 1;
        }
        if (rightSeed === null) {
          return -1;
        }
        if (leftSeed !== rightSeed) {
          return leftSeed - rightSeed;
        }
        return left.registrationOrder - right.registrationOrder;
      });
    }

    return items.sort((left, right) => {
      const leftTime = Number.isNaN(new Date(left.createdAt).getTime()) ? 0 : new Date(left.createdAt).getTime();
      const rightTime = Number.isNaN(new Date(right.createdAt).getTime()) ? 0 : new Date(right.createdAt).getTime();
      if (leftTime !== rightTime) {
        return rightTime - leftTime;
      }
      return right.registrationOrder - left.registrationOrder;
    });
  }, [participantsQuery.data, sortMode]);

  if (participantsQuery.isLoading) {
    return <p className="rounded-lg border border-white/10 bg-panel/80 p-4 text-textMuted">Загрузка...</p>;
  }

  if (participantsQuery.isError || !participantsQuery.data) {
    return <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">Ошибка загрузки</p>;
  }

  return (
    <div className="space-y-4">
      <PageTitle
        title="Админка участников"
        subtitle={`Импорт/добавление участников и запуск посева (текущий состав: ${participantsCount}, минимум для старта: 10)`}
        rightSlot={
          (canSeed && <button
            className="rounded-md border border-accent/60 bg-accent/10 px-3 py-1.5 text-sm text-accent disabled:opacity-60"
            onClick={() => seedMutation.mutate()}
            disabled={!canSeed || seedMutation.isPending}
            type="button"
          >
            Запустить турнир
          </button>)
        }
      />

      <p className="rounded-md border border-white/10 bg-panel/80 px-3 py-2 text-xs text-textMuted">
        Рекомендованное число туров для текущего состава: {recommendedRounds}. Фактическое значение задается в настройках турнира до старта.
      </p>

      {canManageParticipants && <form className="grid gap-3 rounded-lg border border-white/10 bg-panel/90 p-4 md:grid-cols-5" onSubmit={onSubmit}>
        <input
          className="rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
          placeholder="Ник"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          disabled={addMutation.isPending}
        />
        <input
          className="rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
          placeholder="Имя"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          disabled={addMutation.isPending}
        />
        <select
          className="rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
          value={tribe}
          onChange={(event) => setTribe(event.target.value as "comet" | "satellite" | "star")}
          disabled={addMutation.isPending}
        >
          <option value="comet">Комета</option>
          <option value="satellite">Спутник</option>
          <option value="star">Звезда</option>
        </select>
        <input
          className="rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
          placeholder="@telegram"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          disabled={addMutation.isPending}
        />
        <button
          className="rounded-md border border-satellite/60 bg-satellite/15 px-3 py-2 text-sm text-satellite disabled:opacity-60"
          disabled={addMutation.isPending}
          type="submit"
        >
          Добавить
        </button>
      </form> }

      {canManageParticipants &&<section className="space-y-3 rounded-lg border border-white/10 bg-panel/90 p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-textMain">Импорт участников из CSV</p>
          <p className="text-xs text-textMuted">
            Поддерживается CSV из Google Forms/Sheets: заголовки могут быть на русском или английском.
          </p>
        </div>
        <form className="space-y-3" onSubmit={onSubmitCsvImport}>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="block w-full cursor-pointer rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain file:mr-3 file:rounded file:border-0 file:bg-accent/15 file:px-2 file:py-1 file:text-xs file:text-accent md:w-auto"
              type="file"
              accept=".csv,text/csv"
              onChange={onCsvFileChange}
              disabled={importMutation.isPending}
            />
            {csvFileName ? <span className="text-xs text-textMuted">Файл: {csvFileName}</span> : null}
          </div>
          <textarea
            className="h-36 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
            placeholder="Вставьте CSV сюда или загрузите файл"
            value={csvText}
            onChange={(event) => {
              setCsvText(event.target.value);
              setCsvReport(null);
            }}
            disabled={importMutation.isPending}
          />
          <button
            className="rounded-md border border-satellite/60 bg-satellite/15 px-3 py-2 text-sm text-satellite disabled:opacity-60"
            type="submit"
            disabled={importMutation.isPending || !csvText.trim()}
          >
            Импортировать CSV
          </button>
        </form>

        {importMutation.isError ? (
          <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {importMutation.error instanceof Error ? importMutation.error.message : "Ошибка импорта CSV"}
          </p>
        ) : null}

        {csvReport ? (
          <div className="space-y-2 rounded-md border border-white/10 bg-black/20 p-3">
            <p className="text-sm text-textMain">
              Создано: <span className="font-semibold text-emerald-300">{csvReport.createdCount}</span>, пропущено:{" "}
              <span className="font-semibold text-amber-300">{csvReport.skippedCount}</span>
            </p>
            {csvReport.skipped.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs text-textMuted">Пропущенные строки:</p>
                <div className="max-h-40 space-y-1 overflow-auto rounded border border-white/10 bg-black/30 p-2">
                  {csvReport.skipped.map((item) => (
                    <p key={`${item.row}-${item.raw}`} className="text-xs text-amber-200">
                      #{item.row}: {item.reason}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>}

      {editMutation.isError ? (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {editMutation.error instanceof Error ? editMutation.error.message : "Ошибка редактирования участника"}
        </p>
      ) : null}

      {removeMutation.isError ? (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {removeMutation.error instanceof Error ? removeMutation.error.message : "Ошибка удаления участника"}
        </p>
      ) : null}

      <section className="rounded-lg border border-white/10 bg-panel/90">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
          <p className="text-sm font-medium text-textMain">Список участников</p>
          <label className="flex items-center gap-2 text-xs text-textMuted">
            Сортировка
            <select
              className="rounded-md border border-white/20 bg-black/20 px-2 py-1 text-xs text-textMain"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as ParticipantsSortMode)}
            >
              <option value="created_at">По дате добавления</option>
              <option value="seed_number">По номеру посева</option>
            </select>
          </label>
        </div>

        <ParticipantList participants={sortedParticipants} 
          canManageParticipants={canManageParticipants} 
          editMutation={editMutation}
          removeMutation={removeMutation} 
          
          />

        
      </section>
    </div>
  );
}
