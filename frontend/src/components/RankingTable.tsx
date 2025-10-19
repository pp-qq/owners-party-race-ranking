import React from "react";

interface Participant {
  id: string;
  name: string;
  time?: number | null;
  rank?: number;
}

interface Props {
  participants: Participant[];
}

const RankingTable: React.FC<Props> = ({ participants }) => (
  <table border={1} cellPadding={8} style={{ width: "100%", marginBottom: 32 }}>
    <thead>
      <tr>
        <th>ID</th>
        <th>名前</th>
        <th>タイム</th>
        <th>順位</th>
      </tr>
    </thead>
    <tbody>
      {participants.map((p) => (
        <tr key={p.id}>
          <td>{p.id}</td>
          <td>{p.name}</td>
          <td>{p.time ?? "-"}</td>
          <td>{p.rank}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default RankingTable;
