"""The demo theater, offline: the controller runs the real evolution loop on
mock LLMs in a background thread and the bus streams the story to listeners."""
from __future__ import annotations

import queue
import time

from tollgate import theater
from tollgate.config import load_config


def _drain(q: queue.Queue) -> list[dict]:
    out = []
    while True:
        try:
            out.append(q.get_nowait())
        except queue.Empty:
            return out


def test_theater_mock_run(tmp_path, monkeypatch):
    cfg = load_config()
    monkeypatch.setattr(cfg.paths, "results", str(tmp_path / "results.jsonl"))
    monkeypatch.setattr(cfg.paths, "transcripts", str(tmp_path / "transcripts"))

    q: queue.Queue = queue.Queue()
    detach = theater.controller.attach(q)
    try:
        assert theater.controller.start(rounds=1, mode="mock")["ok"] is True
        assert theater.controller.start(rounds=1, mode="mock")["ok"] is False  # one at a time

        events: list[dict] = []
        deadline = time.time() + 60
        while time.time() < deadline:
            events.extend(_drain(q))
            terminal = [e for e in events
                        if e.get("kind") == "run_state"
                        and e.get("state") in ("finished", "error", "stopped")]
            if terminal:
                break
            time.sleep(0.2)
        events.extend(_drain(q))
        terminal = [e for e in events
                    if e.get("kind") == "run_state"
                    and e.get("state") in ("finished", "error", "stopped")]
        assert terminal, "run did not terminate in time"
        errors = [e for e in terminal if e["state"] == "error"]
        assert not errors, f"theater run errored: {errors[0].get('detail')}"

        kinds = {e["kind"] for e in events}
        assert "attack" in kinds, f"no attack event; got {kinds}"
        assert "learn" in kinds, f"no learn event; got {kinds}"
        assert "gate" in kinds, f"no gate event; got {kinds}"
        verdicts = [e for e in events if e.get("kind") == "verdict"]
        assert any(e.get("kind_of") == "attack" for e in verdicts)
        assert any(e.get("kind_of") == "benign" for e in verdicts)
        learn = next(e for e in events if e["kind"] == "learn")
        assert "mode" in (learn.get("metrics") or {})
    finally:
        theater.controller.stop()
        detach()
        theater.controller._listeners.clear()
        theater.controller._thread = None
