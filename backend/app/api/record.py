from fastapi import APIRouter, HTTPException

from ..db.firestore import FirestoreDB
from ..schemas.participant import ParticipantSchema

router = APIRouter()
db = FirestoreDB()


@router.post("/record")
def post_record(participant: ParticipantSchema):
    if not db.get_participant(participant.al_no):
        raise HTTPException(status_code=404, detail="Participant not found")
    db.update_participant(participant.al_no, participant.dict())
    return {"result": "ok"}
