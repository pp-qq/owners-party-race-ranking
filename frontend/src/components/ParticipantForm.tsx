import React, { useState } from "react";

interface Props {
  id: string;
  name: string;
  time?: number | null;
  onSave: (name: string, time: number | null) => void;
}

const ParticipantForm: React.FC<Props> = ({ id, name, time, onSave }) => {
  const [editName, setEditName] = useState(name);
  const [editTime, setEditTime] = useState(time !== null && time !== undefined ? time.toString() : "");

  return (
    <div>
      <input value={editName} onChange={(e) => setEditName(e.target.value)} />
      <input value={editTime} onChange={(e) => setEditTime(e.target.value)} />
      <button
        onClick={() => {
          const trimmed = editTime.trim();
          const parsed = trimmed === "" ? null : Number(trimmed);
          onSave(editName, trimmed === "" || Number.isNaN(parsed) ? null : parsed);
        }}
      >
        保存
      </button>
    </div>
  );
};

export default ParticipantForm;
