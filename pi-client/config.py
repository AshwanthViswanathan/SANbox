from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    backend_url: str
    device_token: str
    device_id: str
    session_id: str
    mode: str
    lesson_id: str | None
    audio_path: str


def load_config() -> Config:
    backend_url = os.getenv("TEACHBOX_BACKEND_URL", "http://127.0.0.1:3000")
    device_token = os.getenv("TEACHBOX_DEVICE_TOKEN", "dev-token-change-me")
    device_id = os.getenv("TEACHBOX_DEVICE_ID", "pi_01")
    session_id = os.getenv("TEACHBOX_SESSION_ID", "sess_local_demo")
    mode = os.getenv("TEACHBOX_MODE", "free_chat")
    lesson_id = os.getenv("TEACHBOX_LESSON_ID") or None
    audio_path = os.getenv("TEACHBOX_AUDIO_PATH", "pi-client/tmp-input.wav")

    return Config(
        backend_url=backend_url.rstrip("/"),
        device_token=device_token,
        device_id=device_id,
        session_id=session_id,
        mode=mode,
        lesson_id=lesson_id,
        audio_path=audio_path,
    )
