"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Pause, Play } from "lucide-react";

// The six pipeline stages, in loop order. DIAGNOSE is teal rather than sky blue:
// sky blue sat too close to PATCH's indigo for readers with full color vision.
const STAGES = [
  {
    name: "BREAK",
    color: "#ff3b30",
    title: "Red team break",
    description: "A red team agent attacks the helpdesk until a tool call leaks the canary.",
  },
  {
    name: "DIAGNOSE",
    color: "#0e9bb0",
    title: "Root cause trace",
    description: "The tool log names what broke. Mechanical oracles, never an AI judge.",
  },
  {
    name: "PATCH",
    color: "#5856d6",
    title: "Synthesize patch",
    description: "A candidate defense is aimed at that exact cause.",
  },
  {
    name: "PRICE",
    color: "#ff9500",
    title: "Price the Toll",
    description: "Honest tasks re-run. The Toll = TCR(baseline) − TCR(candidate).",
  },
  {
    name: "GATE",
    color: "#34c759",
    title: "Mechanical gate",
    description: "Rules G1–G4 decide. A patch ships only if all four hold.",
  },
  {
    name: "SHIP/REVERT",
    color: "#af52de",
    title: "Ship or auto-revert",
    description: "Passing patches ship. Toll above 10 points reverts automatically.",
  },
] as const;

const STAGE_COUNT = STAGES.length;
const STEP = (Math.PI * 2) / STAGE_COUNT;
const DWELL_SECONDS = 2.6; // time the loop rests on each stage
const HOLD_SECONDS = 8; // how long a clicked stage stays in front before the loop resumes
const RADIUS = 6.2;

