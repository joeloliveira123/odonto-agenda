import type { AuditEvent } from "@/types/domain";

const globalAudit = globalThis as unknown as {
  __odontoAuditEvents?: AuditEvent[];
};

function getAuditStore(): AuditEvent[] {
  if (!globalAudit.__odontoAuditEvents) {
    globalAudit.__odontoAuditEvents = [];
  }
  return globalAudit.__odontoAuditEvents;
}

export function recordAuditEvent(event: Omit<AuditEvent, "id" | "timestamp">): AuditEvent {
  const entry: AuditEvent = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...event
  };
  const store = getAuditStore();
  store.unshift(entry);
  return entry;
}

export function listAuditEvents(tenantId: string): AuditEvent[] {
  return getAuditStore().filter((e) => e.tenantId === tenantId);
}
