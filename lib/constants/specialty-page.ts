import type { LucideIcon } from "lucide-react";
import {
  Bone,
  Brain,
  Heart,
  ScanLine,
  Baby,
  Stethoscope,
} from "lucide-react";

export type SpecialtyPageItem = {
  name: string;
  description: string;
  doctorCount: number;
  Icon: LucideIcon;
};

export const SPECIALTY_PAGE_ITEMS: SpecialtyPageItem[] = [
  {
    name: "Cardiology",
    description: "Heart health, prevention, and advanced cardiac care.",
    doctorCount: 24,
    Icon: Heart,
  },
  {
    name: "Neurology",
    description: "Brain, spine, and nervous system specialists.",
    doctorCount: 24,
    Icon: Brain,
  },
  {
    name: "Pediatrics",
    description: "Compassionate care for infants, children, and teens.",
    doctorCount: 24,
    Icon: Baby,
  },
  {
    name: "Orthopedics",
    description: "Bones, joints, muscles, and sports injury treatment.",
    doctorCount: 24,
    Icon: Bone,
  },
  {
    name: "Dermatology",
    description: "Skin, hair, and nail conditions diagnosed and treated.",
    doctorCount: 24,
    Icon: ScanLine,
  },
  {
    name: "General Medicine",
    description: "Primary care for everyday health and wellness needs.",
    doctorCount: 24,
    Icon: Stethoscope,
  },
];
