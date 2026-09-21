import { ui } from "@/lib/ui";
import { en } from "./en";
import type { Locale } from "./routing";
type Strings<T> = {
  [K in keyof T]: T[K] extends string ? string : Strings<T[K]>;
};
export type Dictionary = Strings<typeof ui>;
export function getDictionary(locale: Locale): Dictionary {
  return locale === "en" ? en : ui;
}
