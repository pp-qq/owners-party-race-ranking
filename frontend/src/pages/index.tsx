import React, { useEffect, useState } from "react";
import Timer from "../components/Timer";

interface Participant {
  id: string;
  name: string;
  times: number[];
  best_time?: number;
  rank?: number;
}

const fetchRanking = async (): Promise<Participant[]> => {
  const res = await fetch("/api/ranking");
  const data = await res.json();
  return data.ranking || [];
};

const updateParticipant = async (participant: Participant) => {
  await fetch("/api/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(participant),
  });
};

const IndexPage: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTime, setEditTime] = useState("");

  useEffect(() => {
    fetchRanking().then(setParticipants);
  }, []);

  const handleEdit = (p: Participant) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditTime(p.best_time?.toString() || "");
  };

  const handleSave = async () => {
    if (!editId) return;
    const updated = participants.map((p) =>
      p.id === editId ? { ...p, name: editName, best_time: Number(editTime) } : p
    );
    await updateParticipant({
      id: editId,
      name: editName,
      times: [],
      best_time: Number(editTime),
      rank: undefined,
    });
    setParticipants(updated);
    setEditId(null);
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>参加者記録編集</h1>
      <Timer />
      <table border={1} cellPadding={8} style={{ width: "100%", marginBottom: 32 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>名前</th>
            <th>タイム</th>
            <th>順位</th>
            <th>編集</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>
                {editId === p.id ? (
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                ) : (
                  p.name
                )}
              </td>
              <td>
                {editId === p.id ? (
                  <input value={editTime} onChange={(e) => setEditTime(e.target.value)} />
                ) : (
                  p.best_time
                )}
              </td>
              <td>{p.rank}</td>
              <td>
                {editId === p.id ? (
                  <button onClick={handleSave}>保存</button>
                ) : (
                  <button onClick={() => handleEdit(p)}>編集</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default IndexPage;
