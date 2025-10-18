from typing import Optional


class Participant:
    def __init__(
        self,
        id: str,
        name: str,
        time: Optional[float] = None,
    ):
        self.id = id
        self.name = name
        self.time = time
