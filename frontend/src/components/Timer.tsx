import React, { useState, useRef, useEffect } from "react";
import styles from "./Timer.module.css";

interface TimerProps {
  onStart?: () => void;
  onStop?: (elapsed: number) => void;
  onReset?: () => void;
  externalResetKey?: number;
}

const Timer: React.FC<TimerProps> = ({ onStart, onStop, onReset, externalResetKey }) => {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef(0);

  const clearTicker = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetInternal = () => {
    clearTicker();
    timeRef.current = 0;
    setTime(0);
    setRunning(false);
  };

  useEffect(() => () => clearTicker(), []);

  useEffect(() => {
    if (externalResetKey === undefined) return;
    resetInternal();
  }, [externalResetKey]);

  const start = () => {
    if (running) return;
    resetInternal();
    setRunning(true);
    onStart?.();
    intervalRef.current = setInterval(() => {
      setTime((prev) => {
        const next = prev + 0.01;
        timeRef.current = next;
        return next;
      });
    }, 10);
  };

  const stop = () => {
    if (!running) return;
    clearTicker();
    setRunning(false);
    const finalTime = Number(timeRef.current.toFixed(2));
    onStop?.(finalTime);
  };

  const reset = () => {
    resetInternal();
    onReset?.();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.readout}>{time.toFixed(2)}<span className={styles.unit}>s</span></div>
      <div className={styles.controls}>
        <button
          className={`${styles.button} ${styles.primary}`}
          onClick={start}
          disabled={running}
        >
          スタート
        </button>
        <button
          className={`${styles.button} ${styles.neutral}`}
          onClick={stop}
          disabled={!running}
        >
          ストップ
        </button>
        <button className={`${styles.button} ${styles.ghost}`} onClick={reset}>リセット</button>
      </div>
    </div>
  );
};

export default Timer;
