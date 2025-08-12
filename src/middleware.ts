import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    // Only guard the home page here. NextAuth has already ensured user is authenticated.
    const url = new URL(req.url);
    if (url.pathname === "/") {
      const orgId = (req as any).nextauth?.token?.organizationId as string | undefined;
      if (!orgId) {
        // If no org linked, send them to setup flow (avoid redirect loop with /signin)
        return NextResponse.redirect(new URL("/setup-org", req.url));
      }
    }
    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/signin",
    },
  }
);

export const config = {
  matcher: [
    // protect all admin routes and app pages except auth and public assets
    "/((?!api/auth|signin|signup|_next/static|_next/image|favicon.ico|images|public).*)",
  ],
};


