from pydantic import BaseModel
from typing import Optional


class ParticipantSchema(BaseModel):
    al_no: str
    family_name: str
    al_name: str
    size: str
    time: Optional[float] = None
