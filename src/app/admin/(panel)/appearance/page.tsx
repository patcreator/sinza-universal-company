import { AppearanceForm } from "@/components/admin/AppearanceForm";
import { getAllSettings, defaultTheme, defaultSite } from "@/lib/settings";
import { ensureSeeded } from "@/db";

export const dynamic = "force-dynamic";

export default async function AppearancePage() {
  await ensureSeeded();
  const all: Record<string, any> = await getAllSettings().catch(() => ({}) as any);

  return (
    <div>
      <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted">Control the whole website</p>
      <h1 className="mt-3 font-display text-[2.15rem] leading-none">Appearance & settings</h1>
      <p className="mt-3 max-w-2xl text-[0.92rem] leading-relaxed text-muted">
        Colours, hero, site information, sections that are shown or hidden, newsletter days and payment
        methods — all stored in the database and applied everywhere instantly.
      </p>

      <div className="mt-8">
        <AppearanceForm
          theme={{ ...defaultTheme, ...(all.theme ?? {}) }}
          site={{ ...defaultSite, ...(all.site ?? {}) }}
          schedule={all.newsletterSchedule ?? { enabled: true, days: [1, 3, 5], hour: 9, timezone: "Africa/Kigali" }}
          payments={all.payments ?? { enabled: ["mtn", "airtel", "visa", "mastercard", "pesapal", "pawapay"], currency: "RWF", bookingFeePercent: 3, demoMode: true }}
        />
      </div>
    </div>
  );
}
