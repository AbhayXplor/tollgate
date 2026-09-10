"""The demo theater: run a loop in a background thread and stream every event
to the console page over SSE.

Two run kinds, both the same code the CLI uses, launched from the browser:
- "evolve":   the self-learning loop (red team agent + retraining + gate)
- "frontier": frontier search (config proposals priced and gated)
If no API key is configured it degrades to mock mode and everything still runs
offline on GullibleMockLLM. Mock rehearsals write under results/mock/ via
Config.for_mock(), so official numbers stay clean.
"""
from __future__ import annotations

import threading
import traceback
from typing import Any

from . import live
from .config import Config, load_config
from .llm.mock import GullibleMockLLM
from .runners.evolve import EvolutionLoop
from .runners.frontier import FrontierSearch, write_frontier
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

    def start(self, rounds: int, mode: str, kind: str = "evolve") -> dict[str, Any]:
        with self._lock:
            if self.is_running():
                return {"ok": False, "error": "a run is already active"}
            self._thread = threading.Thread(
                target=self._run, args=(rounds, mode, kind), daemon=True)
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
    def _run(self, rounds: int, mode: str, kind: str = "evolve") -> None:
        cfg: Config = load_config()
        use_mock = mode == "mock" or not cfg.api_key()
        if self.state == "stop_requested":
            self.state = "idle"
            return
        try:
            world: World = load_world(str(cfg.paths.data_dir()))
            if use_mock:
                # a COPY with results/mock/ paths; the cached config is untouched
                cfg = cfg.for_mock()
                target = GullibleMockLLM()
                attacker = target
                mode_used = "mock (offline rehearsal)"
            else:
                from .llm.gemini_client import make_client

                target = make_client(cfg, "target", force_mock=False)
                attacker = make_client(cfg, "attacker", force_mock=False)
                mode_used = f"{target.model} + attacker {attacker.model}"
            live.bus.emit("run_state", state="starting", detail=mode_used,
                          rounds=rounds, run_kind=kind)

            def progress(pct: int, note: str) -> None:
                live.bus.emit("progress", pct=pct, note=note)
                if self.state == "stop_requested":
                    raise KeyboardInterrupt

            live.bus.emit("run_state", state="running", detail=mode_used)
            if kind == "frontier":
                search = FrontierSearch(cfg, world, target, proposals=rounds,
                                        progress_cb=progress)
                write_frontier(cfg, search.run())
            else:
                loop = EvolutionLoop(cfg, world, target, attacker=attacker,
                                     rounds=rounds, progress_cb=progress)
                loop.run()
            where = "results/mock/" if use_mock else "results/"
            live.bus.emit("run_state", state="finished",
                          detail=f"{rounds} {'proposals' if kind == 'frontier' else 'rounds'} "
                                 f"complete, evidence in {where}")
        except KeyboardInterrupt:
            live.bus.emit("run_state", state="stopped", detail="stopped by operator")
        except Exception as exc:  # noqa: BLE001
            live.bus.emit("run_state", state="error",
                          detail=f"{type(exc).__name__}: {exc}")
            live.bus.emit("log", line=traceback.format_exc()[-600:])
        finally:
            self.state = "idle"


controller = TheaterController()
