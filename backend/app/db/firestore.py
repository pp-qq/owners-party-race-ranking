from google.cloud import firestore
from typing import Any, Dict, List, Optional


class FirestoreDB:
    def __init__(self):
        self.client = firestore.Client()

    # 参加者取得
    def get_participant(self, participant_id: str) -> Optional[Dict[str, Any]]:
        doc = self.client.collection("participants").document(participant_id).get()
        if doc.exists:
            return doc.to_dict()
        return None

    # 参加者新規登録
    def create_participant(self, data: Dict[str, Any]) -> None:
        self.client.collection("participants").document(data["id"]).set(data)

    # 参加者記録更新
    def update_participant(self, participant_id: str, data: Dict[str, Any]) -> None:
        self.client.collection("participants").document(participant_id).update(data)

    # ランキング取得
    def get_ranking(self) -> List[Dict[str, Any]]:
        docs = self.client.collection("participants").order_by("time").stream()
        return [doc.to_dict() for doc in docs]
