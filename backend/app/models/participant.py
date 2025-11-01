from typing import Optional


class Participant:
    def __init__(
        self,
        al_no: str,
        family_name: str,
        al_name: str,
        size: str,
        time: Optional[float] = None,
    ):
        self.al_no = al_no
        self.family_name = family_name
        self.al_name = al_name
        self.size = size
        self.time = time
