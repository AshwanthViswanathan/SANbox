from __future__ import annotations

from state import PiState


def render_state(state: PiState, subtitle: str = "") -> None:
    print(f"[ui] state={state.value} subtitle={subtitle}")
