"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Stethoscope,
  AlertCircle,
  Info,
  Upload,
} from "lucide-react";
import { DIRECTORY_LANGUAGES } from "@/lib/constants/languages";
import { DIRECTORY_SPECIALTIES } from "@/lib/constants/specialties";
import { getSupabaseClient } from "@/lib/supabase/client";
import { doctorRegistrationFormSchema } from "@/lib/validations/doctor-registration";

const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED_PROFILE_PHOTO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-hc-brand focus:outline-none focus:ring-2 focus:ring-hc-brand/20 disabled:opacity-50";

const showDevHint =
  process.env.NEXT_PUBLIC_DEV_DOCTOR_REGISTRATION === "true" ||
  process.env.NODE_ENV === "development";

type FieldErrors = Partial<
  Record<
    | "fullName"
    | "email"
    | "password"
    | "licenseNumber"
    | "bio"
    | "specialty"
    | "language"
    | "location"
    | "photoUrl"
    | "form",
    string
  >
>;

export type DoctorRegistrationFormProps = {
  onSuccess?: (info: { draft: boolean; message: string | null }) => void;
};

export function DoctorRegistrationForm({ onSuccess }: DoctorRegistrationFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [bio, setBio] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [language, setLanguage] = useState("");
  const [location, setLocation] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successDraft, setSuccessDraft] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_PROFILE_PHOTO_TYPES.has(file.type)) {
      setFieldErrors((prev) => ({
        ...prev,
        photoUrl: "Please upload a PNG, JPG, or WEBP image.",
      }));
      return;
    }

    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      setFieldErrors((prev) => ({
        ...prev,
        photoUrl: "Image must be 5MB or smaller.",
      }));
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setFieldErrors((prev) => ({
        ...prev,
        photoUrl:
          "File upload is unavailable. Check Supabase configuration in .env.local.",
      }));
      return;
    }

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.photoUrl;
      return next;
    });
    setUploading(true);

    const extension =
      file.name.split(".").pop()?.toLowerCase() ||
      (file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg");
    const filePath = `doctor-profiles/${Math.random()}.${extension}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      setFieldErrors((prev) => ({
        ...prev,
        photoUrl: error.message || "Upload failed. Please try again.",
      }));
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setProfileUrl(data.publicUrl);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);

    const trimmedPhoto = profileUrl.trim();
    const parsed = doctorRegistrationFormSchema.safeParse({
      fullName,
      email,
      password,
      licenseNumber,
      bio,
      specialty,
      language,
      location,
      ...(trimmedPhoto ? { photoUrl: trimmedPhoto } : {}),
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
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/doctors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await res.json()) as {
        error?: string;
        details?: string;
        code?: string;
        draft?: boolean;
        message?: string;
      };

      if (!res.ok) {
        const isRateLimit = payload.code === "auth_rate_limit";
        const detailText =
          typeof payload.details === "string" ? payload.details : undefined;

        setFieldErrors({
          form: isRateLimit
            ? (detailText ??
              "Email signup is temporarily rate-limited. Wait a few minutes, use a different email, or disable confirm-email in Supabase Auth for local testing.")
            : detailText
              ? `${payload.error ?? "Registration failed"}: ${detailText}`
              : (payload.error ?? "Registration failed. Please try again."),
        });
        setSubmitting(false);
        return;
      }

      const draft = Boolean(payload.draft);
      const message = payload.message ?? null;

      if (!draft) {
        const client = getSupabaseClient();
        if (client) {
          const { error: signInError } = await client.auth.signInWithPassword({
            email: parsed.data.email,
            password: parsed.data.password,
          });
          if (!signInError) {
            onSuccess?.({ draft: false, message: null });
            router.replace("/doctor/dashboard");
            return;
          }
        }
      }

      setSuccessDraft(draft);
      setSuccessMessage(message);
      setSuccess(true);
      onSuccess?.({ draft, message });
    } catch {
      setFieldErrors({
        form: "Something went wrong. Check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      {success ? (
        <div
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2
            className="mx-auto h-14 w-14 text-emerald-600"
            aria-hidden
          />
          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            {successDraft
              ? "Application saved for testing"
              : "Application submitted!"}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
            {successDraft ? (
              successMessage ??
              "Your application was saved without sending a confirmation email (development fallback). An admin can still review it in the queue."
            ) : (
              "Application submitted! Waiting for Admin approval."
            )}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/doctor/login"
              className="inline-flex rounded-[10px] bg-hc-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-hc-brand-hover"
            >
              Sign in to dashboard
            </Link>
            <Link
              href="/doctors"
              className="inline-flex rounded-[10px] border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Browse the directory
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          noValidate
        >
      {showDevHint ? (
        <div className="mb-6 flex gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
          <p>
            <span className="font-medium">Local development:</span> signup runs
            on the server without confirmation emails. If Supabase rate-limits
            email, your application is still saved as a draft so you can keep
            testing.
          </p>
        </div>
      ) : null}

      {fieldErrors.form ? (
        <div
          role="alert"
          className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{fieldErrors.form}</span>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClassName}
            placeholder="Dr. Jane Smith"
            disabled={submitting}
          />
          {fieldErrors.fullName ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClassName}
            placeholder="you@clinic.com"
            disabled={submitting}
          />
          {fieldErrors.email ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClassName}
            placeholder="At least 8 characters"
            disabled={submitting}
          />
          {fieldErrors.password ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="licenseNumber"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            License info
          </label>
          <input
            id="licenseNumber"
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            className={inputClassName}
            placeholder="State / national license ID"
            disabled={submitting}
          />
          {fieldErrors.licenseNumber ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.licenseNumber}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="specialty" className="mb-1.5 block text-sm font-medium text-slate-700">
            Specialty
          </label>
          <select
            id="specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className={inputClassName}
            disabled={submitting}
          >
            <option value="">Select your specialty</option>
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
          <label htmlFor="language" className="mb-1.5 block text-sm font-medium text-slate-700">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={inputClassName}
            disabled={submitting}
          >
            <option value="">Select primary language</option>
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

        <div className="sm:col-span-2">
          <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-slate-700">
            Location
          </label>
          <input
            id="location"
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

        <div className="sm:col-span-2">
          <span
            id="profilePhoto-label"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Profile photo
          </span>
          <label
            htmlFor="profilePhoto"
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-gray-300 bg-slate-50/50 px-6 py-10 transition-colors hover:border-[#1e7a82] hover:bg-slate-50 ${
              submitting || uploading ? "pointer-events-none opacity-60" : ""
            }`}
            aria-labelledby="profilePhoto-label"
          >
            {uploading ? (
              <p className="text-sm font-medium text-slate-600">Uploading...</p>
            ) : profileUrl ? (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profileUrl}
                  alt="Profile preview"
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-[#1e7a82]/20"
                />
                <p className="text-sm font-medium text-emerald-600">
                  ✓ Uploaded Successfully
                </p>
                <p className="text-xs text-slate-500">Click to replace image</p>
              </div>
            ) : (
              <>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                  <Upload className="h-6 w-6 text-[#1e7a82]" aria-hidden />
                </span>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-800">
                    Upload a file
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    PNG, JPG, WEBP up to 5MB
                  </p>
                </div>
              </>
            )}
            <input
              id="profilePhoto"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileUpload}
              disabled={submitting || uploading}
            />
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Optional. A professional headshot helps patients recognize you.
          </p>
          {fieldErrors.photoUrl ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.photoUrl}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-slate-700">
            Bio / description
          </label>
          <textarea
            id="bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={inputClassName}
            placeholder="Briefly describe your experience, approach to care, and areas of focus."
            disabled={submitting}
          />
          {fieldErrors.bio ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.bio}</p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || uploading}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-[10px] bg-hc-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-hc-brand-hover disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Submitting application…
          </>
        ) : (
          <>
            <Stethoscope className="h-4 w-4" aria-hidden />
            Submit application
          </>
        )}
      </button>

      <p className="mt-4 text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link href="/doctor/login" className="font-medium text-hc-brand hover:underline">
          Sign in
        </Link>
      </p>
        </form>
      )}
    </div>
  );
}
