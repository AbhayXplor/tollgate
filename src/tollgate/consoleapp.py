"""Tollgate console: the booth-facing product surface.

Two pages:
- "/"        ops dashboard: metrics, frontier, learning curve from results files
- "/theater" the live demo: start the loop in the browser, watch every event

The dashboard reads results/ files only. The theater streams events from the
running loop over SSE. Chart.js is vendored locally so demos survive dead wifi.
"""
from __future__ import annotations

import asyncio
import json
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse

from . import theater
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


# -- theater ----------------------------------------------------------------

@app.get("/api/theater/status")
def api_theater_status() -> JSONResponse:
    return JSONResponse({"running": theater.controller.is_running(),
                         "state": theater.controller.state})


@app.post("/api/theater/start")
async def api_theater_start(request: Request) -> JSONResponse:
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    rounds = max(1, min(int(body.get("rounds", 3) or 3), 10))
    mode = body.get("mode", "live")
    if mode not in ("live", "mock"):
        mode = "live"
    return JSONResponse(theater.controller.start(rounds=rounds, mode=mode))


@app.post("/api/theater/stop")
def api_theater_stop() -> JSONResponse:
    theater.controller.stop()
    return JSONResponse({"ok": True})


@app.get("/api/theater/stream")
async def api_theater_stream() -> StreamingResponse:
    """SSE: every live event from the running loop, plus a heartbeat.
    The thread queue is polled with the event loop yielded between reads;
    never block the server inside the generator."""
    import queue as _queue

    q: _queue.Queue = _queue.Queue()
    detach = theater.controller.attach(q)

    async def gen():
        idle = 0.0
        try:
            yield 'data: {"kind": "hello"}\n\n'
            while True:
                sent = False
                while True:
                    try:
                        ev = q.get_nowait()
                    except _queue.Empty:
                        break
                    yield f"data: {json.dumps(ev, default=str)}\n\n"
                    sent = True
                    idle = 0.0
                if not sent:
                    await asyncio.sleep(0.2)
                    idle += 0.2
                    if idle >= 15:
                        yield ": ping\n\n"
                        idle = 0.0
        finally:
            detach()

    return StreamingResponse(gen(), media_type="text/event-stream")


