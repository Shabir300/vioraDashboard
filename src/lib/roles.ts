import { OrgRole, UserRole } from "@prisma/client";

export type RoleContext = {
  userRole?: UserRole | null;
  orgRole?: OrgRole | null;
  organizationId?: string | null;
};

export function hasGlobalRole(ctx: RoleContext, allowed: UserRole[]): boolean {
  if (!ctx.userRole) return false;
  return allowed.includes(ctx.userRole);
}

export function hasOrgRole(ctx: RoleContext, allowed: OrgRole[]): boolean {
  if (!ctx.orgRole) return false;
  return allowed.includes(ctx.orgRole);
}

export function requireOrg(ctx: RoleContext): boolean {
  return Boolean(ctx.organizationId);
}


