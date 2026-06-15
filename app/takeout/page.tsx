import { TakeoutMenu } from "../components/TakeoutMenu";
import { CartPanel } from "../components/CartPanel";
import { TakeoutHero } from "../components/TakeoutHero";
import { SectionNav } from "../components/SectionNav";
import { getSiteInfoSafe } from "@/lib/site-info";
import { normalizeSettings } from "@/lib/reservation-slots";

export default async function TakeoutPage() {
  const { data: site } = await getSiteInfoSafe();
  // Takeout reuses reservationSettings for hours/slot granularity — the
  // public API doesn't ship a separate takeoutSettings yet. Lead time
  // for takeout is shorter than for reservations, so we floor it here.
  const baseSettings = normalizeSettings(site.reservationSettings);
  const pickupSettings = { ...baseSettings, leadHours: Math.min(baseSettings.leadHours, 1) };

  return (
    <>
      <main className="flex-1 pb-32 lg:pb-12">
        <TakeoutHero />
        <SectionNav />
        <section className="px-6 sm:px-10 pt-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-14">
            <div>
              <TakeoutMenu />
            </div>
            <CartPanel variant="sidebar" pickupSettings={pickupSettings} />
          </div>
        </section>
      </main>
      <CartPanel variant="drawer" pickupSettings={pickupSettings} />
    </>
  );
}
