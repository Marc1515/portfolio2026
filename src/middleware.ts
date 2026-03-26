import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that already include a supported locale -> let next-intl handle them.
  const hasLocale = routing.locales.some(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`),
  );

  if (hasLocale) {
    return intlMiddleware(request);
  }

  // Custom Accept-Language detection: es/ca -> "es", anything else -> "en".
  const header = request.headers.get("accept-language")?.toLowerCase() ?? "";
  const locale = header.startsWith("es") || header.startsWith("ca") ? "es" : "en";
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
