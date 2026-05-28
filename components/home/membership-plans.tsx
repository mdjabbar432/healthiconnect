import Link from "next/link";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Basic",
    price: "$9",
    period: "/ month",
    description: "Individuals who want essential telehealth tools.",
    features: ["Monthly video consultations", "Secure messaging", "Prescription refill requests"],
    emphasized: false,
    cta: "Choose Basic",
  },
  {
    name: "Professional",
    price: "$29",
    period: "/ month",
    description: "Active patients who see specialists regularly.",
    features: ["Everything in Basic", "Priority scheduling", "Care coordination", "Health records vault"],
    emphasized: true,
    cta: "Choose Professional",
  },
  {
    name: "Family",
    price: "$49",
    period: "/ month",
    description: "Household coverage with shared benefits.",
    features: ["Up to 5 profiles", "Family appointment calendar", "Pediatric-first routing", "24/7 nurse line"],
    emphasized: false,
    cta: "Choose Family",
  },
] as const;

export function MembershipPlans() {
  return (
    <section
      className="hc-section hc-membership"
      aria-labelledby="membership-heading"
    >
      <div className="hc-section__narrow">
        <h2 id="membership-heading" className="hc-section__title">
          Membership Plans
        </h2>
        <p className="hc-section__lead">
          Compare Basic and Premium plans, then subscribe securely with Stripe Checkout.
        </p>
      </div>
      <div className="hc-membership__grid">
        {PLANS.map((plan) => (
          <article
            key={plan.name}
            className={
              plan.emphasized ? "hc-plan-card hc-plan-card--popular" : "hc-plan-card"
            }
          >
            {plan.emphasized ? (
              <p className="hc-plan-card__ribbon">Most Popular</p>
            ) : null}
            <h3 className="hc-plan-card__name">{plan.name}</h3>
            <p className="hc-plan-card__price">
              <span className="hc-plan-card__amount">{plan.price}</span>
              <span className="hc-plan-card__period">{plan.period}</span>
            </p>
            <p className="hc-plan-card__description">{plan.description}</p>
            <ul className="hc-plan-card__features">
              {plan.features.map((item) => (
                <li key={item} className="hc-plan-card__feature">
                  <Check className="hc-plan-card__check" aria-hidden strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/membership" className="hc-btn hc-btn--primary hc-plan-card__cta">
              {plan.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
