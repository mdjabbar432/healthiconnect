import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { fetchDirectoryDoctors } from "@/lib/doctors/fetch-directory-doctors";
import { mapDirectoryRowsToItems } from "@/lib/doctors/map-directory-doctor";

export async function FeaturedDoctors() {
  try {
    const { doctors: rows, error } = await fetchDirectoryDoctors();

    if (error) {
      console.error("Supabase Doctor Fetch Error:", error);
      return (
        <div className="hc-band hc-band--muted">
          <section
            className="hc-section hc-featured-docs-inner"
            aria-labelledby="featured-doctors-heading"
          >
            <div className="hc-section__narrow">
              <h2 id="featured-doctors-heading" className="hc-section__title">
                Meet Our Top Specialists
              </h2>
              <p className="hc-section__lead">
                Specialists are temporarily unavailable.{" "}
                <Link href="/doctors" className="font-semibold text-hc-brand underline">
                  Browse the full directory
                </Link>
                .
              </p>
            </div>
          </section>
        </div>
      );
    }

    const specialists = mapDirectoryRowsToItems(rows).slice(0, 3);

    if (specialists.length === 0) {
      return (
        <div className="hc-band hc-band--muted">
          <section
            className="hc-section hc-featured-docs-inner"
            aria-labelledby="featured-doctors-heading"
          >
            <div className="hc-section__narrow">
              <h2 id="featured-doctors-heading" className="hc-section__title">
                Meet Our Top Specialists
              </h2>
              <p className="hc-section__lead">
                No specialists are listed yet.{" "}
                <Link href="/doctors" className="font-semibold text-hc-brand underline">
                  Check the directory
                </Link>{" "}
                soon.
              </p>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="hc-band hc-band--muted">
        <section
          className="hc-section hc-featured-docs-inner"
          aria-labelledby="featured-doctors-heading"
        >
          <div className="hc-section__narrow">
            <h2 id="featured-doctors-heading" className="hc-section__title">
              Meet Our Top Specialists
            </h2>
            <p className="hc-section__lead">
              Highly rated clinicians available for appointments.
            </p>
          </div>
          <div className="hc-featured-docs__grid">
            {specialists.map((doctor) => (
              <article key={doctor.id} className="hc-doctor-card">
                <div className="hc-doctor-card__image-wrap">
                  <Image
                    src={doctor.photoUrl || "/assets/images/placeholder-doctor.svg"}
                    alt=""
                    fill
                    unoptimized
                    className="hc-doctor-card__image"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <span className="hc-doctor-card__badge">
                    <Star
                      className="hc-doctor-card__badge-icon"
                      aria-hidden
                      strokeWidth={2}
                      fill="currentColor"
                    />
                    Top Rated
                  </span>
                </div>
                <div className="hc-doctor-card__body">
                  <h3 className="hc-doctor-card__name">{doctor.fullName}</h3>
                  <p className="hc-doctor-card__specialty">
                    {doctor.specialties[0] ?? "Verified specialist"}
                  </p>
                  <Link
                    href={`/doctors/${doctor.id}`}
                    className="hc-btn hc-btn--primary hc-doctor-card__cta"
                  >
                    View profile
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  } catch (cause) {
    console.error("Supabase Doctor Fetch Error:", cause);
    return (
      <div className="hc-band hc-band--muted">
        <section className="hc-section hc-featured-docs-inner">
          <div className="hc-section__narrow">
            <h2 className="hc-section__title">Meet Our Top Specialists</h2>
            <p className="hc-section__lead">
              Unable to load featured doctors right now.{" "}
              <Link href="/doctors" className="font-semibold text-hc-brand underline">
                Browse doctors
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    );
  }
}
