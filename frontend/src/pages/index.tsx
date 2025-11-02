import React, { useEffect, useMemo, useState } from "react";
import { fetchRanking, fetchParticipant, updateParticipant, registerParticipant } from "../lib/api";
import styles from "../styles/Home.module.css";

interface Participant {
  al_no?: string;
  family_name?: string | null;
  al_name?: string | null;
  size?: string | null;
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

type ParticipantNameLike =
  | string
  | null
  | undefined
  | {
      family_name?: string | null;
      al_name?: string | null;
    };

const formatParticipantName = (value: ParticipantNameLike) => {
  if (value === null || value === undefined) {
    return "未確認";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? "名前未設定" : trimmed;
  }

  const familyName = value.family_name?.trim() ?? "";
  const alName = value.al_name?.trim() ?? "";
  const displayName = [familyName, alName].filter(Boolean).join(" ");

  return displayName === "" ? "名前未設定" : displayName;
};

const IndexPage: React.FC = () => {
  const SIZE_OPTIONS = ["スタンダード", "ミディアム", "ミニチュア"] as const;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>("");
  const [editAlNo, setEditAlNo] = useState<string | null>(null);
  const [editFamilyName, setEditFamilyName] = useState("");
  const [editAlName, setEditAlName] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editTime, setEditTime] = useState("");
  const [newRecordAlNo, setNewRecordAlNo] = useState("");
  const [newRecordTime, setNewRecordTime] = useState("");
  const [participantNamePreview, setParticipantNamePreview] = useState<string | null>(null);
  const [lookedUpParticipant, setLookedUpParticipant] = useState<Participant | null>(null);
  const [lookupPending, setLookupPending] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [manualFamilyName, setManualFamilyName] = useState("");
  const [manualAlName, setManualAlName] = useState("");
  const [manualSize, setManualSize] = useState("");
  const [isNewParticipant, setIsNewParticipant] = useState(false);

  useEffect(() => {
    fetchRanking()
      .then((data) => {
        const ranking = Array.isArray(data?.ranking) ? data.ranking : [];
        setParticipants(ranking as Participant[]);
      })
      .catch(() => setParticipants([]));
  }, []);

  const rankedParticipants = useMemo(() => {
    const filtered = participants.filter((p) =>
      selectedSizeFilter === "" ? true : (p.size ?? "") === selectedSizeFilter
    );
    return [...filtered].sort((a, b) => {
      const timeA = getComparableTime(a) ?? Number.POSITIVE_INFINITY;
      const timeB = getComparableTime(b) ?? Number.POSITIVE_INFINITY;
      return timeA - timeB;
    });
  }, [participants, selectedSizeFilter]);

  const handleAlNoChange = (value: string) => {
    // 整数のみ許可（非数字は削除）
    const digitsOnly = value.replace(/\D/g, "");
    setNewRecordAlNo(digitsOnly);
    setParticipantNamePreview(null);
    setLookedUpParticipant(null);
    setLookupError(null);
    setSaveError(null);
    setSaveMessage(null);
    setManualFamilyName("");
    setManualAlName("");
    setManualSize("");
    setIsNewParticipant(false);
  };

  const handleTimeChange = (value: string) => {
    setNewRecordTime(value);
    setSaveError(null);
    setSaveMessage(null);
  };

