const PARTNERS = [
  "Summit Medical Center",
  "Harborview Clinic",
  "Northside Hospital",
  "Greenleaf Health",
  "Mercy Pediatrics",
  "Riverside Diagnostics",
] as const;

export function PartnerDirectory() {
  return (
    <section
      className="hc-section hc-partners"
      aria-labelledby="partners-heading"
    >
      <div className="hc-section__narrow">
        <h2 id="partners-heading" className="hc-section__title">
          Our Trusted Partners
        </h2>
        <p className="hc-section__lead">
          We collaborate with leading clinics and hospitals to expand access to quality care.
        </p>
      </div>
      <ul className="hc-partners__grid">
        {PARTNERS.map((name) => (
          <li key={name} className="hc-partners__cell">
            <span className="hc-partners__logo">{name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
