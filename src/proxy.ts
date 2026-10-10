import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSupabaseConfig } from "@/lib/supabase/config";

export const proxy = async (request: NextRequest) => {
  const { url, key } = getSupabaseConfig();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [name, value] of Object.entries(headers)) {
          response.headers.set(name, value);
        }
      },
    },
  });
  const [, section] = request.nextUrl.pathname.split("/");
  const protectedRoute = section === "student" || section === "instructor";
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session && protectedRoute) {
    const target = request.nextUrl.clone();
    target.pathname = "/";
    target.search = "";
    const redirected = NextResponse.redirect(target);
    for (const cookie of response.cookies.getAll()) {
      redirected.cookies.set(cookie);
    }
    for (const [name, value] of response.headers) {
      if (name === "cache-control" || name === "expires" || name === "pragma") {
        redirected.headers.set(name, value);
      }
    }
    redirected.headers.set("Cache-Control", "private, no-store");
    return redirected;
  }
  if (session || protectedRoute) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
