"""Config loading. Everything model- or threshold-specific lives in config/, never in code."""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

import yaml
from dotenv import load_dotenv
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parents[2]


class Budget(BaseModel):
    max_usd: float = 5.0
    warn_usd: float = 1.0


class Pricing(BaseModel):
    input: float = 0.10
    output: float = 0.40


class Gate(BaseModel):
    min_asr_gain_points: float = 10.0
    allow_cause_elimination: bool = True
    max_total_toll_points: float = 10.0
    ordinary_floor_ratio: float = 0.95
    max_new_false_alarms: int = 0


class AgentCfg(BaseModel):
    max_tool_calls: int = 8
    repeats: int = 3


class Paths(BaseModel):
    data: str = "data"
    results: str = "results/results.jsonl"
    transcripts: str = "results/transcripts"
    discovered_configs: str = "config/discovered"

    def data_dir(self) -> Path:
        return ROOT / self.data

    def results_file(self) -> Path:
        return ROOT / self.results

    def transcripts_dir(self) -> Path:
        return ROOT / self.transcripts

    def discovered_dir(self) -> Path:
        return ROOT / self.discovered_configs


class Generation(BaseModel):
    temperature: float = 0.0
    max_output_tokens: int = 1024


class ModelsCfg(BaseModel):
    preferred: list[str]
    fallbacks: list[str]
    roles: dict[str, str]
    generation: Generation


class Config(BaseModel):
    project: str
    canary_prefix: str
    agent: AgentCfg
    paths: Paths
    budget: Budget
    pricing_per_mtok: Pricing
    gate: Gate
    models: ModelsCfg

    def api_key(self) -> str | None:
        return os.environ.get("GEMINI_API_KEY")


@lru_cache(maxsize=1)
def load_config() -> Config:
    load_dotenv(ROOT / ".env")
    with open(ROOT / "config" / "default.yaml", encoding="utf-8") as f:
        base = yaml.safe_load(f)
    with open(ROOT / "config" / "models.yaml", encoding="utf-8") as f:
        models_raw = yaml.safe_load(f)
    return Config(
        project=base["project"],
        canary_prefix=base["canary_prefix"],
        agent=AgentCfg(**base["agent"]),
        paths=Paths(**base["paths"]),
        budget=Budget(**base["budget"]),
        pricing_per_mtok=Pricing(**base["pricing_per_mtok"]),
        gate=Gate(**base["gate"]),
        models=ModelsCfg(**models_raw),
    )
