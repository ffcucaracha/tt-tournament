import { MatchView } from "api/types";
import { useScheduleMatchAuto } from "../../features/hooks";
import { FormEvent } from "react";

type Props = {
    scheduledAtLocal: string
    setScheduledAtLocal: (value: string) => void
    onSubmitSchedule: (event: FormEvent<HTMLFormElement>) => void
    scheduleMutation: any
    selectedMatch: MatchView
}

export default function DatetimeForm(
    { scheduledAtLocal, setScheduledAtLocal, onSubmitSchedule, scheduleMutation, selectedMatch }: Props
) {
    const scheduleAutoMutation = useScheduleMatchAuto();

    return (
        <>
            <button
                className="w-full rounded-md border border-accent/60 bg-accent/10 px-3 py-2 text-sm text-accent disabled:opacity-60"
                onClick={() => scheduleAutoMutation.mutate(selectedMatch.id)}
                disabled={scheduleAutoMutation.isPending}
                type="button"
            >
                Автоматически (ближайшая пятница 18:30)
            </button>

            <form className="space-y-2" onSubmit={onSubmitSchedule}>
                <input
                    className="w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-textMain"
                    type="datetime-local"
                    value={scheduledAtLocal}
                    onChange={(event) => setScheduledAtLocal(event.target.value)}
                    required
                />
                <button
                    className="w-full rounded-md border border-satellite/60 bg-satellite/10 px-3 py-2 text-sm text-satellite disabled:opacity-60"
                    disabled={scheduleMutation.isPending}
                    type="submit"
                >
                    Сохранить дату и время
                </button>
            </form>
        </>
    )
}