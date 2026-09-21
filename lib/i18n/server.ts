import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { isLocale } from "./routing";
import { getDictionary } from "./dictionary";

export const getLocale = cache(async () => {
  const value = (await headers()).get("x-blog-locale");
  return isLocale(value) ? value : "es";
});
export async function getI18n() {
  const locale = await getLocale();
  return { locale, ui: getDictionary(locale) };
}
