import React, { useState } from "react";

interface Props {
  al_no: string;
  family_name: string;
  al_name: string;
  size: string;
  time?: number | null;
  onSave: (family_name: string, al_name: string, size: string, time: number | null) => void;
}

const ParticipantForm: React.FC<Props> = ({ al_no, family_name, al_name, size, time, onSave }) => {
  const [editFamilyName, setEditFamilyName] = useState(family_name);
  const [editAlName, setEditAlName] = useState(al_name);
  const [editSize, setEditSize] = useState(size);
  const [editTime, setEditTime] = useState(time !== null && time !== undefined ? time.toString() : "");

  return (
    <div>
      <input value={editFamilyName} onChange={(e) => setEditFamilyName(e.target.value)} />
      <input value={editAlName} onChange={(e) => setEditAlName(e.target.value)} />
      <input value={editSize} onChange={(e) => setEditSize(e.target.value)} />
      <input value={editTime} onChange={(e) => setEditTime(e.target.value)} />
      <button
        onClick={() => {
          const trimmed = editTime.trim();
          const parsed = trimmed === "" ? null : Number(trimmed);
          onSave(editFamilyName, editAlName, editSize, trimmed === "" || Number.isNaN(parsed) ? null : parsed);
        }}
      >
        保存
      </button>
    </div>
  );
};

export default ParticipantForm;
