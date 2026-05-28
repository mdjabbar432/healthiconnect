"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, UserCircle } from "lucide-react";
import { DIRECTORY_LANGUAGES } from "@/lib/constants/languages";
import { DIRECTORY_SPECIALTIES } from "@/lib/constants/specialties";
import { fetchDoctorProfileDetails } from "@/lib/doctors/fetch-doctor-profile-details";
import { getSupabaseClient } from "@/lib/supabase/client";
import { doctorProfileUpdateSchema } from "@/lib/validations/doctor-profile-update";

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-hc-brand focus:outline-none focus:ring-2 focus:ring-hc-brand/20 disabled:opacity-50";

type FieldErrors = Partial<
  Record<"bio" | "specialty" | "language" | "location" | "form", string>
>;

export type DoctorEditProfileProps = {
  doctorId: string;
  compact?: boolean;
};

export function DoctorEditProfile({ doctorId, compact = false }: DoctorEditProfileProps) {
  const [bio, setBio] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [language, setLanguage] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { profile, error } = await fetchDoctorProfileDetails(doctorId);
      if (cancelled) return;

      if (profile) {
        setBio(profile.bio);
        setSpecialty(profile.specialty);
        setLanguage(profile.language);
        setLocation(profile.location);
      }

      if (error) {
        setFieldErrors({ form: error });
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSaved(false);

    const parsed = doctorProfileUpdateSchema.safeParse({
      bio,
      specialty,
      language,
      location,
    });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key as keyof FieldErrors]) {
          next[key as keyof FieldErrors] = issue.message;
        }
      }
      setFieldErrors(next);
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setFieldErrors({ form: "Authentication is not configured." });
      return;
    }

    const { data: sessionData } = await client.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setFieldErrors({ form: "Please sign in again to update your profile." });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/doctors/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await res.json()) as { error?: string; details?: string };

      if (!res.ok) {
        setFieldErrors({
          form:
            payload.details ??
            payload.error ??
            "Could not save profile. Please try again.",
        });
        return;
      }

      setSaved(true);
    } catch {
      setFieldErrors({ form: "Something went wrong. Check your connection." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${
        compact ? "p-5" : "p-6"
      }`}
      aria-labelledby="doctor-edit-profile-heading"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex rounded-lg bg-[rgba(38,118,127,0.09)] p-2 text-hc-brand">
          <UserCircle className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2
            id="doctor-edit-profile-heading"
            className="text-lg font-semibold text-slate-900"
          >
            Edit Profile
          </h2>
          <p className="text-sm text-slate-600">
            Update your bio, specialty, language, and location.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10" aria-busy="true">
          <Loader2 className="h-7 w-7 animate-spin text-hc-brand" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {fieldErrors.form ? (
            <div
              role="alert"
              className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{fieldErrors.form}</span>
            </div>
          ) : null}

          {saved ? (
            <div
              role="status"
              className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>Profile saved successfully.</span>
            </div>
          ) : null}

          <div>
            <label htmlFor="doctor-bio" className="mb-1.5 block text-sm font-medium text-slate-700">
              Bio
            </label>
            <textarea
              id="doctor-bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className={inputClassName}
              disabled={submitting}
            />
            {fieldErrors.bio ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.bio}</p>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="doctor-specialty"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Specialty
              </label>
              <select
                id="doctor-specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className={inputClassName}
                disabled={submitting}
              >
                <option value="">Select specialty</option>
                {DIRECTORY_SPECIALTIES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {fieldErrors.specialty ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.specialty}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="doctor-language"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Language
              </label>
              <select
                id="doctor-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={inputClassName}
                disabled={submitting}
              >
                <option value="">Select language</option>
                {DIRECTORY_LANGUAGES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {fieldErrors.language ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.language}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label
              htmlFor="doctor-location"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Location
            </label>
            <input
              id="doctor-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClassName}
              placeholder="City, Country"
              disabled={submitting}
            />
            {fieldErrors.location ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.location}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-hc-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-hc-brand-hover disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save profile"
            )}
          </button>
        </form>
      )}
    </section>
  );
}
