import { rssResponse } from "@/lib/rss";
import { isLocale, locales } from "@/lib/i18n/routing";
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response(null, { status: 404 });
  return rssResponse(locale);
}