const easeOutBack = (x: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Soft round sprite so points render as dots, not squares. */
const makeDotTexture = () => {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.62, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

export const HeroScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(4); // opens on GATE
  const [paused, setPaused] = useState(false);

  // Bridges between React controls and the render loop.
  const requestedStageRef = useRef<number | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) setPaused(true);

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Studio environment for soft reflections on the ceramic spheres.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envTexture = pmrem.fromScene(room, 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.35;
    room.dispose();

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 5.4, 15.5);
    camera.lookAt(0, -0.6, 0);

    // ── Studio lighting ───────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(8, 16, 12);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -11;
    key.shadow.camera.right = 11;
    key.shadow.camera.top = 11;
    key.shadow.camera.bottom = -11;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 50;
    key.shadow.bias = -0.0005;
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x0071e3, 0.4);
    rim.position.set(-10, -6, -8);
    scene.add(rim);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xe5e7eb, 0.6));

    // Contact shadow on an invisible floor.
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.055 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.4;
    floor.receiveShadow = true;
    scene.add(floor);

    // ── The loop ──────────────────────────────────────────────
    const group = new THREE.Group();
    scene.add(group);

    const disposables: { dispose: () => void }[] = [floorGeo, floorMat, envTexture, pmrem];

    const sphereGeo = new THREE.SphereGeometry(0.46, 48, 48);
    const haloGeo = new THREE.RingGeometry(0.74, 0.8, 72);
    disposables.push(sphereGeo, haloGeo);

    const nodes: THREE.Mesh[] = [];
    const halos: THREE.Mesh[] = [];
    const haloMats: THREE.MeshBasicMaterial[] = [];

    STAGES.forEach((stage, i) => {
      const angle = i * STEP;
      const x = Math.cos(angle) * RADIUS;
      const z = Math.sin(angle) * RADIUS;

      const mat = new THREE.MeshStandardMaterial({
        color: stage.color,
        roughness: 0.15,
        metalness: 0.1,
      });
      const sphere = new THREE.Mesh(sphereGeo, mat);
      sphere.position.set(x, 0, z);
      sphere.castShadow = true;
      group.add(sphere);
      nodes.push(sphere);

      const haloMat = new THREE.MeshBasicMaterial({
        color: stage.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = -Math.PI / 2;
      halo.position.set(x, -0.02, z);
      group.add(halo);
      halos.push(halo);
      haloMats.push(haloMat);

      disposables.push(mat, haloMat);
    });

    // Orbital conduit
    const curvePoints: THREE.Vector3[] = [];
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      curvePoints.push(new THREE.Vector3(Math.cos(a) * RADIUS, Math.sin(a * 3) * 0.3, Math.sin(a) * RADIUS));
    }
    const curve = new THREE.CatmullRomCurve3(curvePoints, true);
    const tubeGeo = new THREE.TubeGeometry(curve, 360, 0.05, 12, true);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.3,
      metalness: 0.6,
      transparent: true,
      opacity: 0.85,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.castShadow = true;
    group.add(tube);
    disposables.push(tubeGeo, tubeMat);

    // Flowing data packets along the conduit (NormalBlending stays visible on white)
    const dotTexture = makeDotTexture();
    disposables.push(dotTexture);

    // Packets ride on the top surface of the conduit (not its centerline), otherwise the
    // tube's front face hides them. Sparse spacing makes each one read as a discrete packet.
    const PACKET_LIFT = 0.07;
    const particleCount = 64;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const blue = new THREE.Color("#0071e3");
    const emerald = new THREE.Color("#34c759");
    const tmp = new THREE.Vector3();
    for (let i = 0; i < particleCount; i++) {
      curve.getPointAt(i / particleCount, tmp);
      particlePos.set([tmp.x, tmp.y + PACKET_LIFT, tmp.z], i * 3);
      const c = i % 2 === 0 ? blue : emerald;
      particleColors.set([c.r, c.g, c.b], i * 3);
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));
    // With size attenuation, 0.16 world units is only ~3px at this distance — thinner than
    // the conduit. 0.4 renders a crisp ~7px dot.
    const particleMat = new THREE.PointsMaterial({
      size: 0.4,
      map: dotTexture,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const packets = new THREE.Points(particleGeo, particleMat);
    packets.renderOrder = 2; // draw after the translucent conduit
    group.add(packets);
    disposables.push(particleGeo, particleMat);

    // Incoming attacks: drift in from outside and are intercepted at the conduit.
    const attackCount = 28;
    const attackGeo = new THREE.BufferGeometry();
    const attackPos = new Float32Array(attackCount * 3);
    const attackState = Array.from({ length: attackCount }, () => ({
      angle: Math.random() * Math.PI * 2,
      r: 7 + Math.random() * 5,
      y: (Math.random() - 0.5) * 3,
      speed: 0.9 + Math.random() * 0.9,
    }));
    const placeAttack = (i: number) => {
      const s = attackState[i];
      attackPos[i * 3] = Math.cos(s.angle) * s.r;
      attackPos[i * 3 + 1] = s.y * ((s.r - RADIUS) / 6);
      attackPos[i * 3 + 2] = Math.sin(s.angle) * s.r;
    };
    attackState.forEach((_, i) => placeAttack(i));
    attackGeo.setAttribute("position", new THREE.BufferAttribute(attackPos, 3));
    const attackMat = new THREE.PointsMaterial({
      size: 0.24,
      map: dotTexture,
      color: 0xff3b30,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    group.add(new THREE.Points(attackGeo, attackMat));
    disposables.push(attackGeo, attackMat);

    // ── Interaction ───────────────────────────────────────────
    let pointerX = 0;
    let pointerY = 0;
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    const handlePointerLeave = () => {
      pointerX = 0;
      pointerY = 0;
    };
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      // Pull the camera back on narrow screens so the whole ring stays in frame.
      camera.position.z = w / h < 1 ? 23 : 15.5;
      camera.lookAt(0, -0.6, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    let visible = true;
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    intersection.observe(container);

    // ── Animation: a turnstile that steps through the stages ──
    // `step` counts forward forever; the active stage is step mod 6, and the group turns
    // to rotation.y = step·STEP − π/2, which brings that stage's node to the front.
    let step = 4;
    let lastAdvance = 0;
    let holdUntil = 0;
    let rotY = step * STEP - Math.PI / 2;
    let tiltX = 0;
    let parallaxY = 0;
    let lastIndex = -1;
    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!visible) return;

      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      // A stage chosen from the rail: turn the shortest way to it and hold.
      const requested = requestedStageRef.current;
      if (requested !== null) {
        requestedStageRef.current = null;
        let d = (((requested - step) % STAGE_COUNT) + STAGE_COUNT) % STAGE_COUNT;
        if (d > STAGE_COUNT / 2) d -= STAGE_COUNT;
        step += d;
        holdUntil = t + HOLD_SECONDS;
        lastAdvance = t;
      }

      if (!pausedRef.current && t > holdUntil && t - lastAdvance > DWELL_SECONDS) {
        step += 1;
        lastAdvance = t;
      }

      const index = ((step % STAGE_COUNT) + STAGE_COUNT) % STAGE_COUNT;
      if (index !== lastIndex) {
        lastIndex = index;
        setActiveIndex(index);
      }

      const targetRot = step * STEP - Math.PI / 2;
      const ease = reducedMotion ? 1 : 1 - Math.exp(-dt * 3.2);
      rotY += (targetRot - rotY) * ease;
      tiltX += (pointerY * 0.12 - tiltX) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 3));
      parallaxY += (pointerX * 0.3 - parallaxY) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 3));

      group.rotation.y = rotY + parallaxY;
      group.rotation.x = 0.08 + tiltX;
      group.position.y = reducedMotion ? 0 : Math.sin(t * 0.8) * 0.08;

      // One orchestrated entrance: nodes rise into place in sequence while the conduit fades in.
      const intro = reducedMotion ? 10 : t;
      tubeMat.opacity = 0.85 * clamp01(intro / 1.1);

      nodes.forEach((mesh, i) => {
        const appear = easeOutBack(clamp01((intro - 0.15 - i * 0.1) / 0.55));
        const isActive = i === index;
        const targetScale = isActive ? 1.32 : 1;
        const current = (mesh.userData.scale as number | undefined) ?? 1;
        const next = current + (targetScale - current) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 6));
        mesh.userData.scale = next;
        mesh.scale.setScalar(Math.max(0.001, next * appear));

        const halo = halos[i];
        const haloScale = isActive ? 1.55 : 1;
        const hs = halo.scale.x + (haloScale - halo.scale.x) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 5));
        halo.scale.setScalar(Math.max(0.001, hs * appear));
        haloMats[i].opacity = isActive ? 0.55 : 0.25;
      });

      if (!reducedMotion) {
        const positions = particleGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          curve.getPointAt((i / particleCount + t * 0.035) % 1, tmp);
          positions[i * 3] = tmp.x;
          positions[i * 3 + 1] = tmp.y + PACKET_LIFT;
          positions[i * 3 + 2] = tmp.z;
        }
        particleGeo.attributes.position.needsUpdate = true;

        for (let i = 0; i < attackCount; i++) {
          const s = attackState[i];
          s.r -= s.speed * dt;
          if (s.r < RADIUS + 0.35) {
            // intercepted at the conduit: respawn outside
            s.r = 11 + Math.random() * 2;
            s.angle = Math.random() * Math.PI * 2;
            s.y = (Math.random() - 0.5) * 3;
          }
          placeAttack(i);
        }
        attackGeo.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      resizeObserver.disconnect();
      intersection.disconnect();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const stage = STAGES[activeIndex];

  const selectStage = (i: number) => {
    requestedStageRef.current = i;
    setActiveIndex(i);
  };

  return (
    <figure className="w-full">
      <div data-tour="loop" className="relative w-full h-[440px] sm:h-[500px] md:h-[560px] rounded-stage border border-black/[0.06] bg-gradient-to-b from-[#fbfbfd] via-white to-[#f5f5f7] overflow-hidden">
        {/* Three.js canvas */}
        <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />

        {/* Stage HUD */}
        <div className="absolute top-4 left-4 right-4 sm:right-auto sm:top-5 sm:left-5 z-10 pointer-events-none apple-glass rounded-2xl p-3.5 shadow-sm sm:max-w-[300px] text-left">
          <p className="text-[12px] font-medium text-apple-muted">The attack-defense loop</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full transition-colors duration-500"
              style={{ backgroundColor: stage.color }}
            />
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-apple-text">
              {activeIndex + 1}. {stage.title}
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-snug text-apple-secondary">{stage.description}</p>
        </div>

        {/* Stage rail */}
        <div className="absolute bottom-4 inset-x-0 z-10 flex justify-center px-3">
          <div
            role="group"
            aria-label="Pipeline stages"
            className="apple-glass rounded-full p-1 shadow-sm flex items-center gap-0.5 max-w-full overflow-x-auto"
          >
            {STAGES.map((s, i) => {
              const active = i === activeIndex;
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => selectStage(i)}
                  aria-pressed={active}
                  aria-label={`${i + 1}. ${s.name}: ${s.title}`}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-[11px] font-semibold tracking-[0.02em] whitespace-nowrap transition-colors ${
                    active ? "bg-white text-apple-text shadow-pill" : "text-apple-secondary hover:text-apple-text"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className={active ? "inline" : "hidden sm:inline"}>{s.name}</span>
                </button>
              );
            })}
            <span className="w-px h-4 bg-black/10 mx-1 shrink-0" />
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Resume the loop" : "Pause the loop"}
              className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-apple-secondary hover:text-apple-text hover:bg-black/[0.05] transition-colors"
            >
              {paused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            </button>
          </div>
        </div>
      </div>

      <figcaption className="mt-4 flex flex-col sm:flex-row sm:flex-wrap justify-center gap-x-6 gap-y-1.5 text-[12px] text-apple-muted">
        <span className="inline-flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
          Attacks: intercepted via Canary + Sandbox
        </span>
        <span className="inline-flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
          Utility: auto-revert triggered when Toll &gt; 10 pts
        </span>
        <span className="hidden md:inline">Move the pointer to tilt the loop. Pick a stage to bring it forward.</span>
      </figcaption>
    </figure>
  );
};
