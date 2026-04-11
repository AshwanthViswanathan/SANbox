from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from urllib import error, request

from config import Config


def send_turn(config: Config, audio_path: str, transcript_override: str | None = None) -> dict[str, Any]:
    boundary = "teachbox-boundary"
    audio_bytes = Path(audio_path).read_bytes()

    fields: list[bytes] = [
        _form_field(boundary, "device_id", config.device_id),
        _form_field(boundary, "session_id", config.session_id),
        _form_field(boundary, "mode", config.mode),
    ]

    if config.lesson_id:
        fields.append(_form_field(boundary, "lesson_id", config.lesson_id))

    if transcript_override:
        fields.append(_form_field(boundary, "transcript_override", transcript_override))

    fields.append(
        _file_field(
            boundary,
            field_name="audio",
            filename=Path(audio_path).name,
            content_type="audio/wav",
            content=audio_bytes,
        )
    )
    fields.append(f"--{boundary}--\r\n".encode())

    body = b"".join(fields)
    req = request.Request(
        url=f"{config.backend_url}/api/v1/session/turn",
        method="POST",
        data=body,
        headers={
            "Authorization": f"Bearer {config.device_token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Content-Length": str(len(body)),
        },
    )

    with request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))


def check_health(config: Config) -> dict[str, Any]:
    req = request.Request(url=f"{config.backend_url}/api/v1/health", method="GET")
    with request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))


def _form_field(boundary: str, name: str, value: str) -> bytes:
    return (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
        f"{value}\r\n"
    ).encode()


def _file_field(boundary: str, field_name: str, filename: str, content_type: str, content: bytes) -> bytes:
    header = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'
        f"Content-Type: {content_type}\r\n\r\n"
    ).encode()
    return header + content + b"\r\n"
