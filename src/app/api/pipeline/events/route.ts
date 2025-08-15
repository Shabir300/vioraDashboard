import { NextRequest } from "next/server";
import { subscribeToOrganization } from "@/lib/realtime";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs"; // Required for streaming

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const organizationId = (session as any)?.organizationId as string | undefined;
  if (!session || !organizationId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const unsubscribe = subscribeToOrganization(organizationId, (event) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      });
      // Heartbeat every 15s
      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(`:\n\n`));
      }, 15000);
      controller.enqueue(encoder.encode(`retry: 5000\n\n`));
      (controller as any)._cleanup = () => {
        clearInterval(interval);
        unsubscribe();
      };
    },
    cancel(reason) {
      const cleanup = (this as any)._cleanup as (() => void) | undefined;
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}


