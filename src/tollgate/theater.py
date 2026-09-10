"""The demo theater: run the self-learning loop in a background thread and
stream every event to the console page over SSE.

This is the same EvolutionLoop the CLI uses, launched from the browser.
The attacker defaults to the red team agent (novel attacks); if no API key
is configured it degrades to mock mode and everything still runs offline.
Mock rehearsals write to their own evidence files so official numbers stay clean.
"""
from __future__ import annotations

import threading
import traceback
from pathlib import Path
from typing import Any

from . import live
from .config import Config, load_config
from .llm.mock import MockLLM
from .runners.evolve import EvolutionLoop
from .world.loader import World, load_world


class TheaterController:
    """One run at a time. Subscribes the SSE generators to the bus while active."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._thread: threading.Thread | None = None
        self._listeners: list[Any] = []
        self.state = "idle"

    def _listener(self, ev: dict[str, Any]) -> None:
        for q in list(self._listeners):
            q.put(ev)

    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def start(self, rounds: int, mode: str) -> dict[str, Any]:
        with self._lock:
            if self.is_running():
                return {"ok": False, "error": "a run is already active"}
            self._thread = threading.Thread(
                target=self._run, args=(rounds, mode), daemon=True)
            self.state = "starting"
            self._thread.start()
        return {"ok": True}

    def stop(self) -> None:
        self.state = "stop_requested"

    def attach(self, queue: Any) -> Any:
        """Attach an SSE queue; returns a detach callable."""
        first = not self._listeners
        self._listeners.append(queue)
        if first:
            live.bus.subscribe(self._listener)
        return lambda: self._detach(queue)

    def _detach(self, queue: Any) -> None:
        if queue in self._listeners:
            self._listeners.remove(queue)
        if not self._listeners:
            live.bus.unsubscribe(self._listener)

    # -- the run -------------------------------------------------------------
    def _run(self, rounds: int, mode: str) -> None:
        cfg: Config = load_config()
        use_mock = mode == "mock" or not cfg.api_key()
        if self.state == "stop_requested":
            self.state = "idle"
            return
        try:
            world: World = load_world(str(cfg.paths.data_dir()))
            if use_mock:
                # keep rehearsal rows out of the official evidence files
                rdir = Path(__file__).resolve().parents[3] / "results"
                cfg.paths.results = str(rdir / "theater_mock.jsonl")
                cfg.paths.transcripts = str(rdir / "theater_mock_transcripts")
                target = MockLLM()
                attacker = None
                mode_used = "mock (offline)"
            else:
                from .llm.gemini_client import make_client

                target = make_client(cfg, "target", force_mock=False)
                attacker = make_client(cfg, "attacker", force_mock=False)
                mode_used = f"{target.model} + attacker {attacker.model}"
            live.bus.emit("run_state", state="starting", detail=mode_used,
                          rounds=rounds)

            def progress(pct: int, note: str) -> None:
                live.bus.emit("progress", pct=pct, note=note)
                if self.state == "stop_requested":
                    raise KeyboardInterrupt

            loop = EvolutionLoop(cfg, world, target, attacker=attacker,
                                 rounds=rounds, progress_cb=progress)
            live.bus.emit("run_state", state="running", detail=mode_used)
            loop.run()
            live.bus.emit("run_state", state="finished",
                          detail=f"{rounds} rounds complete, evidence in results/")
        except KeyboardInterrupt:
            live.bus.emit("run_state", state="stopped", detail="stopped by operator")
        except Exception as exc:  # noqa: BLE001
            live.bus.emit("run_state", state="error",
                          detail=f"{type(exc).__name__}: {exc}")
            live.bus.emit("log", line=traceback.format_exc()[-600:])
        finally:
            self.state = "idle"


controller = TheaterController()
