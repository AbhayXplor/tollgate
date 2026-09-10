"""Tollgate console: the booth-facing product surface.

Reads results/ files only; never calls an API. FastAPI + one static page,
Chart.js vendored locally so the demo survives dead wifi."""
from __future__ import annotations

import asyncio
import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse

from .config import load_config
from .report.metrics import read_rows, summary

ROOT = Path(__file__).resolve().parents[2]
app = FastAPI(title="Tollgate Console")
_cfg = load_config()


@app.get("/api/summary")
def api_summary() -> JSONResponse:
    rows = read_rows(_cfg.paths.results_file())
    return JSONResponse(summary(rows))


@app.get("/api/loop")
def api_loop() -> JSONResponse:
    f = ROOT / "results" / "loop.jsonl"
    entries = []
    if f.exists():
        for line in f.read_text(encoding="utf-8").splitlines():
            if line.strip():
                entries.append(json.loads(line))
    return JSONResponse(entries)


@app.get("/api/evolution")
def api_evolution() -> JSONResponse:
    """The learning curve: per-round classifier metrics, attack outcomes, bait FPs."""
    f = ROOT / "results" / "evolution.jsonl"
    entries = []
    if f.exists():
        for line in f.read_text(encoding="utf-8").splitlines():
            if line.strip():
                entries.append(json.loads(line))
    return JSONResponse(entries)


@app.get("/api/feed")
async def api_feed() -> StreamingResponse:
    """SSE stream: emits current summary every 2s so the page live-updates."""
    async def gen():
        while True:
            rows = read_rows(_cfg.paths.results_file())
            s = summary(rows)
            yield f"data: {json.dumps(s)}\n\n"
            await asyncio.sleep(2)
    return StreamingResponse(gen(), media_type="text/event-stream")


@app.get("/api/transcript/{run_id}")
def api_transcript(run_id: str) -> JSONResponse:
    d = _cfg.paths.transcripts_dir()
    f = d / f"{run_id}.json"
    if not f.exists():
        return JSONResponse({"error": "not found"}, status_code=404)
    return JSONResponse(json.loads(f.read_text(encoding="utf-8")))


