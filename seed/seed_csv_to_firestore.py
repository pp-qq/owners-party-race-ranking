import csv
from google.cloud import firestore

CSV_PATH = "../seed/member_list.csv"
COLLECTION = "participants"

# Firestoreクライアント初期化
# GOOGLE_APPLICATION_CREDENTIALS 環境変数で認証JSONを指定しておくこと
client = firestore.Client(project="owners-party-race-ranking")


def csv_time_to_float(time_str):
    # "00:00.00" → 0.0 などに変換（必要に応じて拡張）
    try:
        m, s = time_str.split(":")
        sec, ms = s.split(".")
        return int(m) * 60 + int(sec) + int(ms) / 100
    except Exception:
        return 0.0


def main():
    with open(CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            doc_id = row["id"]
            data = {
                "id": row["id"],
                "name": row["name"],
                "times": [],
                "best_time": csv_time_to_float(row["time"]),
                "rank": None,
            }
            client.collection(COLLECTION).document(doc_id).set(data)
            print(f"Seeded: {doc_id} {data['name']}")


if __name__ == "__main__":
    main()
