import {
  Baby,
  Bone,
  Brain,
  BrainCircuit,
  Eye,
  Heart,
  ScanLine,
  Smile,
} from "lucide-react";
import { DIRECTORY_SPECIALTIES } from "@/lib/constants/specialties";

const SPECIALTY_ICONS = {
  Cardiology: Heart,
  Pediatrics: Baby,
  Dental: Smile,
  Neurology: Brain,
  Orthopedics: Bone,
  Dermatology: ScanLine,
  Ophthalmology: Eye,
  Psychiatry: BrainCircuit,
} as const;

const SPECIALTIES = DIRECTORY_SPECIALTIES.map((name) => ({
  name,
  Icon: SPECIALTY_ICONS[name],
}));

export function SpecialtyCategories() {
  return (
    <section className="hc-section hc-specialties" aria-labelledby="specialties-heading">
      <div className="hc-section__narrow">
        <h2 id="specialties-heading" className="hc-section__title">
          Explore by Specialty
        </h2>
        <p className="hc-section__lead">
          Browse trusted care pathways and connect with verified specialists across major medical fields.
        </p>
      </div>
      <div className="hc-specialties__grid">
        {SPECIALTIES.map(({ name, Icon }) => (
          <a
            key={name}
            href={`/doctors?search=${encodeURIComponent(name)}`}
            className="hc-specialty-card"
          >
            <span className="hc-specialty-card__icon-wrap" aria-hidden>
              <Icon className="hc-specialty-card__icon" strokeWidth={1.75} />
            </span>
            <span className="hc-specialty-card__label">{name}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
