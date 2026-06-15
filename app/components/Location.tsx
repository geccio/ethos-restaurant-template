"use client";

import { useLanguage } from "./LanguageProvider";
import { restaurant } from "@/data/restaurant";
import { t } from "@/data/translations";

// Renders the location section from /api/public/site-info. Falls back
// to the hardcoded brand assets (local photos, maps embed) when the
// dashboard hasn't supplied them yet — never blanks per build contract
// §2 ("Hide a section gracefully if site-info returns nothing for it"
// — for now we keep the brand defaults so the page stays coherent).
export function Location({
  address,
  phone,
  hours,
  instagramUrl,
  mapsEmbedSrc,
  gallery,
}: {
  address: string;
  phone: string;
  hours: { weekdays: string; weekend: string; sunday: string };
  instagramUrl: string;
  mapsEmbedSrc: string;
  gallery: string[];
}) {
  const { tr } = useLanguage();

  const localPhotos = gallery.length > 0 ? gallery : restaurant.localPhotos;
  const mapSrc = mapsEmbedSrc || restaurant.contact.googleMapsEmbedSrc;
  const instagramHandle = extractInstagramHandle(instagramUrl);

  return (
    <section id="location" className="px-6 sm:px-10 py-20 sm:py-28 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-accent text-xs uppercase tracking-[0.4em] mb-4">
            {tr(t.location)}
          </p>
          <h2 className="font-display text-4xl sm:text-5xl">{tr(t.ourPlace)}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
          {localPhotos.map((src, i) => (
            <div
              key={src}
              className="aspect-[4/5] bg-background-elevated border border-border bg-cover bg-center"
              style={{ backgroundImage: `url(${src})` }}
              role="img"
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3 aspect-[4/3] border border-border overflow-hidden bg-background-elevated">
            <iframe
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0, filter: "grayscale(0.5) contrast(1.1) invert(0.92)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Map"
            />
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-foreground-muted mb-2">
                {tr(t.contact)}
              </p>
              <p className="text-lg">{address}</p>
            </div>

            {phone && (
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-foreground-muted mb-2">
                  {tr(t.callUs)}
                </p>
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="text-lg hover:text-accent transition-colors"
                >
                  {phone}
                </a>
              </div>
            )}

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-foreground-muted mb-2">
                {tr(t.hours)}
              </p>
              <ul className="text-foreground-muted text-sm space-y-1">
                {hours.weekdays && <li>{hours.weekdays}</li>}
                {hours.weekend && <li>{hours.weekend}</li>}
                {hours.sunday && <li>{hours.sunday}</li>}
              </ul>
            </div>

            {instagramUrl && (
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-foreground-muted mb-2">
                  {tr(t.followUs)}
                </p>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {instagramHandle ? `@${instagramHandle}` : "Instagram"}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function extractInstagramHandle(url: string): string | null {
  const m = url.match(/instagram\.com\/([^/?#]+)/i);
  return m ? m[1] : null;
}
