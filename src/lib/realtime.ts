import { EventEmitter } from "events";

type PipelineEvent = {
  type: "pipeline:update" | "stage:update" | "card:update" | "card:move" | "stage:create" | "stage:delete" | "card:delete";
  organizationId: string;
  payload: unknown;
};

declare global {
  // eslint-disable-next-line no-var
  var __realtimeEmitter: EventEmitter | undefined;
}

const emitter: EventEmitter = global.__realtimeEmitter ?? new EventEmitter();
if (!global.__realtimeEmitter) {
  emitter.setMaxListeners(0);
  global.__realtimeEmitter = emitter;
}

export function emitPipelineEvent(event: PipelineEvent) {
  emitter.emit(`org:${event.organizationId}`, event);
}

export function subscribeToOrganization(
  organizationId: string,
  handler: (event: PipelineEvent) => void
) {
  const channel = `org:${organizationId}`;
  emitter.on(channel, handler);
  return () => emitter.off(channel, handler);
}


