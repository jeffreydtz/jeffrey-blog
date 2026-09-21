import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { localizedPath } from "@/lib/i18n/routing";

/** 404 de la casa: misma tipografía y medida, sin el chrome genérico de Next. */
export default async function NotFound() {
  const { locale, ui } = await getI18n();
  return (
    <div className="mx-auto w-full max-w-page px-lg py-2xl sm:py-3xl">
      <p className="label">404</p>
      <h1 className="mt-md font-display text-display-lg text-ink">
        {ui.notFound.title}
      </h1>
      <p className="mt-sm max-w-prose text-ink-secondary">{ui.notFound.body}</p>
      <p className="mt-xl">
        <Link
          href={localizedPath("/", locale)}
          className="link-underline weight-hover font-display text-ink"
        >
          {ui.notFound.back}
        </Link>
      </p>
    </div>
  );
}
