"use client";

import { useEffect, useRef } from "react";

export function EndMark() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const root = container;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");

    let cancelled = false;
    let want = !mql.matches;
    let cleanup: (() => void) | undefined;
    let starting = false;

    async function start() {
      if (cleanup || starting || !want) return;
      starting = true;

      const style = getComputedStyle(document.documentElement);
      const inkStr = style.getPropertyValue("--ink").trim();
      if (!inkStr) {
        starting = false;
        return;
      }

      const THREE = await import("three");
      if (cancelled || !want) {
        starting = false;
        return;
      }

      const rect = root.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) {
        starting = false;
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
      camera.position.set(0, 0, 3);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      root.appendChild(renderer.domElement);

      const ink = new THREE.Color(inkStr);

      /* Marca de impresor — toro fino, familia visual de AmbientRing */
      const geo = new THREE.TorusGeometry(0.5, 0.015, 16, 32);
      const mat = new THREE.MeshBasicMaterial({
        color: ink,
        transparent: true,
        opacity: 0.14,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 3;
      scene.add(mesh);

      let frameId: number;

      function animate() {
        frameId = requestAnimationFrame(animate);
        mesh.rotation.y += 0.002;
        renderer.render(scene, camera);
      }
      animate();

      function onResize() {
        const r = root.getBoundingClientRect();
        const rw = r.width;
        const rh = r.height;
        if (rw === 0 || rh === 0) return;
        camera.aspect = rw / rh;
        camera.updateProjectionMatrix();
        renderer.setSize(rw, rh);
      }

      const observer = new MutationObserver(() => {
        const s = getComputedStyle(document.documentElement);
        const newInk = s.getPropertyValue("--ink").trim();
        if (newInk) {
          mat.color.copy(new THREE.Color(newInk));
        }
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      window.addEventListener("resize", onResize);

      cleanup = () => {
        observer.disconnect();
        cancelAnimationFrame(frameId);
        window.removeEventListener("resize", onResize);
        renderer.forceContextLoss();
        renderer.dispose();
        geo.dispose();
        mat.dispose();
        if (root.contains(renderer.domElement)) {
          root.removeChild(renderer.domElement);
        }
      };

      starting = false;
      if (cancelled || !want) stop();
    }

    function stop() {
      cleanup?.();
      cleanup = undefined;
    }

    if (want) {
      void start();
    }

    function onMotionChange() {
      want = !mql.matches;
      if (want) {
        void start();
      } else {
        stop();
      }
    }

    mql.addEventListener("change", onMotionChange);

    return () => {
      cancelled = true;
      mql.removeEventListener("change", onMotionChange);
      stop();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none mx-auto mt-xl size-xl select-none"
    />
  );
}