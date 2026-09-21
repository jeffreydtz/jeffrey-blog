"use client";
import { createContext, useContext } from "react";
import type { Locale } from "./routing";
import { getDictionary } from "./dictionary";
const LocaleContext = createContext<Locale>("es");
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}
export function useI18n() {
  const locale = useContext(LocaleContext);
  return { locale, ui: getDictionary(locale) };
}
