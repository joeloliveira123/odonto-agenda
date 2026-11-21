import {
  buildInitialDemoAppointments,
  DEFAULT_DEMO_CLINIC,
  DEFAULT_DEMO_FAQS,
  DEFAULT_DEMO_STAFF,
  DEFAULT_DEMO_TREATMENTS,
  DEMO_TENANT_ID
} from "@/features/clinics/demoSeed";
import { InMemoryTenantDataProvider } from "@/lib/tenancy/provider";
import type { AvailabilityRule } from "@/types/domain";

const globalStore = globalThis as unknown as {
  __odontoServerProvider?: InMemoryTenantDataProvider;
};

export function getServerTenantProvider(): InMemoryTenantDataProvider {
  if (!globalStore.__odontoServerProvider) {
    globalStore.__odontoServerProvider = new InMemoryTenantDataProvider({
      clinic: DEFAULT_DEMO_CLINIC,
      staff: DEFAULT_DEMO_STAFF,
      treatments: DEFAULT_DEMO_TREATMENTS,
      faqs: DEFAULT_DEMO_FAQS,
      appointments: buildInitialDemoAppointments()
    });
  }
  return globalStore.__odontoServerProvider;
}

export function getDemoAvailabilityRules(tenantId: string = DEMO_TENANT_ID): AvailabilityRule[] {
  const weekdays = [1, 2, 3, 4, 5, 6]; // Mon-Sat
  const rules: AvailabilityRule[] = [];
  for (const staff of DEFAULT_DEMO_STAFF) {
    for (const weekday of weekdays) {
      rules.push({
        id: `rule-${staff.id}-${weekday}`,
        tenantId,
        professionalId: staff.id,
        weekday,
        startTime: "08:30",
        endTime: weekday === 6 ? "14:00" : "19:00",
        timeZone: "America/Sao_Paulo"
      });
    }
  }
  return rules;
}
