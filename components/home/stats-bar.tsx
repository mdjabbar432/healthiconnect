import { Building2, Headset, Stethoscope, Users } from "lucide-react";

const STATS = [
  { label: "10k+ Satisfied Patients", Icon: Users },
  { label: "500+ Specialist Doctors", Icon: Stethoscope },
  { label: "24/7 Online Support", Icon: Headset },
  { label: "15+ Partner Clinics", Icon: Building2 },
] as const;

export function StatsBar() {
  return (
    <section className="hc-stats" aria-label="HealthiConnect at a glance">
      <div className="hc-stats__inner">
        {STATS.map(({ label, Icon }) => (
          <div key={label} className="hc-stats__item">
            <Icon className="hc-stats__icon" aria-hidden strokeWidth={1.75} />
            <p className="hc-stats__label">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
