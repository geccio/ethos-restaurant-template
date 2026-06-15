import { ReservationForm } from "../components/ReservationForm";
import { ReserveHero } from "../components/ReserveHero";
import { getSiteInfoSafe } from "@/lib/site-info";
import { normalizeSettings } from "@/lib/reservation-slots";

export default async function ReservePage() {
  const { data: site } = await getSiteInfoSafe();
  const settings = normalizeSettings(site.reservationSettings);

  return (
    <main className="flex-1">
      <ReserveHero />
      <section className="px-6 sm:px-10 pb-24">
        <div className="max-w-2xl mx-auto">
          <ReservationForm settings={settings} />
        </div>
      </section>
    </main>
  );
}
