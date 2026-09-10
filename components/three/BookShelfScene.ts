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
    spine: boolean;
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
    scene.add(new THREE.AmbientLight(0xffffff, 1.7));
    const light = new THREE.DirectionalLight(0xffffff, 2.2);
    light.position.set(-4, 6, 7);
    scene.add(light);
    books.forEach((book, index) => {
      const binding = new THREE.Group();
      const height = 2.5 + (index % 3) * 0.12;
      const width = 1.65;
      const depth = 0.26 + (index % 3) * 0.035;
      const cover = new THREE.MeshStandardMaterial({ roughness: 0.95 });
      const paper = new THREE.MeshStandardMaterial({ roughness: 1 });
      covers.push(cover);
      pages.push(paper);
      materials.push(cover, paper);
      binding.add(box(width - 0.08, height - 0.1, depth - 0.035, paper));
      for (const side of [-1, 1]) {
        const board = box(width, height, 0.035, cover);
        board.position.z = (side * depth) / 2;
        binding.add(board);
      }
      const spine = box(0.06, height, depth, cover);
      spine.position.x = -width / 2;
      binding.add(spine);
      // Fine page edges and raised bands make the volume readable as an object.
      for (let page = 1; page < 8; page++) {
        const edge = box(0.008, height - 0.14, 0.004, cover);
        edge.position.set(
          width / 2 - 0.039,
          0,
          -depth / 2 + (page * depth) / 8,
        );
        binding.add(edge);
      }
      for (const y of [-height * 0.36, height * 0.36]) {
        const band = box(0.067, 0.028, depth + 0.016, cover);
        band.position.set(-width / 2, y, 0);
        binding.add(band);
      }
      for (const isSpine of [false, true]) {
        const canvas = document.createElement("canvas");
        canvas.width = isSpine ? 192 : 768;
        canvas.height = 1152;
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(
          renderer!.capabilities.getMaxAnisotropy(),
          4,
        );
        textures.push(texture);
        labels.push({ canvas, texture, index, spine: isSpine });
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
        });
        materials.push(material);
        const geometry = new THREE.PlaneGeometry(
          isSpine ? depth * 0.86 : width * 0.9,
          height * 0.94,
        );
        geometries.push(geometry);
        const label = new THREE.Mesh(geometry, material);
        if (isSpine) {
          label.rotation.y = -Math.PI / 2;
          label.position.x = -width / 2 - 0.031;
        } else label.position.z = depth / 2 + 0.019;
        binding.add(label);
      }
      binding.position.y = height / 2 - 1.35;
      binding.userData.baseY = binding.position.y;
      binding.traverse((child) => {
        child.userData.index = index;
      });
      bindings.push(binding);
      scene.add(binding);
    });
    const shelfMaterial = new THREE.MeshStandardMaterial({ roughness: 1 });
    materials.push(shelfMaterial);
    const shelfWidth = (books.length - 1) * 0.55 + 2.1;
    const shelf = box(shelfWidth + 0.45, 0.055, 2.1, shelfMaterial);
    shelf.position.set(0, -1.4, -0.2);
    scene.add(shelf);

    function updatePalette() {
      const style = getComputedStyle(document.documentElement);
      const color = (name: string) => style.getPropertyValue(name).trim();
      covers.forEach((material, i) =>
        material.color.set(color(i % 2 ? "--ink-secondary" : "--ink")),
      );
      pages.forEach((material) => material.color.set(color("--paper")));
      shelfMaterial.color.set(color("--hairline"));
      labels.forEach(({ canvas, texture, index, spine }) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        const bodyFont =
          style.getPropertyValue("--font-body").trim() || "serif";
        const displayFont =
          style.getPropertyValue("--font-display").trim() || "serif";
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = color("--paper");
        ctx.strokeStyle = color("--paper");
        ctx.textAlign = "center";
        ctx.lineWidth = 2;
        ctx.font = `40px ${bodyFont}`;
        ctx.fillText(String(index + 1).padStart(2, "0"), w / 2, 120);
        if (spine) {
          ctx.save();
          ctx.translate(w / 2, h / 2);
          ctx.rotate(-Math.PI / 2);
          let size = 49;
          ctx.font = `${size}px ${displayFont}`;
          while (
            ctx.measureText(books[index].title).width > h * 0.66 &&
            size > 22
          ) {
            ctx.font = `${--size}px ${displayFont}`;
          }
          ctx.fillText(books[index].title, 0, 13);
          ctx.restore();
          ctx.fillRect(w * 0.25, h - 120, w * 0.5, 2);
        } else {
          ctx.strokeRect(38, 36, w - 76, h - 72);
          const wrap = (value: string, size: number) => {
            ctx.font = `${size}px ${displayFont}`;
            const lines: string[] = [];
            let line = "";
            for (const word of value.split(/\s+/)) {
              const next = line ? `${line} ${word}` : word;
              if (ctx.measureText(next).width > w - 150 && line) {
                lines.push(line);
                line = word;
              } else line = next;
            }
            if (line) lines.push(line);
            return lines;
          };
          let size = 76;
          let lines = wrap(books[index].title, size);
          while (lines.length > 5 && size > 36)
            lines = wrap(books[index].title, --size);
          const start = h * 0.45 - (lines.length - 1) * size * 0.6;
          lines.forEach((line, row) =>
            ctx.fillText(line, w / 2, start + row * size * 1.2, w - 130),
          );
          ctx.fillRect(w * 0.4, h * 0.73, w * 0.2, 2);
          const authors = wrap(books[index].author, 39);
          authors.forEach((line, row) =>
            ctx.fillText(line, w / 2, h * 0.81 + row * 46, w - 130),
          );
        }
        texture.needsUpdate = true;
      });
      draw();
    }
    function resize() {
      if (disposed || !renderer) return;
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      const span = shelfWidth + 0.85;
      const distance = Math.max(
        6.8,
        span / (2 * Math.tan(THREE.MathUtils.degToRad(16)) * camera.aspect),
      );
      camera.position.set(0.25, 1.5, distance);
      camera.lookAt(0, 0.12, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      draw();
    }
    function select(index: number) {
      if (disposed || index < 0 || index >= bindings.length) return;
      selected = index;
      cancelAnimationFrame(frame);
      const initial = bindings.map((binding) => ({
        x: binding.position.x,
        y: binding.position.y,
        z: binding.position.z,
        angle: binding.rotation.y,
      }));
      const widths = bindings.map((_, i) => (i === selected ? 1.85 : 0.55));
      let cursor = -widths.reduce((sum, width) => sum + width, 0) / 2;
      const targets = widths.map((width) => {
        const x = cursor + width / 2;
        cursor += width;
        return x;
      });
      const start = performance.now();
      const duration =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--duration-slow",
          ),
        ) || 600;
      function step(time: number) {
        if (disposed) return;
        const progress = motion.matches
          ? 1
          : Math.min((time - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        bindings.forEach((binding, i) => {
          const active = i === selected;
          binding.position.x = THREE.MathUtils.lerp(
            initial[i].x,
            targets[i],
            eased,
          );
          binding.position.z = THREE.MathUtils.lerp(
            initial[i].z,
            active ? 0.6 : -0.15,
            eased,
          );
          binding.position.y = THREE.MathUtils.lerp(
            initial[i].y,
            binding.userData.baseY + (active ? 0.08 : 0),
            eased,
          );
          binding.rotation.y = THREE.MathUtils.lerp(
            initial[i].angle,
            active ? -0.12 : Math.PI * 0.46,
            eased,
          );
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
    const totalWidth = (books.length - 1) * 0.55 + 1.85;
    let initialX = -totalWidth / 2;
    bindings.forEach((binding, index) => {
      const width = index === 0 ? 1.85 : 0.55;
      binding.position.x = initialX + width / 2;
      binding.position.z = index === 0 ? 0.6 : -0.15;
      binding.rotation.y = index === 0 ? -0.12 : Math.PI * 0.46;
      initialX += width;
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
