import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { imageSize } from "image-size";

/**
 * Override de `img` en MDX — T11.
 * Imagen local (src que empieza con "/", vive en public/): next/image con
 * dimensiones intrínsecas leídas del archivo en build time (sin CLS).
 * Imagen remota: <img loading="lazy"> plano — sin remotePatterns comodín que
 * convierta el optimizador en proxy abierto.
 * El atributo `title` del markdown (`![alt](src "título")`) se vuelve pie de
 * foto en estilo .label. Wrappers en <span display:block> porque markdown
 * envuelve la imagen en un <p> (figure sería HTML inválido ahí).
 */
export function MdxImage({
  src,
  alt,
  title,
}: {
  src?: string;
  alt?: string;
  title?: string;
}) {
  if (!src) {
    throw new Error('[mdx] imagen sin "src" en el cuerpo del post.');
  }

  let image;
  if (src.startsWith("/")) {
    const publicDir = path.join(process.cwd(), "public");
    const file = path.normalize(path.join(publicDir, src));
    if (!file.startsWith(publicDir + path.sep)) {
      throw new Error(`[mdx] imagen local fuera de public/: ${src}`);
    }
    if (!fs.existsSync(file)) {
      throw new Error(
        `[mdx] imagen local no encontrada: public${src} — agregala a public/ o corregí el src.`,
      );
    }
    const { width, height } = imageSize(fs.readFileSync(file));
    if (!width || !height) {
      throw new Error(`[mdx] no pude leer dimensiones de public${src}`);
    }
    image = (
      <Image
        src={src}
        alt={alt ?? ""}
        width={width}
        height={height}
        sizes="(max-width: 48rem) 100vw, 48rem"
        className="h-auto w-full rounded-subtle border border-hairline"
      />
    );
  } else {
    image = (
      // eslint-disable-next-line @next/next/no-img-element -- imagen remota de host arbitrario; ver nota del componente
      <img
        src={src}
        alt={alt ?? ""}
        loading="lazy"
        decoding="async"
        className="h-auto w-full rounded-subtle border border-hairline"
      />
    );
  }

  return (
    // Full-bleed suave: en pantallas anchas la imagen respira apenas más
    // allá de la medida de prosa (margen negativo `lg`), permitido por T11.
    <span className="my-lg block sm:-mx-lg">
      {image}
      {title ? <span className="label mt-sm block">{title}</span> : null}
    </span>
  );
}
