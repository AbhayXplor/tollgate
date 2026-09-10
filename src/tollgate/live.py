"""Live event bus for the demo theater.

Runners and the agent loop emit facts as they happen (tool calls, verdicts,
gate decisions). The theater page consumes them over SSE. With no listeners
attached, emitting is a no-op, so offline tests and CI pay nothing.
"""
from __future__ import annotations

import threading
import time
from typing import Any, Callable

Listener = Callable[[dict[str, Any]], None]


class LiveBus:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._listeners: list[Listener] = []
        self.seq = 0

    def subscribe(self, fn: Listener) -> None:
        with self._lock:
            self._listeners.append(fn)

    def unsubscribe(self, fn: Listener) -> None:
        with self._lock:
            if fn in self._listeners:
                self._listeners.remove(fn)

    def has_listeners(self) -> bool:
        with self._lock:
            return bool(self._listeners)

    def emit(self, kind: str, **data: Any) -> None:
        if not self.has_listeners():
            return
        with self._lock:
            self.seq += 1
            ev = {"seq": self.seq, "ts": time.time(), "kind": kind, **data}
            listeners = list(self._listeners)
        for fn in listeners:
            try:
                fn(ev)
            except Exception:
                pass


bus = LiveBus()


def tool_cb(bus: LiveBus, test_id: str, channel: str) -> Callable[[dict[str, Any]], None]:
    """Adapter for run_orin's per-tool-call callback -> bus events."""
    def cb(info: dict[str, Any]) -> None:
        bus.emit("tool", test_id=test_id, channel=channel, **info)
    return cb
