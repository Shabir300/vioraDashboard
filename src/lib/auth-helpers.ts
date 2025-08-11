import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { OrgRole, UserRole } from "@prisma/client";

export async function requireAuth(req: NextRequest, options?: {
  orgRoles?: OrgRole[];
  userRoles?: UserRole[];
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }
  const userRole = (session.user as any)?.userRole as UserRole | undefined;
  const orgRole = (session.user as any)?.orgRole as OrgRole | undefined;
  if (options?.userRoles && (!userRole || !options.userRoles.includes(userRole))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (options?.orgRoles && (!orgRole || !options.orgRoles.includes(orgRole))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}


