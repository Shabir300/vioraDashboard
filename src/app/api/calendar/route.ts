import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, type AppSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as unknown as AppSession | null;
    if (!session?.organizationId) return NextResponse.json({ items: [] });
    const items = await prisma.calendarEvent.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { start: "asc" },
    });
    return NextResponse.json({ items });
  } catch (err) {
    console.error("GET /api/calendar error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as unknown as AppSession | null;
    if (!session?.organizationId || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Guard: ensure org exists to avoid FK error
    const org = await prisma.organization.findUnique({ where: { id: session.organizationId } });
    if (!org) return NextResponse.json({ error: "Organization not found for session" }, { status: 400 });
    const body = await req.json();
    // Accept single or bulk create
    const payloads = Array.isArray(body) ? body : [body];
    const created: any[] = [];
    for (const p of payloads) {
      const extendedData: any = {
        organizationId: session.organizationId!,
        title: p.title,
        start: new Date(p.start),
        end: p.end ? new Date(p.end) : null,
        level: p.level ?? null,
        description: p.description ?? null,
        createdById: session.user!.id as string,
        type: (p.type ?? "EVENT") as any,
        allDay: !!p.allDay,
        location: p.location ?? null,
        reminders: Array.isArray(p.reminders) ? p.reminders : [],
        completed: !!p.completed,
        seriesId: p.seriesId ?? null,
        metadata: p.metadata ?? null,
      };
      const baseData = {
        organizationId: session.organizationId!,
        title: p.title,
        start: new Date(p.start),
        end: p.end ? new Date(p.end) : null,
        level: p.level ?? null,
        description: p.description ?? null,
        createdById: session.user!.id as string,
      } as const;
      try {
        const item = await prisma.calendarEvent.create({ data: extendedData });
        created.push(item);
      } catch (err: any) {
        if (err?.name === "PrismaClientValidationError") {
          const item = await prisma.calendarEvent.create({ data: baseData });
          created.push(item);
        } else if (err?.code === 'P2003') {
          return NextResponse.json({ error: "Foreign key constraint failed (organization/user)" }, { status: 400 });
        } else {
          throw err;
        }
      }
    }
    return NextResponse.json({ items: created });
  } catch (err) {
    console.error("POST /api/calendar error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


