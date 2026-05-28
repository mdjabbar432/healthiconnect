"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { AppToast } from "@/components/ui/app-toast";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/doctors", label: "Find Doctors" },
  { href: "#", label: "Specialties" },
  { href: "/membership", label: "Membership" },
  { href: "/sign-in", label: "Sign In" },
] as const;

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const emailPattern = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) {
      setFeedback({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        const message =
          payload?.error ??
          payload?.message ??
          "Unable to process your subscription right now. Please try again.";
        setFeedback({ type: "error", message });
        return;
      }

      const successMessage = payload?.message ?? "Thank you for subscribing! 🎉";
      setFeedback({ type: "success", message: successMessage });
      setToastMessage(successMessage);
      setEmail("");
    } catch {
      setFeedback({
        type: "error",
        message: "Unable to subscribe right now. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <footer className="hc-footer">
      <div className="hc-footer__inner">
        <div className="hc-footer__col hc-footer__brand">
          <Link href="/" className="hc-footer__logo">
            HealthiConnect
          </Link>
          <p className="hc-footer__tagline">
            Modern access to vetted doctors, transparent pricing, and continuous support.
          </p>
        </div>
        <div className="hc-footer__col">
          <h3 className="hc-footer__heading">Quick Links</h3>
          <ul className="hc-footer__list">
            {QUICK_LINKS.map(({ href, label }) => (
              <li key={label}>
                <Link href={href} className="hc-footer__link">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="hc-footer__col">
          <h3 className="hc-footer__heading">Contact</h3>
          <ul className="hc-footer__list hc-footer__list--contact">
            <li>
              <a href="tel:+18005551234" className="hc-footer__link">
                +1 (800) 555-1234
              </a>
            </li>
            <li>
              <a href="mailto:care@healthiconnect.com" className="hc-footer__link">
                care@healthiconnect.com
              </a>
            </li>
            <li className="hc-footer__address">
              1200 Care Avenue, Suite 400
              <br />
              Boston, MA 02115
            </li>
          </ul>
        </div>
        <div className="hc-footer__col">
          <h3 className="hc-footer__heading">Newsletter</h3>
          <p className="hc-footer__newsletter-text">
            Care tips and product updates. Unsubscribe anytime.
          </p>
          <form className="hc-footer__form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="footer-email" className="hc-visually-hidden">
              Email address
            </label>
            <input
              id="footer-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="hc-footer__input"
              required
              aria-invalid={feedback?.type === "error" ? true : undefined}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className="hc-btn hc-btn--primary hc-footer__submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Subscribing..." : "Subscribe"}
            </button>
            {feedback ? (
              <p
                role="status"
                aria-live="polite"
                className={`hc-footer__form-message hc-footer__form-message--${feedback.type}`}
              >
                {feedback.message}
              </p>
            ) : null}
          </form>
        </div>
      </div>
      <div className="hc-footer__bottom">
        <p className="hc-footer__copy">
          © {new Date().getFullYear()} HealthiConnect. All rights reserved.
        </p>
      </div>
      {toastMessage ? (
        <AppToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      ) : null}
    </footer>
  );
}
