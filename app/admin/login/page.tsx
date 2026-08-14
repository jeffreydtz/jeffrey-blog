import { redirect } from "next/navigation";
import { loginAction } from "@/app/admin/actions";
import { Field, Notice, SubmitButton, inputClass } from "@/components/admin/Field";
import { adminEnabled, isAdmin } from "@/lib/admin/auth";

/** Login del panel — contraseña única (ADMIN_PASSWORD), rate-limited. */

const ERRORS: Record<string, string> = {
  bad: "Contraseña incorrecta.",
  rate: "Demasiados intentos. Esperá un minuto.",
  off: "Panel deshabilitado: faltan ADMIN_PASSWORD y/o GITHUB_TOKEN en las env vars.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  if (await isAdmin()) redirect("/admin");
  const { e } = await searchParams;

  return (
    <div className="max-w-[24rem]">
      <h1 className="font-display text-display-md text-ink">Entrar</h1>
      <div className="mt-lg">
        <Notice error={e ? (ERRORS[e] ?? "No se pudo entrar.") : undefined} />
      </div>
      {adminEnabled() ? (
        <form action={loginAction} className="flex flex-col gap-md">
          <Field label="Contraseña">
            <input
              type="password"
              name="password"
              required
              autoFocus
              autoComplete="current-password"
              className={inputClass}
            />
          </Field>
          <div>
            <SubmitButton>Entrar</SubmitButton>
          </div>
        </form>
      ) : (
        <p className="text-body-sm text-ink-muted">{ERRORS.off}</p>
      )}
    </div>
  );
}
