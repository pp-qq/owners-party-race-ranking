import React, { useState, useRef } from "react";

const Timer: React.FC = () => {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    if (!running) {
      setRunning(true);
      intervalRef.current = setInterval(() => {
        setTime((prev) => prev + 0.01);
      }, 10);
    }
  };

  const stop = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const reset = () => {
    setTime(0);
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <div>
      <h2>タイマー</h2>
      <div style={{ fontSize: 32 }}>{time.toFixed(2)} 秒</div>
      <button onClick={start} disabled={running}>スタート</button>
      <button onClick={stop} disabled={!running}>ストップ</button>
      <button onClick={reset}>リセット</button>
    </div>
  );
};

export default Timer;
