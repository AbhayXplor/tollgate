"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export const HeroScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStage, setActiveStage] = useState<string>("GATE");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 4, 18);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Loop Nodes Configuration
    const stages = [
      { name: "BREAK", color: 0xef4444, label: "1. Red Team Break" },
      { name: "DIAGNOSE", color: 0x06b6d4, label: "2. Root Cause Trace" },
      { name: "PATCH", color: 0x3b82f6, label: "3. Synthesize Patch" },
      { name: "PRICE", color: 0xf59e0b, label: "4. Price The Toll" },
      { name: "GATE", color: 0x10b981, label: "5. Mechanical Gate" },
      { name: "REVERT / SHIP", color: 0xa855f7, label: "6. Ship or Auto-Revert" },
    ];

    const radius = 6.2;
    const nodeMeshes: THREE.Mesh[] = [];
    const group = new THREE.Group();
    scene.add(group);

    // Create 6 Main Nodes
    stages.forEach((stage, i) => {
      const angle = (i / stages.length) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Outer Glow Ring
      const ringGeo = new THREE.RingGeometry(0.7, 0.85, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: stage.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0, z);
      group.add(ring);

      // Core Node Sphere
      const sphereGeo = new THREE.SphereGeometry(0.4, 24, 24);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: stage.color,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(x, 0, z);
      group.add(sphere);
      nodeMeshes.push(sphere);
    });

    // Connecting Spline / Ring Conduit
    const curvePoints: THREE.Vector3[] = [];
    const segments = 100;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      curvePoints.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle * 3) * 0.3,
          Math.sin(angle) * radius
        )
      );
    }
    const curve = new THREE.CatmullRomCurve3(curvePoints, true);
    const tubeGeo = new THREE.TubeGeometry(curve, 100, 0.04, 8, true);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x1e2c4f,
      transparent: true,
      opacity: 0.8,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    group.add(tube);

    // Flowing Particles (Data Packets)
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const pt = curve.getPoint(t);
      particlePos[i * 3] = pt.x;
      particlePos[i * 3 + 1] = pt.y;
      particlePos[i * 3 + 2] = pt.z;

      // Color gradation (greenish-cyan conduit)
      particleColors[i * 3] = 0.1;
      particleColors[i * 3 + 1] = 0.8;
      particleColors[i * 3 + 2] = 0.6;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    group.add(particleSystem);

    // Attack Beam Particles (Red arrows flying towards the gate)
    const attackParticlesCount = 30;
    const attackGeo = new THREE.BufferGeometry();
    const attackPos = new Float32Array(attackParticlesCount * 3);
    for (let i = 0; i < attackParticlesCount; i++) {
      attackPos[i * 3] = (Math.random() - 0.5) * 16;
      attackPos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      attackPos[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    attackGeo.setAttribute("position", new THREE.BufferAttribute(attackPos, 3));
    const attackMat = new THREE.PointsMaterial({
      size: 0.22,
      color: 0xef4444,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const attackSystem = new THREE.Points(attackGeo, attackMat);
    group.add(attackSystem);

    // Interactive Mouse Tracking
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    container.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth slow rotation of the loop
      group.rotation.y = elapsedTime * 0.2 + mouseX * 0.4;
      group.rotation.x = Math.sin(elapsedTime * 0.3) * 0.15 + mouseY * 0.2;

      // Animate flowing conduit particles
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        let t = (i / particleCount + elapsedTime * 0.1) % 1;
        const pt = curve.getPoint(t);
        positions[i * 3] = pt.x;
        positions[i * 3 + 1] = pt.y;
        positions[i * 3 + 2] = pt.z;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Pulse active nodes
      const activeIdx = Math.floor((elapsedTime * 0.5) % stages.length);
      setActiveStage(stages[activeIdx].name);

      nodeMeshes.forEach((mesh, idx) => {
        const scale = idx === activeIdx ? 1.4 + Math.sin(elapsedTime * 8) * 0.2 : 1.0;
        mesh.scale.set(scale, scale, scale);
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[460px] md:h-[540px] flex items-center justify-center overflow-hidden">
      {/* Three.js canvas container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Cyberpunk HUD Overlays */}
      <div className="absolute top-4 left-4 z-10 font-mono text-[11px] text-cyber-muted space-y-1 pointer-events-none bg-cyber-bg/60 p-3 rounded border border-cyber-border/40 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyber-accent animate-ping" />
          <span className="text-cyber-accent font-semibold">THE ATTACK-DEFENSE LOOP</span>
        </div>
        <div className="text-cyber-dim">Active Pipeline State: <span className="text-cyber-text font-bold glow-emerald">{activeStage}</span></div>
        <div className="text-[10px] text-cyber-muted">Rotates 3D &middot; Click & Drag Parallax</div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 font-mono text-[11px] text-cyber-muted pointer-events-none bg-cyber-bg/60 p-3 rounded border border-cyber-border/40 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-cyber-danger">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-danger" />
          <span>Attacks: Intercepted via Canary + Sandbox</span>
        </div>
        <div className="flex items-center gap-2 text-cyber-accent mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-accent" />
          <span>Utility: Auto-revert triggered when Toll &gt; 10 pts</span>
        </div>
      </div>
    </div>
  );
};
