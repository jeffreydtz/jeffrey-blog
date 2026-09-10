import Link from "next/link";
import { ui } from "@/lib/ui";

/** 404 de la casa: misma tipografía y medida, sin el chrome genérico de Next. */
export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-page px-lg py-2xl sm:py-3xl">
      <p className="label">404</p>
      <h1 className="mt-md font-display text-display-lg text-ink">
        {ui.notFound.title}
      </h1>
      <p className="mt-sm max-w-prose text-ink-secondary">{ui.notFound.body}</p>
      <p className="mt-xl">
        <Link
          href="/"
          className="link-underline weight-hover font-display text-ink"
        >
          {ui.notFound.back}
        </Link>
      </p>
    </div>
  );
}
