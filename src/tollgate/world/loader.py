"""Load and reset the fake world. Reset = regenerate with the recorded seed (deterministic)."""
from __future__ import annotations

import json
import re
import shutil
from functools import lru_cache
from pathlib import Path

from .generate import write_world

SEED = 7

_STOPWORDS = {"the", "and", "for", "how", "what", "can", "you", "are", "with", "this",
              "that", "from", "about", "please", "check", "does", "into", "your", "my"}


class World:
    def __init__(self, data_dir: Path) -> None:
        self.dir = data_dir
        self.employees: list[dict] = json.loads((data_dir / "employees.json").read_text())
        self.secrets: dict[str, str] = json.loads((data_dir / "secrets.json").read_text())

    def reset(self) -> None:
        # poison artifacts (planted tickets/KB articles) must not outlive a run
        for sub in ("tickets/poisoned", "kb/poisoned"):
            d = self.dir / sub
            if d.exists():
                shutil.rmtree(d)
        write_world(self.dir, seed=SEED)
        self.employees = json.loads((self.dir / "employees.json").read_text())
        self.secrets = json.loads((self.dir / "secrets.json").read_text())

    def find_employee(self, query: str) -> dict | None:
        q = query.strip().lower()
        for e in self.employees:
            if q in (e["employee_id"].lower(), e["email"].lower(), e["name"].lower()):
                return e
        return None

    def read_ticket(self, ticket_id: str) -> dict | None:
        p = self.dir / "tickets" / "clean" / f"{ticket_id}.json"
        if p.exists():
            return json.loads(p.read_text())
        # poisoned tickets live next to clean ones, same lookup
        for sub in ("poisoned",):
            p = self.dir / "tickets" / sub / f"{ticket_id}.json"
            if p.exists():
                return json.loads(p.read_text())
        return None

    def search_kb(self, query: str) -> list[dict]:
        """Articles containing any meaningful query word, best match first.
        (v1 matched on any word at all, so "a" or "the" returned every article.)"""
        words = {w for w in re.findall(r"[a-z0-9-]+", query.lower())
                 if len(w) >= 3 and w not in _STOPWORDS}
        hits = []
        for sub in ("clean", "poisoned"):
            d = self.dir / "kb" / sub
            if not d.exists():
                continue
            for f in sorted(d.glob("*.md")):
                text = f.read_text(encoding="utf-8")
                low = text.lower()
                score = sum(1 for w in words if w in low)
                if score:
                    hits.append((score, {"article": f.stem, "body": text}))
        hits.sort(key=lambda h: -h[0])   # stable: ties keep clean-then-poisoned order
        return [h for _, h in hits]


@lru_cache(maxsize=1)
def load_world(data_path: str = "data") -> World:
    d = Path(data_path)
    if not (d / "employees.json").exists():
        write_world(d, seed=SEED)
    return World(d)
