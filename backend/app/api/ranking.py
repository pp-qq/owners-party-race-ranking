from fastapi import APIRouter
from ..db.firestore import FirestoreDB

router = APIRouter()
db = FirestoreDB()


@router.get("/ranking")
def get_ranking():
    ranking = db.get_ranking()
    return {"ranking": ranking}
