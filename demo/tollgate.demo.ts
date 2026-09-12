/**
 * Tollgate — the release gate for AI agent security changes.
 *
 * Records the live theater page while a frontier search runs in offline
 * rehearsal mode: the search proposes security patches, each one is priced in
 * lost honest work, the blunt patch is reverted by the gate, the precise one
 * ships. Nothing on screen is scripted — the same loop the CLI runs.
 *
 *   cd remotion && npm run demo -- ../demos/tollgate.demo.ts \
 *     --job tollgate-gate --viewport 1440x900 --no-title --headless
 *
 * Requires the presentation-paced theater server (project repo root):
 *   .venv/bin/python scripts/demo_server.py --port 8721
 *
 * Chapter timing is calibrated against the paced server: with 2 proposals the
 * gate stamps REVERTED around run-second 22 and ACCEPTED around run-second 38.
 */
import {
  demo,
  step,
  smoothClick,
  pause,
  focusRegion,
} from "../remotion/scripts/driver";

demo({
  url: "http://127.0.0.1:8721/theater",
  viewport: { width: 1440, height: 900 },
  // Idle tail: the run finishes over it.
  outroHold: 7,
  resetStorage: true,
});

step("This is Tollgate: the release gate for AI agent security", async () => {
  await pause(3600);
});

step("One click runs the whole search against an offline rehearsal model", async (p) => {
  await smoothClick(p.locator("#kind"));
  await p.selectOption("#kind", "frontier");
  await pause(400);
  await smoothClick(p.locator("#rounds"));
  await p.selectOption("#rounds", "2");
  await pause(500);
  await smoothClick(p.locator("#mock"));
  await pause(800);
});

step("Eight attacks hit the agent with no defences. The oracles read the tool log", async (p) => {
  await focusRegion({ x: 0.02, y: 0.33, width: 0.96, height: 0.62 });
  await pause(5600);
});

step("Salaries and API keys walk out through ordinary-looking tickets", async () => {
  await pause(3600);
});

step("Then every proposed fix is priced in lost honest work", async () => {
  await pause(4300);
});

step("Proposal one: lock the tools down hard", async () => {
  await pause(2600);
});

step("Attacks stopped. But the toll lands on the customers: three false alarms", async (p) => {
  await focusRegion({ x: 0.02, y: 0.17, width: 0.96, height: 0.12 });
  await pause(4400);
});

step("The gate refuses the trade and reverts the patch", async (p) => {
  // The gate stamp lands bottom-left of the feed, small enough to zoom on.
  await focusRegion({ x: 0.03, y: 0.80, width: 0.40, height: 0.11 });
  await pause(4400);
});

step("Proposal two is precise instead of blunt", async () => {
  await pause(2600);
});

step("The same attacks still stop. The honest work still flows", async () => {
  await pause(5500);
});

step("Same protection, zero lost work: the gate ships it", async (p) => {
  await focusRegion({ x: 0.03, y: 0.80, width: 0.40, height: 0.11 });
  await pause(6500);
});

step("Every verdict came from the tool log. Every number replays", async () => {
  await pause(4300);
});
