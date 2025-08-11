import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/signin",
  },
});

export const config = {
  matcher: [
    // protect all admin routes and app pages except auth and public assets
    "/((?!api/auth|signin|signup|_next/static|_next/image|favicon.ico|images|public).*)",
  ],
};


