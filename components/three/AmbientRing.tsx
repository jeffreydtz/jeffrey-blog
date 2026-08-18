"use client";

import { useEffect, useRef } from "react";

export function AmbientRing() {
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
      const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
      camera.position.set(0, 0, 4.5);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      root.appendChild(renderer.domElement);

      const ink = new THREE.Color(inkStr);

      /* Anillo principal — toro fino de grabado */
      const ringGeo = new THREE.TorusGeometry(1.15, 0.018, 24, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ink,
        transparent: true,
        opacity: 0.06,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 3;
      scene.add(ring);

      /* Anillo interior aún más fino — trazo de buril */
      const innerGeo = new THREE.TorusGeometry(1.15, 0.006, 12, 48);
      const innerMat = new THREE.MeshBasicMaterial({
        color: ink,
        transparent: true,
        opacity: 0.035,
      });
      const innerRing = new THREE.Mesh(innerGeo, innerMat);
      innerRing.rotation.x = Math.PI / 3;
      innerRing.rotation.z = 0.3;
      scene.add(innerRing);

      let mouseX = 0;
      let mouseY = 0;
      let frameId: number;

      function animate() {
        frameId = requestAnimationFrame(animate);

        /* Rotación lentísima — casi estática */
        ring.rotation.y += 0.0008;
        innerRing.rotation.y += 0.001;

        /* Pointer-follow casi imperceptible */
        const tx = mouseY * 0.015;
        const ty = mouseX * 0.02;
        ring.rotation.x += (Math.PI / 3 + tx - ring.rotation.x) * 0.01;
        ring.rotation.z += (ty - ring.rotation.z) * 0.01;
        innerRing.rotation.x += (Math.PI / 3 + tx - innerRing.rotation.x) * 0.01;
        innerRing.rotation.z += (0.3 + ty - innerRing.rotation.z) * 0.01;

        renderer.render(scene, camera);
      }
      animate();

      function onPointer(e: PointerEvent) {
        const r = root.getBoundingClientRect();
        mouseX = (e.clientX - r.left) / r.width - 0.5;
        mouseY = (e.clientY - r.top) / r.height - 0.5;
      }

      function onResize() {
        const r = root.getBoundingClientRect();
        const rw = r.width;
        const rh = r.height;
        if (rw === 0 || rh === 0) return;
        camera.aspect = rw / rh;
        camera.updateProjectionMatrix();
        renderer.setSize(rw, rh);
      }

      /* MutationObserver: actualizar color al cambiar tema */
      const observer = new MutationObserver(() => {
        const s = getComputedStyle(document.documentElement);
        const newInk = s.getPropertyValue("--ink").trim();
        if (newInk) {
          const c = new THREE.Color(newInk);
          ringMat.color.copy(c);
          innerMat.color.copy(c);
        }
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      window.addEventListener("pointermove", onPointer);
      window.addEventListener("resize", onResize);

      cleanup = () => {
        observer.disconnect();
        cancelAnimationFrame(frameId);
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("resize", onResize);
        renderer.forceContextLoss();
        renderer.dispose();
        ringGeo.dispose();
        ringMat.dispose();
        innerGeo.dispose();
        innerMat.dispose();
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
      className="pointer-events-none absolute right-0 top-0 z-0 size-3xl"
    />
  );
}