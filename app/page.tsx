import { Hero } from "./components/Hero";
import { Options } from "./components/Options";
import { About } from "./components/About";
import { Location } from "./components/Location";
import { getSiteInfoSafe } from "@/lib/site-info";
import { restaurant } from "@/data/restaurant";

export default async function Home() {
  const { data: site } = await getSiteInfoSafe();
  const info = site.info;

  return (
    <main className="flex-1">
      <Hero
        tagline={info.tagline?.trim() || restaurant.slogan.es}
        heroImage={info.heroImage ?? restaurant.heroImage}
      />
      <Options />
      <About
        tagline={info.tagline?.trim() || restaurant.slogan.es}
        about={info.about?.trim() || restaurant.about.es}
      />
      <Location
        address={
          info.address?.trim() ||
          `${restaurant.contact.address.es}, ${restaurant.contact.city.es}`
        }
        phone={info.phone?.trim() || restaurant.contact.phone}
        hours={{
          weekdays: info.hours?.weekdays ?? "",
          weekend: info.hours?.weekend ?? "",
          sunday: info.hours?.sunday ?? "",
        }}
        instagramUrl={info.instagram?.trim() || restaurant.contact.instagram}
        mapsEmbedSrc={info.mapsEmbed?.trim() || ""}
        gallery={Array.isArray(info.gallery) ? info.gallery : []}
      />
    </main>
  );
}
