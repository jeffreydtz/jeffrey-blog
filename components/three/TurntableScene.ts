import * as THREE from "three";
import type { VinylRecord } from "@/lib/vinyl-data";

/**
 * Tocadiscos procedural (v1).
 *
 * TODO(later): sustituir plinto + brazo por un GLB de Astra/Blender. Conservar
 * este factory (`setRecord`, dispose, paleta CSS, spin/reduced-motion) para
 * que el host React no cambie. El vinilo puede seguir siendo procedural
 * (surcos + sello) encima del mesh importado.
 */

export function createTurntableScene(
  host: HTMLDivElement,
  initial: VinylRecord,
  onFailure: () => void,
) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const removers: (() => void)[] = [];
  let renderer: THREE.WebGLRenderer | undefined;
  let frame = 0;
  let disposed = false;
  let visible = false;
  let lastTime = 0;
  let coverGeneration = 0;
  let coverTexture: THREE.Texture | null = null;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const recordGroup = new THREE.Group();
  const armGroup = new THREE.Group();
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");

  const plinthMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
  const plateMat = new THREE.MeshStandardMaterial({ roughness: 0.85 });
  const platterMat = new THREE.MeshStandardMaterial({ roughness: 0.7 });
  const vinylSideMat = new THREE.MeshStandardMaterial({ roughness: 0.55 });
  const vinylTopMat = new THREE.MeshStandardMaterial({ roughness: 0.6 });
  const vinylBottomMat = new THREE.MeshStandardMaterial({ roughness: 0.7 });
  const armMat = new THREE.MeshStandardMaterial({ roughness: 0.45 });
  const labelMat = new THREE.MeshBasicMaterial();
  materials.push(
    plinthMat,
    plateMat,
    platterMat,
    vinylSideMat,
    vinylTopMat,
    vinylBottomMat,
    armMat,
    labelMat,
  );

  const grooveCanvas = document.createElement("canvas");
  grooveCanvas.width = 512;
  grooveCanvas.height = 512;
  const grooveTexture = new THREE.CanvasTexture(grooveCanvas);
  grooveTexture.colorSpace = THREE.SRGBColorSpace;
  grooveTexture.anisotropy = 4;
  textures.push(grooveTexture);
  vinylTopMat.map = grooveTexture;

  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 512;
  labelCanvas.height = 512;
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  textures.push(labelTexture);
  labelMat.map = labelTexture;

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    removers.forEach((remove) => remove());
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    coverTexture?.dispose();
    scene.clear();
    renderer?.dispose();
    renderer?.forceContextLoss();
    renderer?.domElement.remove();
  }

  function fail() {
    dispose();
    onFailure();
  }

  function draw() {
    if (disposed || !renderer) return;
    try {
      renderer.render(scene, camera);
    } catch {
      fail();
    }
  }

  function mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[],
  ) {
    geometries.push(geometry);
    return new THREE.Mesh(geometry, material);
  }

  function box(
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const item = mesh(new THREE.BoxGeometry(w, h, d), material);
    item.position.set(x, y, z);
    return item;
  }

  function cylinder(
    rTop: number,
    rBottom: number,
    h: number,
    material: THREE.Material | THREE.Material[],
    segments = 48,
  ) {
    return mesh(
      new THREE.CylinderGeometry(rTop, rBottom, h, segments),
      material,
    );
  }

  function tokens() {
    const style = getComputedStyle(document.documentElement);
    const color = (name: string) => style.getPropertyValue(name).trim();
    return {
      paper: color("--paper"),
      paperRaised: color("--paper-raised"),
      ink: color("--ink"),
      inkSecondary: color("--ink-secondary"),
      inkMuted: color("--ink-muted"),
      hairline: color("--hairline"),
      bodyFont: style.getPropertyValue("--font-body").trim() || "serif",
      displayFont: style.getPropertyValue("--font-display").trim() || "serif",
      period: parseFloat(style.getPropertyValue("--vinyl-period")) || 5,
    };
  }

  let spinPeriod = 5;

  function paintGrooves() {
    const { ink, hairline, paper } = tokens();
    const ctx = grooveCanvas.getContext("2d");
    if (!ctx) return;
    const size = grooveCanvas.width;
    const cx = size / 2;
    const cy = size / 2;
    ctx.fillStyle = ink;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = hairline;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 1;
    for (let radius = 48; radius < size / 2 - 8; radius += 3) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 86, 0, Math.PI * 2);
    ctx.fillStyle = paper;
    ctx.fill();
    grooveTexture.needsUpdate = true;
  }

  function wrapTitle(
    ctx: CanvasRenderingContext2D,
    value: string,
    font: string,
    maxWidth: number,
    size: number,
  ) {
    ctx.font = `${size}px ${font}`;
    const lines: string[] = [];
    let line = "";
    for (const word of value.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  }

  function paintTypography(record: VinylRecord) {
    const { paper, ink, inkMuted, displayFont, bodyFont } = tokens();
    const ctx = labelCanvas.getContext("2d");
    if (!ctx) return;
    const size = labelCanvas.width;
    ctx.fillStyle = paper;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let titleSize = 42;
    let lines = wrapTitle(
      ctx,
      record.title,
      displayFont,
      size * 0.7,
      titleSize,
    );
    while (lines.length > 3 && titleSize > 26) {
      titleSize -= 2;
      lines = wrapTitle(ctx, record.title, displayFont, size * 0.7, titleSize);
    }
    const start = size * 0.42 - ((lines.length - 1) * titleSize) / 1.6;
    lines.forEach((line, row) => {
      ctx.fillText(line, size / 2, start + row * titleSize * 1.15, size * 0.78);
    });
    ctx.fillStyle = inkMuted;
    ctx.font = `28px ${bodyFont}`;
    ctx.fillText(record.artist, size / 2, size * 0.7, size * 0.72);
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 14, 0, Math.PI * 2);
    ctx.fill();
    labelTexture.needsUpdate = true;
    labelMat.map = labelTexture;
    labelMat.needsUpdate = true;
  }

  function setLabelMap(map: THREE.Texture) {
    labelMat.map = map;
    labelMat.needsUpdate = true;
  }

  function palette() {
    const t = tokens();
    plinthMat.color.set(t.inkSecondary);
    plateMat.color.set(t.paperRaised);
    platterMat.color.set(t.inkMuted);
    vinylSideMat.color.set(t.ink);
    vinylBottomMat.color.set(t.ink);
    armMat.color.set(t.ink);
    spinPeriod = t.period;
    paintGrooves();
  }

  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.9);
    key.position.set(-3.5, 6.5, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.45);
    fill.position.set(4, 2.5, -2);
    scene.add(fill);

    const deck = new THREE.Group();
    deck.add(box(3.7, 0.18, 2.55, plinthMat, 0, 0, 0));
    deck.add(box(3.42, 0.03, 2.28, plateMat, 0, 0.1, 0));
    for (const [x, z] of [
      [-1.55, -0.95],
      [1.55, -0.95],
      [-1.55, 0.95],
      [1.55, 0.95],
    ] as const) {
      deck.add(box(0.16, 0.06, 0.16, plinthMat, x, -0.12, z));
    }
    const platter = cylinder(1.14, 1.14, 0.05, platterMat, 64);
    platter.position.set(-0.52, 0.145, 0.08);
    deck.add(platter);
    const mat = cylinder(1.08, 1.08, 0.012, plateMat, 64);
    mat.position.set(-0.52, 0.176, 0.08);
    deck.add(mat);

    const vinyl = cylinder(
      1.05,
      1.05,
      0.035,
      [vinylSideMat, vinylTopMat, vinylBottomMat],
      64,
    );
    const label = mesh(new THREE.CircleGeometry(0.34, 48), labelMat);
    label.rotation.x = -Math.PI / 2;
    label.position.y = 0.02;
    const spindle = cylinder(0.018, 0.018, 0.07, armMat, 16);
    spindle.position.y = 0.04;
    recordGroup.add(vinyl, label, spindle);
    recordGroup.position.set(-0.52, 0.2, 0.08);
    deck.add(recordGroup);

    const pivot = box(0.22, 0.16, 0.22, armMat, 0, 0, 0);
    const arm = box(0.045, 0.035, 1.55, armMat, 0, 0.04, 0.72);
    const head = box(0.08, 0.03, 0.16, armMat, 0, 0.01, 1.48);
    armGroup.add(pivot, arm, head);
    armGroup.position.set(1.22, 0.28, -0.72);
    armGroup.rotation.y = 0.42;
    deck.add(armGroup);
    scene.add(deck);

    function needlePose(playing: boolean) {
      armGroup.rotation.x = playing && !motion.matches ? -0.04 : -0.18;
    }

    function resize() {
      if (disposed || !renderer) return;
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.position.set(0.15, 2.55, 3.55);
      camera.lookAt(0, 0.12, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      draw();
    }

    function shouldSpin() {
      return visible && !motion.matches && !document.hidden;
    }

    function loop(time: number) {
      if (disposed) return;
      if (!shouldSpin()) {
        lastTime = 0;
        needlePose(false);
        draw();
        return;
      }
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
      lastTime = time;
      needlePose(true);
      recordGroup.rotation.y += ((Math.PI * 2) / spinPeriod) * dt;
      draw();
      frame = requestAnimationFrame(loop);
    }

    function syncLoop() {
      cancelAnimationFrame(frame);
      lastTime = 0;
      needlePose(shouldSpin());
      draw();
      if (!disposed && shouldSpin()) frame = requestAnimationFrame(loop);
    }

    function setRecord(record: VinylRecord) {
      if (disposed) return;
      const generation = ++coverGeneration;
      paintTypography(record);
      draw();
      if (!record.coverUrl) return;
      loader.load(
        record.coverUrl,
        (texture) => {
          if (disposed || generation !== coverGeneration) {
            texture.dispose();
            return;
          }
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(
            renderer?.capabilities.getMaxAnisotropy() ?? 1,
            4,
          );
          coverTexture?.dispose();
          coverTexture = texture;
          setLabelMap(texture);
          draw();
        },
        undefined,
        () => {
          if (disposed || generation !== coverGeneration) return;
          paintTypography(record);
          draw();
        },
      );
    }

    const lost = () => fail();
    const onMotion = () => syncLoop();
    const onVisibility = () => syncLoop();
    const view = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        syncLoop();
      },
      { threshold: 0.12 },
    );
    view.observe(host);
    removers.push(() => view.disconnect());

    const paletteWatch = new MutationObserver(() => {
      palette();
      draw();
    });
    paletteWatch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    removers.push(() => paletteWatch.disconnect());

    const resizer = new ResizeObserver(resize);
    resizer.observe(host);
    removers.push(() => resizer.disconnect());

    renderer.domElement.addEventListener("webglcontextlost", lost);
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    removers.push(() => {
      renderer?.domElement.removeEventListener("webglcontextlost", lost);
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    });

    palette();
    setRecord(initial);
    resize();
    syncLoop();

    return { setRecord, dispose };
  } catch {
    fail();
    return { setRecord: () => {}, dispose };
  }
}
