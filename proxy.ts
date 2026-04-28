import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const CLINICAL_SUBROUTES = ["/antecedentes", "/nota-medica", "/receta"];
const DOCTOR_ONLY_PATHS = ["/configuracion"];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const isLoggedIn = !!token;
    const role = token?.role as string | undefined;

    if (isLoggedIn && pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (role === "RECEPCIONISTA") {
      const isClinicalSub = CLINICAL_SUBROUTES.some((sub) => pathname.includes(sub));
      const isDoctorOnly = DOCTOR_ONLY_PATHS.some((p) => pathname.startsWith(p));

      if (isClinicalSub || isDoctorOnly) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith("/login");
        const isPublicPage =
          req.nextUrl.pathname.startsWith("/verificar") ||
          req.nextUrl.pathname.startsWith("/unauthorized");
        if (isAuthPage || isPublicPage) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