@app.get("/theater", response_class=HTMLResponse)
def theater_page() -> HTMLResponse:
    return HTMLResponse(THEATER_HTML)


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
  .demo { margin-top:16px; }
  .demo a { color:#5df2a6; font-weight:bold; text-decoration:none; }
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
<div class="demo"><a href="/theater">&#9654; OPEN THE LIVE THEATER</a> <span style="color:#7f95bd">- start the loop from the browser and watch it break, learn, and gate</span></div>
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


THEATER_HTML = """<!doctype html>
<html><head><meta charset="utf-8"><title>Tollgate Live</title>
<style>
  :root { color-scheme: dark; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background:#0b1220; color:#dbe7ff;
         margin:0; padding:22px 26px; }
  h1 { font-size:22px; margin:0; letter-spacing:1px; }
  .sub { color:#7f95bd; margin:4px 0 16px; font-size:13px; }
  .bar { display:flex; gap:12px; align-items:center; margin-bottom:14px; }
  button { background:#5df2a6; border:none; color:#0b1220; font-weight:700; font-size:14px;
           padding:10px 22px; border-radius:8px; cursor:pointer; }
  button:disabled { opacity:.4; cursor:default; }
  button.ghost { background:#22325a; color:#dbe7ff; font-weight:600; }
  select { background:#111a2e; color:#dbe7ff; border:1px solid #22325a; border-radius:6px;
           padding:8px; font-size:13px; }
  .mode { color:#7f95bd; font-size:12px; }
  .kpis { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:14px; }
  .kpi { background:#111a2e; border:1px solid #22325a; border-radius:10px; padding:10px 14px; }
  .kpi .v { font-size:26px; font-weight:700; } .kpi .l { color:#7f95bd; font-size:11px; }
  .good { color:#5df2a6; } .bad { color:#ff6b81; } .warn { color:#ffd166; }
  #feed { background:#0d1526; border:1px solid #22325a; border-radius:10px; height:60vh;
          overflow-y:auto; padding:12px 14px; font-family:Consolas,'Cascadia Mono',monospace;
          font-size:13px; line-height:1.6; }
  .ev { margin:3px 0; white-space:pre-wrap; word-break:break-word; }
  .t { color:#4b5f8a; margin-right:8px; }
  .attack { color:#ffd166; } .hyp { color:#7f95bd; }
  .tool { color:#9fb4de; } .blocked { color:#ff6b81; font-weight:bold; }
  .breach { color:#ff6b81; font-weight:bold; font-size:14px; }
  .shield { color:#5df2a6; } .done { color:#5df2a6; } .fa { color:#ff6b81; }
  .gate-ok { color:#5df2a6; font-weight:bold; font-size:14px; }
  .gate-no { color:#ff6b81; font-weight:bold; font-size:14px; }
  .learn { color:#5b8cff; } .sys { color:#7f95bd; } .bait { color:#c792ea; }
  .big { font-size:15px; margin-top:6px; }
  .cursor { animation: blink 1s infinite; color:#5df2a6; }
  @keyframes blink { 50% { opacity:0; } }
</style></head><body>
<h1>TOLLGATE <span style="color:#5df2a6">// LIVE</span></h1>
<div class="sub">attack &rarr; detect &rarr; patch &rarr; price &rarr; ship or revert. Every verdict comes from tool logs, never opinions.</div>
<div class="bar">
  <button id="start">&#9654; START LIVE RUN</button>
  <select id="rounds"><option>1</option><option>2</option><option selected>3</option><option>5</option></select>
  <span class="mode">rounds</span>
  <button id="mock" class="ghost">offline rehearsal</button>
  <button id="stop" class="ghost" disabled>stop</button>
  <span class="mode" id="status">idle</span>
</div>
<div class="kpis">
  <div class="kpi"><div class="v bad" id="k-breach">0</div><div class="l">BREACHES</div></div>
  <div class="kpi"><div class="v good" id="k-block">0</div><div class="l">ATTACKS BLOCKED</div></div>
  <div class="kpi"><div class="v good" id="k-honest">0</div><div class="l">HONEST TASKS DONE</div></div>
  <div class="kpi"><div class="v bad" id="k-fa">0</div><div class="l">FALSE ALARMS</div></div>
  <div class="kpi"><div class="v warn" id="k-gate">0 / 0</div><div class="l">GATE ACCEPT / REVERT</div></div>
</div>
<div id="feed"><div class="ev sys">&#9654; press START to run the loop. nothing here is scripted: the attacker writes its own attacks each round.</div><div class="ev">&#9608;</div></div>
<script>
const feed = document.getElementById('feed');
let k = {breach:0, block:0, honest:0, fa:0, acc:0, rev:0};
function line(html, cls) {
  const d = document.createElement('div');
  d.className = 'ev ' + (cls || '');
  const ts = new Date().toLocaleTimeString([], {hour12:false});
  d.innerHTML = '<span class="t">' + ts + '</span>' + html;
  feed.insertBefore(d, feed.lastElementChild);
  feed.scrollTop = feed.scrollHeight;
}
function esc(s) { return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
const names = {
  canary_leaked: 'prompt leak', sensitive_data_left: 'sensitive data left',
  external_recipient: 'external email', unauthorised_privileged_action: 'unauthorised reset',
  sandbox_escape_attempt: 'sandbox escape', denied_claim: 'denied while done',
  must_do_unmet: 'task not done', must_say_unmet: 'answer missing'};
function handle(ev) {
  if (ev.kind === 'hello') { line('&#128268; connected to the loop.', 'sys'); return; }
  if (ev.kind === 'run_state') {
    line('&#128228; <b>' + esc(ev.state).toUpperCase() + '</b> ' + esc(ev.detail || ''), 'sys');
    return;
  }
  if (ev.kind === 'progress') {
    line('&#9203; ' + esc(ev.note || '') + ' (' + ev.pct + '%)', 'sys'); return;
  }
  if (ev.kind === 'attack') {
    line('&#127919; <b class="attack">RED TEAM ATTACK (round ' + ev.round + ')</b>', 'big');
    line('<span class="attack">' + esc(ev.text).slice(0, 400) + '</span>');
    if (ev.hypothesis)
      line('<span class="hyp">hypothesis: ' + esc(ev.hypothesis).slice(0, 220) + '</span>');
    return;
  }
  if (ev.kind === 'tool') {
    const args = JSON.stringify(ev.arguments || {});
    if (ev.allowed === false)
      line('&#9940; <span class="blocked">guard blocked ' + esc(ev.tool) + '</span> ' + esc(ev.reason || ''), 'tool');
    else
      line('&#128295; ' + esc(ev.tool) + '(' + esc(args).slice(0, 160) + ')', 'tool');
    return;
  }
  if (ev.kind === 'verdict' && ev.kind_of === 'attack') {
    if (ev.verdict === 'succeeded') {
      k.breach++;
      const os = (ev.oracles || []).map(function(o) { return names[o] || o; }).join(', ');
      line('&#9762;&#65039; <span class="breach">BREACH</span> ' + esc(ev.test_id) + ' - ' + esc(os), 'big');
      line('&#128171; orin: ' + esc(ev.answer).slice(0, 220));
    } else {
      k.block++;
      line('&#128737;&#65039; <span class="shield">BLOCKED</span> ' + esc(ev.test_id) + ' - orin refused or guard held', 'big');
    }
    updateK(); return;
  }
  if (ev.kind === 'verdict') {
    if (ev.false_alarm) {
      k.fa++;
      line('&#128680; <span class="fa">FALSE ALARM</span> honest task ' + esc(ev.test_id) + ' rejected: ' + esc(ev.answer).slice(0, 140), 'big');
    } else if (ev.completed) {
      k.honest++;
      line('&#9989; <span class="done">honest task done</span> ' + esc(ev.test_id));
    } else {
      k.fa++;
      line('&#10060; <span class="fa">honest task failed</span> ' + esc(ev.test_id) + ': ' + esc(ev.answer).slice(0, 140));
    }
    updateK(); return;
  }
  if (ev.kind === 'bait') {
    const probes = ev.probes || [];
    for (const b of probes)
      line('&#127875; bait probe ' + (b.tripped ? '&#10060; tripped the guard (score ' + b.score + ')' : '&#9989; passed (score ' + b.score + ')') + ' - ' + esc(b.text).slice(0, 120), 'bait');
    return;
  }
  if (ev.kind === 'learn') {
    const m = ev.metrics || {};
    line('&#129504; classifier retrained: mode=' + esc(m.mode) + ' holdout acc=' + (m.holdout_accuracy ?? 'n/a') + ' f1=' + (m.holdout_f1 ?? 'n/a'), 'learn');
    return;
  }
  if (ev.kind === 'gate') {
    if (ev.accepted) {
      k.acc++;
      line('&#9989;&#9989; <span class="gate-ok">GATE: PATCH ACCEPTED</span> toll=' + ((ev.numbers || {}).toll_total ?? '?') + ' pts', 'big');
    } else {
      k.rev++;
      line('&#128148; <span class="gate-no">GATE: PATCH REVERTED</span> ' + esc((ev.failed || []).join(' | ')), 'big');
    }
    updateK(); return;
  }
}
function updateK() {
  document.getElementById('k-breach').textContent = k.breach;
  document.getElementById('k-block').textContent = k.block;
  document.getElementById('k-honest').textContent = k.honest;
  document.getElementById('k-fa').textContent = k.fa;
  document.getElementById('k-gate').textContent = k.acc + ' / ' + k.rev;
}
const es = new EventSource('/api/theater/stream');
es.onmessage = function(m) { try { handle(JSON.parse(m.data)); } catch(e) {} };
async function start(mode) {
  const r = await (await fetch('/api/theater/start', {method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({rounds: +document.getElementById('rounds').value, mode})})).json();
  if (!r.ok) alert(r.error || 'cannot start');
}
document.getElementById('start').onclick = function() { start('live'); };
document.getElementById('mock').onclick = function() { start('mock'); };
document.getElementById('stop').onclick = async function() { await fetch('/api/theater/stop', {method:'POST'}); };
setInterval(async function() {
  const s = await (await fetch('/api/theater/status')).json();
  const el = document.getElementById('status');
  el.textContent = s.state + (s.running ? ' •' : '');
  document.getElementById('start').disabled = s.running;
  document.getElementById('mock').disabled = s.running;
  document.getElementById('stop').disabled = !s.running;
}, 1500);
</script></body></html>"""
