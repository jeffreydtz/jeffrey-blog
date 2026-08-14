import Link from "next/link";
import { publishAction } from "@/app/admin/actions";
import { Notice, SubmitButton } from "@/components/admin/Field";
import { requireAdmin } from "@/lib/admin/auth";
import { repoDir } from "@/lib/admin/github";

/** Home del panel: resumen + accesos + publicar (rebuild de producción). */

const SECTIONS = [
  {
    href: "/admin/posts",
    label: "Publicaciones",
    detail: "Crear, editar y borrar ensayos (.mdx en content/posts/).",
  },
  {
    href: "/admin/pages/gabinete",
    label: "Gabinete",
    detail: "Curaduría: lo que estás mirando y leyendo.",
  },
  {
    href: "/admin/pages/acerca",
    label: "Acerca de",
    detail: "La página de presentación.",
  },
  {
    href: "/admin/pages/colofon",
    label: "Colofón",
    detail: "Créditos y decisiones del sitio.",
  },
  {
    href: "/admin/now",
    label: "Ahora",
    detail: "Qué estás escuchando y leyendo (widget del footer).",
  },
] as const;

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  await requireAdmin();
  const [{ m }, posts] = await Promise.all([
    searchParams,
    repoDir("content/posts"),
  ]);

  return (
    <div>
      <Notice message={m} />
      <h1 className="font-display text-display-md text-ink">Panel</h1>
      <p className="mt-sm max-w-prose text-body-sm text-ink-muted">
        Cada guardado es un commit real a <code>main</code> — el repo sigue
        siendo la única fuente de verdad. {posts.length} ensayos publicados en
        el repositorio.
      </p>

      <ul className="mt-xl">
        {SECTIONS.map((s, i) => (
          <li key={s.href} className={i > 0 ? "hairline" : undefined}>
            <div className="flex flex-wrap items-baseline justify-between gap-md py-md">
              <Link
                href={s.href}
                className="link-underline weight-hover font-display text-display-sm text-ink"
              >
                {s.label}
              </Link>
              <p className="text-body-sm text-ink-muted">{s.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="hairline mt-xl" />
      <form action={publishAction} className="mt-lg flex items-baseline gap-md">
        <SubmitButton>Publicar ahora</SubmitButton>
        <p className="text-body-sm text-ink-muted">
          Dispara un rebuild de producción con lo último de main.
        </p>
      </form>
    </div>
  );
}
