import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, organizationName } = body as {
      name?: string;
      email?: string;
      password?: string;
      organizationName?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    // If organizationName provided, create org and membership; else just user
    let organizationId: string | undefined = undefined;
    if (organizationName) {
      const org = await prisma.organization.create({
        data: {
          name: organizationName,
        },
      });
      organizationId = org.id;
    }

    const user = await prisma.user.create({
      data: {
        name: name ?? null,
        email,
        password: hashed,
      },
    });

    if (organizationId) {
      await prisma.organizationMembership.create({
        data: {
          organizationId,
          userId: user.id,
          role: "Owner",
        },
      });
    }

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}


