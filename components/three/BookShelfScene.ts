import * as THREE from "three";
import type { LibraryBook } from "@/lib/library-data";

/** World-space dimensions describe bindings, not CSS layout. No continuous idle loop. */
export function createBookShelfScene(
  host: HTMLDivElement,
  books: LibraryBook[],
  onSelect: (index: number) => void,
  onFailure: () => void,
) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const removers: (() => void)[] = [];
  let renderer: THREE.WebGLRenderer | undefined;
  let frame = 0;
  let disposed = false;
  let selected = 0;
  const bindings: THREE.Group[] = [];
  const covers: THREE.MeshStandardMaterial[] = [];
  const pages: THREE.MeshStandardMaterial[] = [];
  const labels: {
    canvas: HTMLCanvasElement;
    texture: THREE.CanvasTexture;
    index: number;
  }[] = [];
  const motion = matchMedia("(prefers-reduced-motion: reduce)");

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    removers.forEach((remove) => remove());
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
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
  function box(w: number, h: number, d: number, material: THREE.Material) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    geometries.push(geometry);
    return new THREE.Mesh(geometry, material);
  }

  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 2));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(-4, 6, 7);
    scene.add(light);
    books.forEach((book, index) => {
      const binding = new THREE.Group();
      const height = 2.35 + (index % 3) * 0.15;
      const depth = 0.42 + (index % 2) * 0.08;
      const cover = new THREE.MeshStandardMaterial({ roughness: 0.9 });
      const paper = new THREE.MeshStandardMaterial({ roughness: 1 });
      covers.push(cover);
      pages.push(paper);
      materials.push(cover, paper);
      const block = box(0.65, height - 0.09, depth - 0.05, paper);
      binding.add(block);
      for (const side of [-1, 1]) {
        const board = box(0.71, height, 0.035, cover);
        board.position.z = (side * depth) / 2;
        binding.add(board);
      }
      const spine = box(0.055, height, depth, cover);
      spine.position.x = -0.34;
      binding.add(spine);
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 768;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.push(texture);
      labels.push({ canvas, texture, index });
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      });
      materials.push(labelMaterial);
      const labelGeometry = new THREE.PlaneGeometry(0.58, height * 0.85);
      geometries.push(labelGeometry);
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.z = depth / 2 + 0.019;
      binding.add(label);
      binding.position.set(
        (index - (books.length - 1) / 2) * 0.84,
        height / 2 - 1.3,
        0,
      );
      binding.rotation.y = -0.3;
      binding.userData.index = index;
      binding.userData.baseY = binding.position.y;
      binding.traverse((child) => {
        child.userData.index = index;
      });
      bindings.push(binding);
      scene.add(binding);
    });
    const shelfMaterial = new THREE.MeshStandardMaterial({ roughness: 1 });
    materials.push(shelfMaterial);
    const shelf = box(books.length * 0.84 + 0.7, 0.06, 1.25, shelfMaterial);
    shelf.position.y = -1.34;
    scene.add(shelf);

    function updatePalette() {
      const style = getComputedStyle(document.documentElement);
      const color = (name: string) => style.getPropertyValue(name).trim();
      covers.forEach((material, i) =>
        material.color.set(color(i % 2 ? "--ink-secondary" : "--ink")),
      );
      pages.forEach((material) => material.color.set(color("--paper")));
      shelfMaterial.color.set(color("--hairline"));
      labels.forEach(({ canvas, texture, index }) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = color("--paper");
        ctx.textAlign = "center";
        ctx.font = `30px ${style.getPropertyValue("--font-body").trim() || "serif"}`;
        ctx.fillText(String(index + 1).padStart(2, "0"), 128, 90);
        // Typeset actual titles as binding labels, never fabricated artwork.
        ctx.font = `34px ${style.getPropertyValue("--font-display").trim() || "serif"}`;
        const lines: string[] = [];
        let line = "";
        for (const word of books[index].title.split(/\s+/)) {
          if (ctx.measureText(`${line} ${word}`).width > 204 && line) {
            lines.push(line);
            line = word;
          } else line = line ? `${line} ${word}` : word;
        }
        if (line) lines.push(line);
        lines
          .slice(0, 11)
          .forEach((text, row) => ctx.fillText(text, 128, 230 + row * 42, 210));
        ctx.fillRect(68, 660, 120, 2);
        texture.needsUpdate = true;
      });
      draw();
    }
    function resize() {
      if (disposed || !renderer) return;
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      const span = books.length * 0.84 + 1.2;
      const distance = Math.max(
        7.5,
        span / (2 * Math.tan(THREE.MathUtils.degToRad(16)) * camera.aspect),
      );
      camera.position.set(0.7, 2.1, distance);
      camera.lookAt(0, 0.15, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      draw();
    }
    function select(index: number) {
      selected = index;
      cancelAnimationFrame(frame);
      const initial = bindings.map((binding) => binding.position.z);
      const start = performance.now();
      const duration =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--duration-fast",
          ),
        ) || 150;
      function step(time: number) {
        if (disposed) return;
        const progress = motion.matches
          ? 1
          : Math.min((time - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        bindings.forEach((binding, i) => {
          const target = i === selected ? 0.32 : 0;
          binding.position.z = initial[i] + (target - initial[i]) * eased;
          binding.position.y =
            binding.userData.baseY + binding.position.z * 0.35;
        });
        draw();
        if (progress < 1 && !disposed) frame = requestAnimationFrame(step);
      }
      step(start);
    }
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDown: { x: number; y: number } | undefined;
    function down(event: PointerEvent) {
      pointerDown = { x: event.clientX, y: event.clientY };
    }
    function up(event: PointerEvent) {
      if (
        !pointerDown ||
        Math.hypot(
          event.clientX - pointerDown.x,
          event.clientY - pointerDown.y,
        ) > 10
      )
        return;
      pointerDown = undefined;
      const rect = host.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(bindings, true)[0];
      if (hit) onSelect(hit.object.userData.index as number);
    }
    const lost = () => fail();
    const motionChanged = () => select(selected);
    const observer = new MutationObserver(updatePalette);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    removers.push(() => observer.disconnect());
    const resizer = new ResizeObserver(resize);
    resizer.observe(host);
    removers.push(() => resizer.disconnect());
    host.addEventListener("pointerdown", down);
    host.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("webglcontextlost", lost);
    motion.addEventListener("change", motionChanged);
    removers.push(() => {
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("pointerup", up);
      renderer?.domElement.removeEventListener("webglcontextlost", lost);
      motion.removeEventListener("change", motionChanged);
    });
    updatePalette();
    resize();
    select(0);
    void document.fonts.ready.then(() => {
      if (!disposed) updatePalette();
    });
    return { select, dispose };
  } catch {
    fail();
    return { select: () => {}, dispose };
  }
}
