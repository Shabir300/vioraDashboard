import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, type AppSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = (await getServerSession(authOptions)) as unknown as AppSession | null;
    if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await prisma.calendarEvent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/calendar/[id]/delete error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


