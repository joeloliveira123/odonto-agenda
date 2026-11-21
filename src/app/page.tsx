import {
  buildInitialDemoAppointments,
  buildUpcomingDemoDays,
  DEFAULT_DEMO_CLINIC,
  DEFAULT_DEMO_FAQS,
  DEFAULT_DEMO_STAFF,
  DEFAULT_DEMO_TREATMENTS
} from "@/features/clinics/demoSeed";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";
import { OdontoDemoClient } from "@/components/site/OdontoDemoClient";

export default function HomePage() {
  const supabaseStatus = getSupabaseConfigStatus();
  const days = buildUpcomingDemoDays();
  const initialAppointments = buildInitialDemoAppointments(days);

  return (
    <OdontoDemoClient
      initialClinic={DEFAULT_DEMO_CLINIC}
      initialStaff={DEFAULT_DEMO_STAFF}
      initialTreatments={DEFAULT_DEMO_TREATMENTS}
      initialFaqs={DEFAULT_DEMO_FAQS}
      initialAppointments={initialAppointments}
      days={days}
      supabaseConfigured={supabaseStatus.configured}
    />
  );
}
