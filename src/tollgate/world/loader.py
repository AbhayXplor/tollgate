"""Load and reset the fake world. Reset = regenerate with the recorded seed (deterministic)."""
from __future__ import annotations

import json
import shutil
from functools import lru_cache
from pathlib import Path

from .generate import write_world

SEED = 7


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
        out = []
        for sub in ("clean", "poisoned"):
            d = self.dir / "kb" / sub
            if not d.exists():
                continue
            for f in d.glob("*.md"):
                text = f.read_text()
                if any(w.lower() in text.lower() for w in query.split()):
                    out.append({"article": f.stem, "body": text})
        return out


@lru_cache(maxsize=1)
def load_world(data_path: str = "data") -> World:
    d = Path(data_path)
    if not (d / "employees.json").exists():
        write_world(d, seed=SEED)
    return World(d)
