"""Presentation server for the Tollgate demo video.

Wraps tollgate.consoleapp with two recording conveniences and changes nothing
else about the product:

1. TOLLGATE_EVIDENCE=mock, so the ops dashboard shows the offline rehearsal
   evidence from results/mock/ under its yellow banner.
2. A presentation pacer on the live bus. Mock runs finish in about a second,
   which is perfect for CI and useless on camera: the theater feed would dump
   every event at once. The pacer holds each event for a readable interval
   before it reaches SSE, so the feed plays like a story. When nobody is
   listening, events pass straight through and nothing is slowed down.

Run:  .venv/bin/python scripts/demo_server.py [--port 8720]

The run itself is started from the theater page (offline rehearsal, frontier
search) exactly as a human would - the server never starts one itself.
"""
from __future__ import annotations

import os
import queue
import sys
import threading
import time
from typing import Any

os.environ["TOLLGATE_EVIDENCE"] = "mock"

import tollgate.live as live  # noqa: E402  (after the env var)


# Seconds a paced event holds the feed before the next one lands. Tuned so a
# three-proposal frontier search plays out over roughly a minute of footage.
PACED_SECONDS: dict[str, float] = {
    "run_state": 1.4,
    "progress": 0.5,
    "attack": 2.6,
    "tool": 0.18,
    "verdict": 0.38,
    "bait": 0.5,
    "learn": 1.6,
    "gate": 2.6,
    "frontier": 2.2,
}
DEFAULT_GAP = 0.3


class Pacer:
    """Queue in, paced bus.emit out, on one daemon thread."""

    def __init__(self, min_gap: float = 0.05) -> None:
        self.min_gap = min_gap
        self._q: queue.Queue[Any] = queue.Queue()
        self._original_emit = live.bus.emit  # bound, unpatched method
        self._thread = threading.Thread(target=self._pump, daemon=True)
        self._thread.start()

    def install(self) -> None:
        """Route every bus.emit through the pacer instead of straight to SSE."""

        def buffering(kind: str, **data: Any) -> None:
            if not live.bus.has_listeners():
                # No theater attached (CI, tests): behave exactly like the
                # original no-op and never slow a run down.
                return
            self._q.put({"kind": kind, **data})

        live.bus.emit = buffering  # type: ignore[method-assign]

    def _pump(self) -> None:
        while True:
            ev = self._q.get()
            kind = ev["kind"]
            kwargs = {k: v for k, v in ev.items() if k != "kind"}
            self._original_emit(kind, **kwargs)
            hold = PACED_SECONDS.get(kind, DEFAULT_GAP)
            time.sleep(max(hold, self.min_gap))


def main() -> None:
    port = 8720
    if "--port" in sys.argv:
        port = int(sys.argv[sys.argv.index("--port") + 1])

    pacer = Pacer()
    pacer.install()

    import uvicorn

    from tollgate.consoleapp import app

    print(f"paced theater on http://127.0.0.1:{port}/theater "
          f"(dashboard: /) - start a run from the page")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")


if __name__ == "__main__":
    main()
