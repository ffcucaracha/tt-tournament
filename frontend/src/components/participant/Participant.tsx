import { Participant } from "api/types";
import { TribeBadge } from "../../components/TribeBadge";
import { FormEvent } from "react";
import { formatIsoInOmsk } from "../../shared/datetime";
import { participantStatusLabelMap } from "./StatusLabelMap";


type Props = {
    participant: Participant
    isEditing: boolean
    canManageParticipants: boolean
    onDeleteParticipant: (participant: Participant) => void
    onToggleEliminated: (participant: Participant) => void
    cancelEditParticipant: () => void
    startEditParticipant: (participant: Participant) => void
    onSubmitParticipantEdit: (event: FormEvent) => void
    editNickname: string
    setEditNickname: (value: string) => void
    editTribe: "comet" | "satellite" | "star"
    setEditTribe: (value: "comet" | "satellite" | "star") => void
    editContact: string
    setEditContact: (value: string) => void
    isPending: boolean
}

export default function ParticipantItem({
    participant, isEditing, canManageParticipants,
    onDeleteParticipant, onToggleEliminated, cancelEditParticipant, startEditParticipant, onSubmitParticipantEdit,
    editNickname, setEditNickname, editTribe, setEditTribe, editContact, setEditContact, isPending
}: Props) {


    return (
        <article key={participant.id} className="space-y-3 px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="w-7 rounded bg-black/30 px-2 py-0.5 text-center text-xs text-textMuted">
                            {participant.seedNumber ?? "—"}
                        </span>
                        <p className="text-sm text-textMain">{participant.nickname}</p>
                        <TribeBadge tribe={participant.tribe} compact />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-textMuted">
                        <span>{participant.telegramContact ?? "Telegram не указан"}</span>
                        <span>Добавлен: {formatIsoInOmsk(participant.createdAt)}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className=" px-2 py-0.5 text-xs text-textMuted">
                        {participantStatusLabelMap[participant.status]}
                    </span>
                    <button
                        className={
                            participant.status === "eliminated"
                                ? "rounded-md border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200 disabled:opacity-60"
                                : "rounded-md border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200 disabled:opacity-60"
                        }
                        type="button"
                        onClick={() => onToggleEliminated(participant)}
                        disabled={isPending}
                    >
                        {participant.status === "eliminated" ? "Вернуть" : "Выбыл"}
                    </button>
                    <button
                        className="rounded-md border border-white/25 bg-black/20 px-2.5 py-1 text-xs text-textMain disabled:opacity-60"
                        type="button"
                        onClick={() => startEditParticipant(participant)}
                        disabled={isPending}
                    >
                        Редактировать
                    </button>
                    {canManageParticipants &&<button
                        className="rounded-md border border-rose-500/50 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-200 disabled:opacity-60"
                        type="button"
                        onClick={() => onDeleteParticipant(participant)}
                        disabled={isPending}
                    >
                        Удалить
                    </button>}
                </div>
            </div>

            {isEditing ? (
                <form className="grid gap-2 border-t border-white/10 pt-3 md:grid-cols-3" onSubmit={onSubmitParticipantEdit}>
                    <input
                        className="rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
                        value={editNickname}
                        onChange={(event) => setEditNickname(event.target.value)}
                        placeholder="Ник"
                        disabled={isPending}
                    />
                    <select
                        className="rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
                        value={editTribe}
                        onChange={(event) => setEditTribe(event.target.value as "comet" | "satellite" | "star")}
                        disabled={isPending}
                    >
                        <option value="comet">Комета</option>
                        <option value="satellite">Спутник</option>
                        <option value="star">Звезда</option>
                    </select>
                    <input
                        className="rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
                        value={editContact}
                        onChange={(event) => setEditContact(event.target.value)}
                        placeholder="@telegram"
                        disabled={isPending}
                    />
                    <div className="flex gap-2 md:col-span-3">
                        <button
                            className="rounded-md border border-satellite/60 bg-satellite/15 px-3 py-2 text-sm text-satellite disabled:opacity-60"
                            type="submit"
                            disabled={isPending || !editNickname.trim()}
                        >
                            Сохранить
                        </button>
                        <button
                            className="rounded-md border border-white/25 bg-black/20 px-3 py-2 text-sm text-textMuted disabled:opacity-60"
                            type="button"
                            onClick={cancelEditParticipant}
                            disabled={isPending}
                        >
                            Отмена
                        </button>
                    </div>
                </form>
            ) : null}
        </article>
    )
}
