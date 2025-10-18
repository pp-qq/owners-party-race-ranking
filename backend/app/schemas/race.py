from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class RaceSchema(BaseModel):
    race_id: str
    participants: List[str]
    times: List[float]
    date: Optional[datetime] = None
