import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { OrgRole, UserRole } from "@prisma/client";

export async function requireAuthWithOrg(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }
  const organizationId = (session as any).organizationId as string | undefined;
  if (!organizationId) {
    return { error: NextResponse.json({ error: "No organization context" }, { status: 400 }) } as const;
  }
  return { session, organizationId } as const;
}

export function requireRole(
  session: any,
  options: { orgRoles?: OrgRole[]; globalRoles?: UserRole[] }
) {
  const orgRole = session?.user?.orgRole as OrgRole | undefined;
  const globalRole = session?.user?.userRole as UserRole | undefined;
  if (options.globalRoles && options.globalRoles.length) {
    if (!globalRole || !options.globalRoles.includes(globalRole)) return false;
  }
  if (options.orgRoles && options.orgRoles.length) {
    if (!orgRole || !options.orgRoles.includes(orgRole)) return false;
  }
  return true;
}

export function jsonOk(data: unknown, init?: number | ResponseInit) {
  if (typeof init === 'number') {
    return NextResponse.json(data, { status: init });
  }
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}


