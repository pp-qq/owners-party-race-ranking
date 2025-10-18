from fastapi import APIRouter, HTTPException

from ..db.firestore import FirestoreDB
from ..schemas.participant import ParticipantSchema

router = APIRouter()
db = FirestoreDB()


@router.post("/record")
def post_record(participant: ParticipantSchema):
    if not db.get_participant(participant.id):
        raise HTTPException(status_code=404, detail="Participant not found")
    db.update_participant(participant.id, participant.dict())
    return {"result": "ok"}
