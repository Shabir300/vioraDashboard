import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, type AppSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = (await getServerSession(authOptions)) as unknown as AppSession | null;
    if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = params.id;
    const body = await req.json();
    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        start: body.start ? new Date(body.start) : undefined,
        end: body.end ? new Date(body.end) : undefined,
        level: body.level ?? undefined,
        description: body.description ?? undefined,
        allDay: body.allDay ?? undefined,
        location: body.location ?? undefined,
        reminders: Array.isArray(body.reminders) ? body.reminders : undefined,
        completed: body.completed ?? undefined,
        type: (body.type as any) ?? undefined,
        seriesId: body.seriesId ?? undefined,
        metadata: body.metadata ?? undefined,
      } as any,
    });
    return NextResponse.json({ item: updated });
  } catch (err) {
    console.error(`PATCH /api/calendar/${params.id} error`, err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = (await getServerSession(authOptions)) as unknown as AppSession | null;
    if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = params.id;
    await prisma.calendarEvent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`DELETE /api/calendar/${params.id} error`, err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


