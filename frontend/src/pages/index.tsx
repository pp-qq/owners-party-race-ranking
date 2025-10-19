import React, { useEffect, useMemo, useState } from "react";
import { fetchRanking, fetchParticipant, updateParticipant } from "../lib/api";
import Timer from "../components/Timer";
import styles from "../styles/Home.module.css";

interface Participant {
  id: string;
  name: string;
  time?: number | null;
}

const getComparableTime = (participant: Participant) => {
  if (participant.time === null || participant.time === undefined) {
    return undefined;
  }
  return participant.time;
};

const formatTime = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return "-";
  }
  return value.toFixed(2);
};

const formatParticipantName = (name: string | null) => {
  if (name === null) {
    return "未確認";
  }
  if (name.trim() === "") {
    return "名前未設定";
  }
  return name;
};

const IndexPage: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTime, setEditTime] = useState("");
  const [timerResetKey, setTimerResetKey] = useState(0);
  const [capturedTime, setCapturedTime] = useState<number | null>(null);
  const [participantIdInput, setParticipantIdInput] = useState("");
  const [participantNamePreview, setParticipantNamePreview] = useState<string | null>(null);
  const [lookupPending, setLookupPending] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSavingRun, setIsSavingRun] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchRanking()
      .then((data) => {
        const ranking = Array.isArray(data?.ranking) ? data.ranking : [];
        setParticipants(ranking as Participant[]);
      })
      .catch(() => setParticipants([]));
  }, []);

  const rankedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => {
      const timeA = getComparableTime(a) ?? Number.POSITIVE_INFINITY;
      const timeB = getComparableTime(b) ?? Number.POSITIVE_INFINITY;
      return timeA - timeB;
    });
  }, [participants]);

  const handleTimerStart = () => {
    setCapturedTime(null);
    setParticipantIdInput("");
    setParticipantNamePreview(null);
    setLookupPending(false);
    setLookupError(null);
    setSaveMessage(null);
    setSaveError(null);
  };

  const handleTimerStop = (elapsed: number) => {
    setCapturedTime(elapsed);
    setSaveError(null);
  };

  const handleParticipantIdChange = (value: string) => {
    setParticipantIdInput(value);
    setParticipantNamePreview(null);
    setLookupError(null);
    setSaveError(null);
    setSaveMessage(null);
  };

  useEffect(() => {
    let cancelled = false;

    if (capturedTime === null) {
      setLookupPending(false);
      setParticipantNamePreview(null);
      setLookupError(null);
      return;
    }

    const trimmedId = participantIdInput.trim();
    if (!trimmedId) {
      setLookupPending(false);
      setParticipantNamePreview(null);
      setLookupError(null);
      return;
    }

    setLookupPending(true);
    setLookupError(null);

    const handler = setTimeout(async () => {
      try {
        const data = await fetchParticipant(trimmedId);
        if (cancelled) return;
        setParticipantNamePreview(typeof data.name === "string" ? data.name : "");
        setLookupPending(false);
      } catch (error) {
        if (cancelled) return;
        setParticipantNamePreview(null);
        setLookupPending(false);
        setLookupError("参加者が見つかりませんでした");
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(handler);
    };
  }, [participantIdInput, capturedTime]);

  const handleConfirmRun = async () => {
    setSaveError(null);

    if (capturedTime === null) {
      setSaveError("タイマーで計測を完了してください");
      return;
    }

    const trimmedId = participantIdInput.trim();
    if (!trimmedId) {
      setLookupError("参加者IDを入力してください");
      return;
    }

    if (participantNamePreview === null) {
      setLookupError("ID確認を行ってください");
      return;
    }

    const recordedTime = capturedTime;
    const participantName = participantNamePreview;
    const safeName = participantName.trim() === "" ? "" : participantName;

    setIsSavingRun(true);
    setSaveMessage(null);

    try {
      await updateParticipant({
        id: trimmedId,
        name: safeName,
        time: recordedTime,
      });

      setParticipants((prev) => {
        const exists = prev.some((p) => p.id === trimmedId);
        if (exists) {
          return prev.map((p) =>
            p.id === trimmedId ? { ...p, name: participantName, time: recordedTime } : p
          );
        }
        return [...prev, { id: trimmedId, name: participantName, time: recordedTime }];
      });

      if (editId === trimmedId) {
        setEditId(null);
      }

      const displayName = participantName.trim() === "" ? "名前未設定" : participantName;
      setSaveMessage(`${displayName}の記録を${formatTime(recordedTime)}秒で保存しました`);
      setCapturedTime(null);
      setParticipantIdInput("");
      setParticipantNamePreview(null);
      setLookupError(null);
      setLookupPending(false);
      setTimerResetKey((key) => key + 1);
    } catch (error) {
      setSaveError("記録の保存に失敗しました。通信状況を確認してください。");
    } finally {
      setIsSavingRun(false);
    }
  };

  const handleTimerReset = () => {
    setCapturedTime(null);
    setParticipantIdInput("");
    setParticipantNamePreview(null);
    setLookupPending(false);
    setLookupError(null);
    setSaveError(null);
    setSaveMessage(null);
    setIsSavingRun(false);
  };

  const handleEdit = (p: Participant) => {
    setEditId(p.id);
    setEditName(p.name);
    const comparableTime = getComparableTime(p);
    setEditTime(comparableTime !== undefined ? comparableTime.toString() : "");
  };

  const handleSave = async () => {
    if (!editId) return;

    const trimmed = editTime.trim();
    const parsedTime = trimmed === "" ? null : Number(trimmed);
    const timeValue = trimmed === "" || Number.isNaN(parsedTime) ? null : parsedTime;
    const updated = participants.map((p) =>
      p.id === editId
        ? {
            ...p,
            name: editName,
            time: timeValue,
          }
        : p
    );

    await updateParticipant({
      id: editId,
      name: editName,
      time: timeValue,
    });

    setParticipants(updated);
    setEditId(null);
  };

  const participantCount = participants.length;
  const bestTime = rankedParticipants.length > 0 ? getComparableTime(rankedParticipants[0]) : undefined;
  const leaderboardCaption = bestTime === undefined ? "まだ記録がありません" : `現在のベストは ${formatTime(bestTime)} 秒`;

  return (
    <div className={styles.page}>
      <main className={styles.content}>
        <section className={styles.hero}>
          <span className={styles.heroBadge}>Owners Meeting</span>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroHighlight}>Race Ranking</span>
          </h1>
          <p className={styles.heroDescription}>
            Australian Labradoodle Owner's Meeting
          </p>
        </section>

        <section className={styles.statusRow}>
          <div className={styles.timerCard}>
            <span className={styles.timerLabel}>Live Timer</span>
            <Timer
              onStart={handleTimerStart}
              onStop={handleTimerStop}
              onReset={handleTimerReset}
              externalResetKey={timerResetKey}
            />
          </div>

          <div className={styles.measureCard}>
            <div className={styles.measureHeader}>
              <h2 className={styles.measureTitle}>計測した記録を登録</h2>
              <p className={styles.measureSubtitle}>
                タイマーで計測したあとに参加者IDを入力すると、自動で参加者名を確認できます。
              </p>
            </div>

            <div className={styles.measureBody}>
              {capturedTime === null ? (
                <div className={styles.measurePlaceholder}>
                  スタート → ストップで計測を完了すると、ここに記録登録フォームが表示されます。
                </div>
              ) : (
                <>
                  <div className={styles.measureTime}>
                    <span className={styles.measureTimeLabel}>RECORDED TIME</span>
                    <span className={styles.measureTimeValue}>{formatTime(capturedTime)}秒</span>
                  </div>
                  <div className={styles.measureInputs}>
                    <div className={styles.measureInputRow}>
                      <input
                        className={`${styles.inlineInput} ${styles.measureIdInput}`}
                        value={participantIdInput}
                        onChange={(e) => handleParticipantIdChange(e.target.value)}
                        placeholder="参加者IDを入力"
                        autoFocus
                      />
                    </div>
                    <div className={styles.measureNamePlate}>
                      <span className={styles.measureNameLabel}>PARTICIPANT</span>
                      <span className={styles.measureNameValue}>
                        {lookupPending ? "検索中..." : formatParticipantName(participantNamePreview)}
                      </span>
                    </div>
                    <div className={styles.measureActions}>
                      <button
                        className={`${styles.button} ${styles.buttonPrimary}`}
                        onClick={handleConfirmRun}
                        disabled={
                          isSavingRun ||
                          lookupPending ||
                          capturedTime === null ||
                          participantNamePreview === null
                        }
                      >
                        {isSavingRun ? "登録中..." : "記録する"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {lookupError && (
                <p className={`${styles.measureStatus} ${styles.measureStatusError}`}>{lookupError}</p>
              )}
              {saveError && (
                <p className={`${styles.measureStatus} ${styles.measureStatusError}`}>{saveError}</p>
              )}
              {!saveMessage &&
                !lookupError &&
                participantNamePreview !== null &&
                capturedTime !== null &&
                !lookupPending && (
                  <p className={`${styles.measureStatus} ${styles.measureStatusInfo}`}>
                    {formatParticipantName(participantNamePreview)} の記録を登録できます。
                  </p>
                )}
              {saveMessage && (
                <p className={`${styles.measureStatus} ${styles.measureStatusSuccess}`}>{saveMessage}</p>
              )}
            </div>
          </div>
        </section>

        <section className={styles.leaderboardCard}>
          <header className={styles.cardHeader}>
            <div className={styles.cardTitleGroup}>
              <h2 className={styles.cardTitle}>Leaderboard</h2>
              <p className={styles.cardSubtitle}>{leaderboardCaption}</p>
            </div>
            <span className={styles.participantBadge}>
              <strong>{participantCount}</strong> エントリー
            </span>
          </header>

          {rankedParticipants.length === 0 ? (
            <div className={styles.emptyState}>まだ参加者が登録されていません</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>順位</th>
                    <th>ID</th>
                    <th>名前</th>
                    <th>タイム (秒)</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedParticipants.map((p, index) => (
                    <tr key={p.id}>
                      <td className={styles.rankCell}>
                        <span className={styles.rankBadge}>{String(index + 1).padStart(2, "0")}</span>
                      </td>
                      <td>{p.id}</td>
                      <td className={styles.nameCell}>
                        {editId === p.id ? (
                          <input
                            className={styles.inlineInput}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          p.name
                        )}
                      </td>
                      <td className={styles.timeCell}>
                        {editId === p.id ? (
                          <input
                            className={styles.inlineInput}
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="--"
                          />
                        ) : (
                          formatTime(getComparableTime(p))
                        )}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {editId === p.id ? (
                            <button className={`${styles.button} ${styles.buttonGhost}`} onClick={handleSave}>
                              保存
                            </button>
                          ) : (
                            <button
                              className={`${styles.button} ${styles.buttonGhost}`}
                              onClick={() => handleEdit(p)}
                            >
                              編集
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default IndexPage;
