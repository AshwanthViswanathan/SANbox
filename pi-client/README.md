# TeachBox Pi Client

Thin Raspberry Pi client responsibilities:

- button-to-talk input
- audio capture
- audio playback
- simple Cosmo state rendering
- API calls to `/api/v1/session/turn`

Recommended files:

- `main.py`
- `audio.py`
- `button.py`
- `api.py`
- `ui.py`
- `state.py`

## Local Demo Loop

Use the Python skeleton to prove the backend contract before wiring real hardware.

Example:

```bash
cd pi-client
TEACHBOX_BACKEND_URL=http://127.0.0.1:3000 python3 main.py
```

Defaults:

- simulates button press via Enter
- records a stub wav file
- calls `POST /api/v1/session/turn`
- uses `transcript_override` for fast integration
- prints UI/audio actions instead of touching GPIO or speakers
