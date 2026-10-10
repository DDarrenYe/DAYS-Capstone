import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { readAccount } from "@/lib/supabase/account";
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
  const { pathname } = request.nextUrl;
  let account: Awaited<ReturnType<typeof readAccount>> = null;
  try {
    account = await readAccount(supabase);
  } catch (error) {
    if (pathname !== "/") {
      throw error;
    }
  }
  const protectedRoute =
    pathname.startsWith("/student") || pathname.startsWith("/instructor");
  let destination: string | undefined;
  if (!account && protectedRoute) {
    destination = "/";
  } else if (
    account &&
    (pathname === "/" ||
      (protectedRoute && pathname.split("/")[1] !== account.role))
  ) {
    destination = `/${account.role}`;
  }
  if (destination) {
    const target = request.nextUrl.clone();
    target.pathname = destination;
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
  response.headers.set("Cache-Control", "private, no-store");
  return response;
};

export const config = {
  matcher: ["/", "/student/:path*", "/instructor/:path*"],
};
