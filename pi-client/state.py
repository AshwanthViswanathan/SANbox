from __future__ import annotations

from enum import Enum


class PiState(str, Enum):
    IDLE = "idle"
    LISTENING = "listening"
    THINKING = "thinking"
    SPEAKING = "speaking"
    BLOCKED = "blocked"
    ERROR = "error"
