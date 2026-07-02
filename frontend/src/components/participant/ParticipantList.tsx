import { Participant } from "api/types"
import ParticipantItem from "./Participant"
import { FormEvent, useState } from "react";

type Props = {
    participants: Participant[],
    canManageParticipants: boolean
    editMutation: any,
    removeMutation: any
}

export default function ParticipantList({ participants, canManageParticipants, editMutation, removeMutation }: Props) {
    const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
    const [editNickname, setEditNickname] = useState("");
    const [editFullName, setEditFullName] = useState("");
    const [editTribe, setEditTribe] = useState<"comet" | "satellite" | "star">("comet");
    const [editContact, setEditContact] = useState("");

    const startEditParticipant = (participant: Participant): void => {
        setEditingParticipantId(participant.id);
        setEditNickname(participant.nickname);
        setEditFullName(participant.fullName ?? "");
        setEditTribe(participant.tribe);
        setEditContact(participant.telegramContact ?? "");
    };

    const cancelEditParticipant = (): void => {
        setEditingParticipantId(null);
        setEditNickname("");
        setEditFullName("");
        setEditContact("");
    };

    const onSubmitParticipantEdit = (event: FormEvent): void => {
        event.preventDefault();
        if (!editingParticipantId || !editNickname.trim()) {
            return;
        }
        editMutation.mutate(
            {
                participantId: editingParticipantId,
                data: {
                    nickname: editNickname.trim(),
                    fullName: editFullName.trim() || null,
                    tribe: editTribe,
                    telegramContact: editContact.trim() || null
                }
            },
            {
                onSuccess: () => {
                    cancelEditParticipant();
                }
            }
        );
    };

    const onDeleteParticipant = (participant: Participant): void => {
        if (!window.confirm(`Удалить участника ${participant.nickname}?`)) {
            return;
        }
        removeMutation.mutate(participant.id, {
            onSuccess: () => {
                if (editingParticipantId === participant.id) {
                    cancelEditParticipant();
                }
            }
        });
    };

    const onToggleEliminated = (participant: Participant): void => {
        const nextStatus = participant.status === "eliminated"
            ? (participant.seedNumber === null ? "registered" : "seeded")
            : "eliminated";
        editMutation.mutate({
            participantId: participant.id,
            data: {
                status: nextStatus
            }
        });
    };

    return (
        <div className="divide-y divide-white/10">
            {participants.map((participant) => (
                <ParticipantItem
                    key={participant.id}
                    participant={participant}
                    isEditing={participant.id === editingParticipantId}
                    canManageParticipants={canManageParticipants}
                    onDeleteParticipant={onDeleteParticipant}
                    onToggleEliminated={onToggleEliminated}
                    cancelEditParticipant={cancelEditParticipant}
                    startEditParticipant={startEditParticipant}
                    onSubmitParticipantEdit={onSubmitParticipantEdit}
                    editNickname={editNickname}
                    setEditNickname={setEditNickname}
                    editFullName={editFullName}
                    setEditFullName={setEditFullName}
                    editTribe={editTribe}
                    setEditTribe={setEditTribe}
                    editContact={editContact}
                    setEditContact={setEditContact}
                    isPending={editMutation.isPending || removeMutation.isPending}
                />
            ))}
        </div>
    )
}
