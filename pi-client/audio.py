from __future__ import annotations

import math
import os
import wave
from pathlib import Path


def record_stub_wav(path: str, duration_seconds: float = 1.0) -> str:
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)

    sample_rate = 16000
    amplitude = 8000
    frequency = 440
    frame_count = int(sample_rate * duration_seconds)

    with wave.open(str(output), "wb") as wav_file:
      wav_file.setnchannels(1)
      wav_file.setsampwidth(2)
      wav_file.setframerate(sample_rate)

      frames = bytearray()
      for sample_index in range(frame_count):
          sample = int(amplitude * math.sin(2 * math.pi * frequency * sample_index / sample_rate))
          frames.extend(sample.to_bytes(2, byteorder="little", signed=True))

      wav_file.writeframes(bytes(frames))

    return str(output)


def play_audio_stub(path_or_url: str) -> None:
    print(f"[audio] would play: {path_or_url}")
