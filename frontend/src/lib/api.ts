// const API_BASE = "http://localhost:8000";
const API_BASE = "https://owners-party-race-ranking-448424110257.asia-northeast3.run.app";

export const fetchRanking = async () => {
  const res = await fetch(`${API_BASE}/ranking`);
  // デバックログ出力
  console.log("Ranking fetch response:", res);
  return await res.json();
};

export const updateParticipant = async (participant: any) => {
  await fetch(`${API_BASE}/record`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(participant),
  });
};

export const fetchParticipant = async (id: string) => {
  const res = await fetch(`${API_BASE}/participant/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch participant (${res.status})`);
  }
  return await res.json();
};
