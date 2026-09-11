"""The demo theater, offline: the controller runs the real evolution loop on
mock LLMs in a background thread and the bus streams the story to listeners."""
from __future__ import annotations

import queue
import time

import pytest

from tollgate import theater
from tollgate.config import Config, load_config


@pytest.fixture(autouse=True)
def _mock_evidence_in_tmp(tmp_path, monkeypatch):
    """Rehearsals go to results/mock/ in real use; in tests, to a temp dir."""
    real = Config.for_mock

    def for_mock(self):
        c = real(self)
        c.paths.results = str(tmp_path / "mock" / "results.jsonl")
        c.paths.transcripts = str(tmp_path / "mock" / "transcripts")
        return c

    monkeypatch.setattr(Config, "for_mock", for_mock)


def _drain(q: queue.Queue) -> list[dict]:
    out = []
    while True:
        try:
            out.append(q.get_nowait())
        except queue.Empty:
            return out


def _run_to_end(q: queue.Queue, timeout: float = 90) -> list[dict]:
    events: list[dict] = []
    deadline = time.time() + timeout
    while time.time() < deadline:
        events.extend(_drain(q))
        if any(e.get("kind") == "run_state" and e.get("state") in ("finished", "error", "stopped")
               for e in events):
            break
        time.sleep(0.2)
    events.extend(_drain(q))
    terminal = [e for e in events if e.get("kind") == "run_state"
                and e.get("state") in ("finished", "error", "stopped")]
    assert terminal, "run did not terminate in time"
    errors = [e for e in terminal if e["state"] == "error"]
    assert not errors, f"theater run errored: {errors[0].get('detail')}"
    return events


def test_theater_mock_run():
    cfg = load_config()
    official = cfg.paths.results_file()
    before = official.read_bytes() if official.exists() else None

    q: queue.Queue = queue.Queue()
    detach = theater.controller.attach(q)
    try:
        assert theater.controller.start(rounds=1, mode="mock")["ok"] is True
        assert theater.controller.start(rounds=1, mode="mock")["ok"] is False  # one at a time

        events = _run_to_end(q)
        # the rehearsal wrote nothing official and left the cached config alone
        assert load_config().paths.results_file() == official
        assert (official.read_bytes() if official.exists() else None) == before

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


def test_theater_frontier_run():
    q: queue.Queue = queue.Queue()
    detach = theater.controller.attach(q)
    try:
        assert theater.controller.start(rounds=2, mode="mock", kind="frontier")["ok"] is True
        events = _run_to_end(q)
        props = [e for e in events if e["kind"] == "frontier"]
        assert len(props) == 2
        assert all("attacks_blocked" in e and "accepted" in e for e in props)
        assert any(e["kind"] == "gate" for e in events)
    finally:
        theater.controller.stop()
        detach()
        theater.controller._listeners.clear()
        theater.controller._thread = None
