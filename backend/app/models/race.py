from typing import List, Optional
from datetime import datetime


class Race:
    def __init__(
        self,
        race_id: str,
        participants: List[str],
        times: List[float],
        date: Optional[datetime] = None,
    ):
        self.race_id = race_id
        self.participants = participants
        self.times = times
        self.date = date or datetime.now()
