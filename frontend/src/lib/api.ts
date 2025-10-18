const API_BASE = "http://localhost:8000";

export const fetchRanking = async () => {
  const res = await fetch(`${API_BASE}/ranking`);
  return await res.json();
};

export const updateParticipant = async (participant: any) => {
  await fetch(`${API_BASE}/record`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(participant),
  });
};
