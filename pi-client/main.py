from __future__ import annotations

from api import check_health, send_turn
from audio import play_audio_stub, record_stub_wav
from button import wait_for_button_press
from config import load_config
from state import PiState
from ui import render_state


def main() -> None:
    config = load_config()

    render_state(PiState.IDLE, "TeachBox ready")
    health = check_health(config)
    print(f"[health] {health}")

    while True:
        wait_for_button_press()

        try:
            render_state(PiState.LISTENING, "Recording question")
            audio_path = record_stub_wav(config.audio_path)

            render_state(PiState.THINKING, "Sending to backend")
            result = send_turn(
                config,
                audio_path=audio_path,
                transcript_override="Why does the moon follow me?",
            )

            next_state = (
                PiState.BLOCKED if result["assistant"]["blocked"] else PiState.SPEAKING
            )
            render_state(next_state, result["assistant"]["text"])

            audio = result.get("audio")
            if audio and audio.get("url"):
                play_audio_stub(f"{config.backend_url}{audio['url']}")

            render_state(PiState.IDLE, "Tap the button to talk to TeachBox.")
        except Exception as exc:
            render_state(PiState.ERROR, str(exc))


if __name__ == "__main__":
    main()
