import React from "react";

interface Participant {
  al_no: string;
  family_name: string;
  al_name: string;
  size: string;
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
        <th>AL No</th>
        <th>Family Name</th>
        <th>AL Name</th>
        <th>Size</th>
        <th>Time</th>
        <th>Rank</th>
      </tr>
    </thead>
    <tbody>
      {participants.map((p) => (
        <tr key={p.al_no}>
          <td>{p.al_no}</td>
          <td>{p.family_name}</td>
          <td>{p.al_name}</td>
          <td>{p.size}</td>
          <td>{p.time ?? "-"}</td>
          <td>{p.rank}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default RankingTable;
