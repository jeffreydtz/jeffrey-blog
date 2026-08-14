import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/admin/auth";
import { logoutAction } from "@/app/admin/actions";

/**
 * Chrome del panel /admin. Fuera de buscadores (noindex + robots.ts) y del
 * chrome público: nav propia, misma tipografía de la casa. Todo el segmento
 * es dinámico (lee cookies y GitHub en cada request) — nada de SSG acá.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/posts", label: "Publicaciones" },
  { href: "/admin/pages/gabinete", label: "Gabinete" },
  { href: "/admin/now", label: "Ahora" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdmin();
  return (
    <div className="mx-auto w-full max-w-page px-lg py-xl">
      <div className="flex flex-wrap items-baseline justify-between gap-md">
        <p className="label">Administración</p>
        {authed && (
          <nav aria-label="Admin" className="flex flex-wrap items-center gap-md">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="label link-underline weight-hover py-sm text-ink-secondary hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            <form action={logoutAction}>
              <button
                type="submit"
                className="label cursor-pointer py-sm text-ink-muted hover:text-ink"
              >
                Salir
              </button>
            </form>
          </nav>
        )}
      </div>
      <div className="hairline mt-sm" />
      <div className="py-xl">{children}</div>
    </div>
  );
}
