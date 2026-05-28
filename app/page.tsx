import Image from "next/image";
import {
  FeaturedDoctors,
  HeroDoctorSearch,
  MembershipPlans,
  PartnerDirectory,
  SiteFooter,
  SpecialtyCategories,
  StatsBar,
} from "@/components/home";

export default async function HomePage() {
  return (
    <>
      <main className="hero-shell">
        <section className="hero-grid">
          <div className="hero-left">
            <p className="hero-kicker">Trusted Healthcare Access</p>

            <h1 className="hero-title">Quality Healthcare at Your Fingertips</h1>

            <p className="hero-description">
              Discover experienced doctors and specialists, compare care options, and schedule your
              next appointment with confidence from one platform.
            </p>

            <div className="search-wrap">
              <HeroDoctorSearch />
            </div>
          </div>

          <div className="hero-image-box">
            <Image
              src="/assets/images/healthi-connect-banner.svg"
              alt="Medical Healthcare"
              fill
              unoptimized
              className="hero-image"
              priority
            />
          </div>
        </section>
      </main>

      <StatsBar />
      <SpecialtyCategories />
      <FeaturedDoctors />
      <MembershipPlans />
      <PartnerDirectory />
      <SiteFooter />
    </>
  );
}