@app.get("/", response_class=HTMLResponse)
def index() -> HTMLResponse:
    vendor = ROOT / "dashboard" / "vendor" / "chart.min.js"
    chart_js = vendor.read_text(encoding="utf-8") if vendor.exists() else \
        "/* chart.js not vendored */"
    html = """<!doctype html>
<html><head><meta charset="utf-8"><title>Tollgate Console</title>
<style>
  :root { color-scheme: dark; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background:#0b1220; color:#dbe7ff;
         margin:0; padding:24px; }
  h1 { font-size:22px; margin:0 0 4px; } .sub { color:#7f95bd; margin-bottom:20px; }
  .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
  .kpi { background:#111a2e; border:1px solid #22325a; border-radius:10px; padding:14px; }
  .kpi .v { font-size:28px; font-weight:700; } .kpi .l { color:#7f95bd; font-size:12px; }
  .good { color:#5df2a6; } .bad { color:#ff6b81; }
  .panels { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .panel { background:#111a2e; border:1px solid #22325a; border-radius:10px; padding:16px; }
  .feed { height:280px; overflow:auto; font-family:Consolas,monospace; font-size:12px; }
  .feed .row { padding:5px 8px; border-left:3px solid #22325a; margin-bottom:4px; }
  .feed .ok { border-color:#5df2a6; } .feed .rej { border-color:#ff6b81; }
  .feed .gate { border-color:#ffd166; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  td,th { padding:5px 8px; border-bottom:1px solid #1c2a4a; text-align:left; }
</style></head><body>
<h1>TOLLGATE <span style="color:#7f95bd">// agent security release gate</span></h1>
<div class="sub">break &rarr; patch &rarr; price &rarr; ship or revert. Verdicts from tool logs, never opinions.</div>
<div class="grid">
  <div class="kpi"><div class="v" id="k-asr">-</div><div class="l">ATTACK SUCCESS RATE</div></div>
  <div class="kpi"><div class="v good" id="k-tcr">-</div><div class="l">HONEST WORK COMPLETED</div></div>
  <div class="kpi"><div class="v bad" id="k-toll">-</div><div class="l">THE TOLL (work lost, pts)</div></div>
  <div class="kpi"><div class="v" id="k-runs">-</div><div class="l">MEASURED RUNS</div></div>
</div>
<div class="panels">
  <div class="panel"><b>SECURITY &harr; UTILITY FRONTIER</b><canvas id="frontier"></canvas></div>
  <div class="panel"><b>THE LEARNING CURVE <span style="color:#7f95bd;font-weight:400">(classifier, held-out numbers)</span></b><canvas id="learn"></canvas>
    <div id="learn-line" style="margin-top:6px;color:#7f95bd;font-size:12px"></div></div>
</div>
<div class="panels" style="margin-top:14px">
  <div class="panel"><b>RED TEAM FEED <span style="color:#7f95bd;font-weight:400">(live attacks + gate verdicts)</span></b><div class="feed" id="feed"><div class="row">waiting for loop events&hellip;</div></div>
    <div id="toll-line" style="margin-top:8px;color:#7f95bd;font-size:13px"></div></div>
  <div class="panel"><b>NOVEL ATTACKS <span style="color:#7f95bd;font-weight:400">(invented by the red team agent)</span></b><div class="feed" id="rtfeed"><div class="row">waiting for evolve runs&hellip;</div></div></div>
</div>
<script>__CHART_JS__</script>
<script>
async function refresh() {
  const s = await (await fetch('/api/summary')).json();
  kAsr.textContent = s.asr_overall + '%'; kAsr.className = 'v ' + (s.asr_overall>20?'bad':'');
  kTcr.textContent = s.tcr_all + '%';
  const toll = Math.max(0, 100 - s.tcr_all);
  kToll.textContent = toll.toFixed(1); kRuns.textContent = s.runs;
  drawFrontier(s.frontier || []);
  document.getElementById('toll-line').textContent =
    'B1 ordinary: ' + s.tcr_ordinary_b1 + '%  |  B2 lookalike: ' + s.tcr_lookalike_b2 +
    '%  |  false alarms: ' + s.false_alarms;
}
let chart, learnChart;
async function loadEvolution() {
  const ev = await (await fetch('/api/evolution')).json();
  if (!ev.length) return;
  const rounds = ev.map(e => 'R' + e.round);
  const acc = ev.map(e => (e.classifier && e.classifier.holdout_accuracy) ?? null);
  const f1 = ev.map(e => (e.classifier && e.classifier.holdout_f1) ?? null);
  const fp = ev.map(e => e.bait_fp ?? 0);
  const ctx = document.getElementById('learn');
  if (window.Chart) {
    const data = { labels: rounds, datasets: [
      { label: 'holdout accuracy', data: acc, borderColor:'#5df2a6', backgroundColor:'#5df2a6', tension:0.3 },
      { label: 'holdout F1', data: f1, borderColor:'#5b8cff', backgroundColor:'#5b8cff', tension:0.3 },
      { label: 'bait false alarms', data: fp, borderColor:'#ff6b81', backgroundColor:'#ff6b81', tension:0.3 } ]};
    if (learnChart) { learnChart.data = data; learnChart.update(); }
    else learnChart = new Chart(ctx, { type:'line', data,
      options:{ animation:false, scales:{ y:{ min:0, max:1 } }, plugins:{legend:{labels:{color:'#7f95bd', boxWidth:10}}} } });
  }
  const last = ev[ev.length - 1];
  document.getElementById('learn-line').textContent =
    'mode: ' + (last.classifier ? last.classifier.mode : '?') +
    ' | novel-attack recall (held-out): ' + ((last.classifier && last.classifier.novel_recall_holdout) ?? 'n/a');
  const rt = document.getElementById('rtfeed'); rt.innerHTML = '';
  for (const e of ev) {
    const div = document.createElement('div');
    div.className = 'row ' + (e.verdict === 'succeeded' ? 'rej' : '');
    div.textContent = 'R' + e.round + ' [' + e.verdict + '] ' + (e.attack || '').slice(0, 110);
    rt.appendChild(div);
    if (e.verdict === 'succeeded') {
      const h = document.createElement('div');
      h.className = 'row gate';
      h.textContent = '   hypothesis: ' + (e.hypothesis || '').slice(0, 110);
      rt.appendChild(h);
    }
  }
}
function drawFrontier(pts) {
  const ctx = document.getElementById('frontier');
  if (!window.Chart || !pts.length) return;
  const data = { datasets: [{ label: 'defence configs', data: pts.map(p => ({x:p.attacks_blocked, y:p.tasks_completed})),
    backgroundColor:'#5b8cff', pointRadius:6 }] };
  if (chart) { chart.data = data; chart.update(); return; }
  chart = new Chart(ctx, { type:'scatter', data,
    options:{ animation:false, scales:{ x:{title:{display:true,text:'attacks blocked %'}, min:0, max:100},
                                    y:{title:{display:true,text:'honest work completed %'}, min:0, max:100} },
              plugins:{legend:{display:false}} } });
}
async function loadLoop() {
  const entries = await (await fetch('/api/loop')).json();
  if (!entries.length) return;
  const feed = document.getElementById('feed'); feed.innerHTML = '';
  for (const e of entries) for (const a of (e.attempts||[])) {
    const div = document.createElement('div');
    if (a.verdict === 'succeeded') {
      const acc = a.accepted;
      div.className = 'row ' + (acc ? 'ok' : 'rej');
      div.textContent = 'round ' + e.round + ' ' + e.seed + ' BROKE IN -> patch [' +
        Object.keys(a.patch||{}).join(',') + '] -> gate ' + (acc ? 'ACCEPTED' : 'REVERTED');
    } else { div.className='row'; div.textContent='round ' + e.round + ' ' + e.seed + ' blocked'; }
    feed.appendChild(div);
  }
}
refresh(); loadLoop(); loadEvolution(); setInterval(refresh, 3000); setInterval(loadEvolution, 5000);
</script></body></html>"""
    return HTMLResponse(html.replace("__CHART_JS__", chart_js))
