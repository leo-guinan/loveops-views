import React from "react";
import { UserHome } from "../pages/UserHome";

type Props = {
  userId: string;
  onMatchSelect: (matchId: string) => void;
};

export const Screen12Dashboard: React.FC<Props> = ({ userId, onMatchSelect }) => {
  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <UserHome userId={userId} onMatchSelect={onMatchSelect} />
    </div>
  );
};

