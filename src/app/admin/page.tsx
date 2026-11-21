import { DEMO_TENANT_ID } from "@/features/clinics/demoSeed";
import { listAuditEvents } from "@/lib/observability/audit";
import { getServerTenantProvider } from "@/lib/tenancy/serverProvider";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const provider = getServerTenantProvider();
  const [clinic, treatments, faqs, appointments] = await Promise.all([
    provider.getClinic(DEMO_TENANT_ID),
    provider.listAllTreatments(DEMO_TENANT_ID),
    provider.listAllFaqs(DEMO_TENANT_ID),
    provider.listAppointments(DEMO_TENANT_ID)
  ]);

  if (!clinic) {
    return null;
  }

  return (
    <AdminDashboardClient
      initialClinic={clinic}
      initialTreatments={treatments}
      initialFaqs={faqs}
      initialAppointments={appointments}
      initialAuditEvents={listAuditEvents(DEMO_TENANT_ID)}
    />
  );
}
