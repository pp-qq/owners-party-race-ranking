import React, { useEffect, useMemo, useState } from "react";
import { fetchRanking, fetchParticipant, updateParticipant } from "../lib/api";
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
  const [newRecordId, setNewRecordId] = useState("");
  const [newRecordTime, setNewRecordTime] = useState("");
  const [participantNamePreview, setParticipantNamePreview] = useState<string | null>(null);
  const [lookupPending, setLookupPending] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSavingRecord, setIsSavingRecord] = useState(false);
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

  const handleIdChange = (value: string) => {
    setNewRecordId(value);
    setParticipantNamePreview(null);
    setLookupError(null);
    setSaveError(null);
    setSaveMessage(null);
  };

  const handleTimeChange = (value: string) => {
    setNewRecordTime(value);
    setSaveError(null);
    setSaveMessage(null);
  };

  useEffect(() => {
    let cancelled = false;

    const trimmedId = newRecordId.trim();
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
  }, [newRecordId]);

  const handleSubmitRecord = async () => {
    setSaveError(null);

    const trimmedId = newRecordId.trim();
    if (!trimmedId) {
      setLookupError("参加者IDを入力してください");
      return;
    }

    const trimmedTime = newRecordTime.trim();
    if (!trimmedTime) {
      setSaveError("タイムを入力してください");
      return;
    }

    const parsedTime = Number(trimmedTime);
    if (Number.isNaN(parsedTime) || parsedTime < 0) {
      setSaveError("タイムは0以上の数値で入力してください");
      return;
    }

    if (participantNamePreview === null) {
      setLookupError("参加者が見つかりませんでした");
      return;
    }

    const nameForRecord = participantNamePreview ?? "";
    const displayName = formatParticipantName(nameForRecord);

    setIsSavingRecord(true);
    setSaveMessage(null);

    try {
      await updateParticipant({
        id: trimmedId,
        name: nameForRecord,
        time: parsedTime,
      });

      setParticipants((prev) => {
        const exists = prev.some((p) => p.id === trimmedId);
        if (exists) {
          return prev.map((p) =>
            p.id === trimmedId ? { ...p, name: nameForRecord, time: parsedTime } : p
          );
        }
        return [...prev, { id: trimmedId, name: nameForRecord, time: parsedTime }];
      });

      if (editId === trimmedId) {
        setEditId(null);
      }

      setSaveMessage(`${displayName}の記録を${formatTime(parsedTime)}秒で保存しました`);
      setNewRecordId("");
      setNewRecordTime("");
      setParticipantNamePreview(null);
      setLookupError(null);
    } catch (error) {
      setSaveError("記録の保存に失敗しました。通信状況を確認してください。");
    } finally {
      setIsSavingRecord(false);
      setLookupPending(false);
    }
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
  const isSubmitDisabled =
    isSavingRecord ||
    lookupPending ||
    participantNamePreview === null ||
    newRecordId.trim() === "" ||
    newRecordTime.trim() === "";

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
          <div className={styles.measureCard}>
            <div className={styles.measureHeader}>
              <h2 className={styles.measureTitle}>記録を登録</h2>
              <p className={styles.measureSubtitle}>
                ID とタイム（秒）を入力して OK を押すと、参加者の順位が更新されます。
              </p>
            </div>

            <div className={styles.measureBody}>
              <div className={styles.measureInputs}>
                <div className={styles.measureInputRow}>
                  <input
                    className={`${styles.inlineInput} ${styles.measureIdInput}`}
                    value={newRecordId}
                    onChange={(e) => handleIdChange(e.target.value)}
                    placeholder="参加者IDを入力"
                    autoFocus
                  />
                </div>
                <div className={styles.measureInputRow}>
                  <input
                    className={styles.inlineInput}
                    value={newRecordTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    placeholder="タイムを秒単位で入力"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
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
                    onClick={handleSubmitRecord}
                    disabled={isSubmitDisabled}
                    type="button"
                  >
                    {isSavingRecord ? "登録中..." : "OK"}
                  </button>
                </div>
              </div>

              {lookupError && (
                <p className={`${styles.measureStatus} ${styles.measureStatusError}`}>{lookupError}</p>
              )}
              {saveError && (
                <p className={`${styles.measureStatus} ${styles.measureStatusError}`}>{saveError}</p>
              )}
              {!saveMessage &&
                !lookupError &&
                participantNamePreview !== null &&
                newRecordId.trim() !== "" &&
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
                    <tr key={p.id} className={styles.tableRow}>
                      <td className={styles.rankCell} data-label="順位">
                        <span className={styles.rankBadge}>{String(index + 1).padStart(2, "0")}</span>
                      </td>
                      <td data-label="ID">{p.id}</td>
                      <td className={styles.nameCell} data-label="名前">
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
                      <td className={styles.timeCell} data-label="タイム (秒)">
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
                      <td data-label="操作">
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
