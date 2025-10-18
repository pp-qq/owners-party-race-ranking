from pydantic import BaseModel
from typing import Optional


class ParticipantSchema(BaseModel):
    id: str
    name: str
    time: Optional[float] = None
