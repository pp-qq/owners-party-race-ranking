import React, { useState } from "react";

interface Props {
  id: string;
  name: string;
  best_time?: number;
  onSave: (name: string, best_time: number) => void;
}

const ParticipantForm: React.FC<Props> = ({ id, name, best_time, onSave }) => {
  const [editName, setEditName] = useState(name);
  const [editTime, setEditTime] = useState(best_time?.toString() || "");

  return (
    <div>
      <input value={editName} onChange={(e) => setEditName(e.target.value)} />
      <input value={editTime} onChange={(e) => setEditTime(e.target.value)} />
      <button onClick={() => onSave(editName, Number(editTime))}>保存</button>
    </div>
  );
};

export default ParticipantForm;