  useEffect(() => {
    let cancelled = false;

    const trimmedAlNo = newRecordAlNo.trim();
    if (!trimmedAlNo) {
      setLookupPending(false);
      setParticipantNamePreview(null);
      setLookupError(null);
      return;
    }

    setLookupPending(true);
    setLookupError(null);

    const handler = setTimeout(async () => {
      try {
        const data = await fetchParticipant(trimmedAlNo);
        if (cancelled) return;
        setLookedUpParticipant(data as Participant);
        setParticipantNamePreview(null); // 文字列では保持しない（オブジェクトを使用）
        setLookupPending(false);
        setIsNewParticipant(false);
        setManualFamilyName("");
        setManualAlName("");
        setManualSize("");
      } catch (error) {
        if (cancelled) return;
        setParticipantNamePreview(null);
        setLookedUpParticipant(null);
        setLookupPending(false);
        setIsNewParticipant(true);
        setLookupError("参加者が見つかりませんでした。新規参加者として追加できます。");
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(handler);
    };
  }, [newRecordAlNo]);

  const handleSubmitRecord = async () => {
    setSaveError(null);

    const trimmedAlNo = newRecordAlNo.trim();
    if (!trimmedAlNo) {
      setLookupError("AL Noを入力してください");
      return;
    }
    if (!/^\d+$/.test(trimmedAlNo)) {
      setLookupError("AL Noは整数のみで入力してください");
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

  const creatingNew = isNewParticipant || !lookedUpParticipant;
  const resolvedFamilyName = creatingNew ? manualFamilyName.trim() : (lookedUpParticipant?.family_name ?? "");
  const resolvedAlName = creatingNew ? manualAlName.trim() : (lookedUpParticipant?.al_name ?? "");
  const resolvedSize = creatingNew ? manualSize.trim() : (lookedUpParticipant?.size ?? "");

    if (creatingNew) {
      if (resolvedFamilyName === "") {
        setSaveError("新規参加者のファミリー名を入力してください");
        return;
      }
      if (resolvedAlName === "") {
        setSaveError("新規参加者のAL名を入力してください");
        return;
      }
      if (resolvedSize === "") {
        setSaveError("新規参加者のサイズを入力してください");
        return;
      }
    }

    const familyNameForRecord = resolvedFamilyName;
    const alNameForRecord = resolvedAlName;
    const displayName = familyNameForRecord + (alNameForRecord ? ` ${alNameForRecord}` : "");

    setIsSavingRecord(true);
    setSaveMessage(null);

    try {
      if (creatingNew) {
        // 先に参加者を登録してから記録を更新
        await registerParticipant({
          al_no: trimmedAlNo,
          family_name: resolvedFamilyName,
          al_name: resolvedAlName,
          size: resolvedSize,
          time: null,
        });
      }

      await updateParticipant({
        al_no: trimmedAlNo,
        family_name: resolvedFamilyName,
        al_name: resolvedAlName,
        size: resolvedSize,
        time: parsedTime,
      });

      setParticipants((prev) => {
        const exists = prev.some((p) => p.al_no === trimmedAlNo);
        if (exists) {
          return prev.map((p) =>
            p.al_no === trimmedAlNo ? { ...p, family_name: resolvedFamilyName, al_name: resolvedAlName, size: resolvedSize, time: parsedTime } : p
          );
        }
        return [...prev, { al_no: trimmedAlNo, family_name: resolvedFamilyName, al_name: resolvedAlName, size: resolvedSize, time: parsedTime }];
      });

      if (editAlNo === trimmedAlNo) {
        setEditAlNo(null);
      }

      setSaveMessage(`${displayName}の記録を${formatTime(parsedTime)}秒で保存しました`);
      setNewRecordAlNo("");
      setNewRecordTime("");
      setParticipantNamePreview(null);
  setLookedUpParticipant(null);
      setLookupError(null);
      setManualFamilyName("");
      setManualAlName("");
      setManualSize("");
      setIsNewParticipant(false);
    } catch (error) {
      setSaveError("記録の保存に失敗しました。通信状況を確認してください。");
    } finally {
      setIsSavingRecord(false);
      setLookupPending(false);
    }
  };

  const handleEdit = (p: Participant) => {
    setEditAlNo(p.al_no ?? null);
    setEditFamilyName(p.family_name ?? "");
    setEditAlName(p.al_name ?? "");
    setEditSize(p.size ?? "");
    const comparableTime = getComparableTime(p);
    setEditTime(comparableTime !== undefined ? comparableTime.toString() : "");
  };

  const handleSave = async () => {
    if (!editAlNo) return;

    const trimmed = editTime.trim();
    const parsedTime = trimmed === "" ? null : Number(trimmed);
    const timeValue = trimmed === "" || Number.isNaN(parsedTime) ? null : parsedTime;
    const updated = participants.map((p) =>
      p.al_no === editAlNo
        ? {
            ...p,
            family_name: editFamilyName,
            al_name: editAlName,
            size: editSize,
            time: timeValue,
          }
        : p
    );

    await updateParticipant({
      al_no: editAlNo,
      family_name: editFamilyName,
      al_name: editAlName,
      size: editSize,
      time: timeValue,
    });

    setParticipants(updated);
    setEditAlNo(null);
  };

  const participantCount = rankedParticipants.length;
  const bestTime = rankedParticipants.length > 0 ? getComparableTime(rankedParticipants[0]) : undefined;
  const leaderboardCaption = bestTime === undefined ? "まだ記録がありません" : `現在のベストは ${formatTime(bestTime)} 秒`;

  const exportAllSizesToExcel = () => {
    if (selectedSizeFilter !== "") return; // "すべてのサイズ"のときのみ実行
    const headers = ["Al No", "ファミリー名", "AL名", "サイズ", "タイム (秒)"] as const;
    const rows = rankedParticipants.map((p) => [
      p.al_no ?? "",
      p.family_name ?? "",
      p.al_name ?? "",
      p.size ?? "",
      p.time ?? "",
    ]);
    const escapeCSV = (v: unknown) => {
      const s = (v ?? "").toString();
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers as unknown as string[], ...rows]
      .map((r) => r.map(escapeCSV).join(","))
      .join("\r\n");
    const bom = "\uFEFF"; // ExcelでUTF-8を正しく解釈させるためのBOM
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const pad = (n: number) => String(n).padStart(2, "0");
    const d = new Date();
    a.href = url;
    a.download = `leaderboard_all_sizes_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const canSubmit =
    !isSavingRecord &&
    !lookupPending &&
    newRecordAlNo.trim() !== "" &&
    newRecordTime.trim() !== "" &&
    (isNewParticipant
      ? manualFamilyName.trim() !== "" && manualAlName.trim() !== "" && manualSize.trim() !== ""
      : lookedUpParticipant !== null);
  const isSubmitDisabled = !canSubmit;
  const participantDisplayName = lookupPending
    ? "検索中..."
    : isNewParticipant
    ? ([manualFamilyName.trim(), manualAlName.trim()].filter(Boolean).join(" ") || "新規参加者")
    : formatParticipantName(lookedUpParticipant as any);

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
                AL No とタイム（秒）を入力して OK を押すと、参加者の順位が更新されます。
              </p>
            </div>

            <div className={styles.measureBody}>
              <div className={styles.measureInputs}>
                <div className={styles.measureInputRow}>
                  <input
                    className={`${styles.inlineInput} ${styles.measureIdInput}`}
                    value={newRecordAlNo}
                    onChange={(e) => handleAlNoChange(e.target.value)}
                    placeholder="Al Noを入力"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
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
                {isNewParticipant && (
                  <>
                    <div className={styles.measureInputRow}>
                      <input
                        className={styles.inlineInput}
                        value={manualFamilyName}
                        onChange={(e) => setManualFamilyName(e.target.value)}
                        placeholder="ファミリー名を入力 (必須)"
                        maxLength={40}
                      />
                    </div>
                    <div className={styles.measureInputRow}>
                      <input
                        className={styles.inlineInput}
                        value={manualAlName}
                        onChange={(e) => setManualAlName(e.target.value)}
                        placeholder="AL名を入力 (必須)"
                        maxLength={40}
                      />
                    </div>
                    <div className={styles.measureInputRow}>
                      <select
                        className={styles.inlineInput}
                        value={manualSize}
                        onChange={(e) => setManualSize(e.target.value)}
                      >
                        <option value="">サイズを選択 (必須)</option>
                        {SIZE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div className={styles.measureNamePlate}>
                  <span className={styles.measureNameLabel}>PARTICIPANT</span>
                  <span className={styles.measureNameValue}>
                    {participantDisplayName}
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
                <p
                  className={`${styles.measureStatus} ${
                    isNewParticipant ? styles.measureStatusInfo : styles.measureStatusError
                  }`}
                >
                  {lookupError}
                </p>
              )}
              {saveError && (
                <p className={`${styles.measureStatus} ${styles.measureStatusError}`}>{saveError}</p>
              )}
              {!saveMessage &&
                !lookupPending &&
                newRecordAlNo.trim() !== "" &&
                ((
                  isNewParticipant &&
                  manualFamilyName.trim() !== "" &&
                  manualAlName.trim() !== "" &&
                  manualSize.trim() !== ""
                ) || (!isNewParticipant && lookedUpParticipant !== null)) && (
                  <p className={`${styles.measureStatus} ${styles.measureStatusInfo}`}>
                    {isNewParticipant
                      ? `${[manualFamilyName.trim(), manualAlName.trim()].filter(Boolean).join(" ")}（サイズ: ${manualSize.trim()}） を新規参加者として登録できます。`
                      : `${formatParticipantName(lookedUpParticipant as any)} の記録を登録できます。`}
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
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <select
                className={styles.inlineInput}
                value={selectedSizeFilter}
                onChange={(e) => setSelectedSizeFilter(e.target.value)}
                aria-label="サイズで絞り込み"
              >
                <option value="">すべてのサイズ</option>
                {SIZE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <button
                className={`${styles.button} ${styles.buttonGhost} ${styles.exportButton}`}
                type="button"
                onClick={exportAllSizesToExcel}
                disabled={selectedSizeFilter !== "" || rankedParticipants.length === 0}
                title={selectedSizeFilter === "" ? "一覧をExcelで開けるCSVに出力" : "すべてのサイズのときのみ出力できます"}
              >
                Excel出力
              </button>
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
                    <th>Al No</th>
                    <th>ファミリー名</th>
                    <th>AL名</th>
                    <th>サイズ</th>
                    <th>タイム (秒)</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedParticipants.map((p, index) => (
                    <tr key={p.al_no} className={styles.tableRow}>
                      <td className={styles.rankCell} data-label="順位">
                        <span className={styles.rankBadge}>{String(index + 1).padStart(2, "0")}</span>
                      </td>
                      <td data-label="Al No">{p.al_no }</td>
                      <td className={styles.nameCell} data-label="ファミリー名">
                        {editAlNo === p.al_no ? (
                          <input
                            className={styles.inlineInput}
                            value={editFamilyName}
                            onChange={(e) => setEditFamilyName(e.target.value)}
                          />
                        ) : (
                          p.family_name ?? "-"
                        )}
                      </td>
                      <td className={styles.alNameCell} data-label="AL名">
                        {editAlNo === p.al_no ? (
                          <input
                            className={styles.inlineInput}
                            value={editAlName}
                            onChange={(e) => setEditAlName(e.target.value)}
                          />
                        ) : (
                          p.al_name ?? "-"
                        )}
                      </td>
                      <td className={styles.sizeCell} data-label="サイズ">
                        {editAlNo === p.al_no ? (
                          <select
                            className={styles.inlineInput}
                            value={SIZE_OPTIONS.includes((editSize || "") as any) ? editSize : ""}
                            onChange={(e) => setEditSize(e.target.value)}
                          >
                            <option value="">サイズを選択</option>
                            {SIZE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          p.size ?? "-"
                        )}
                      </td>
                      <td className={styles.timeCell} data-label="タイム (秒)">
                        {editAlNo === p.al_no ? (
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
                          {editAlNo === p.al_no ? (
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
