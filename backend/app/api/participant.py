from fastapi import APIRouter, HTTPException

from ..db.firestore import FirestoreDB
from ..schemas.participant import ParticipantSchema

router = APIRouter()
db = FirestoreDB()


@router.post("/participant")
def register_participant(participant: ParticipantSchema):
    if db.get_participant(participant.al_no):
        raise HTTPException(status_code=400, detail="Participant already exists")
    db.create_participant(participant.dict())
    return {"result": "ok"}


@router.get("/participant/{al_no}")
def get_participant(al_no: str):
    data = db.get_participant(al_no)
    if not data:
        raise HTTPException(status_code=404, detail="Participant not found")
    return data
