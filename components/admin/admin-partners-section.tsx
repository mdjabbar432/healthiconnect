"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import type { AdminPartnerListItem, PartnerType } from "@/lib/admin/types";

const PARTNER_TYPE_OPTIONS: { value: PartnerType; label: string }[] = [
  { value: "lab", label: "Lab" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "radiology", label: "Radiology center" },
  { value: "other", label: "Other" },
];

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; partners: AdminPartnerListItem[] };

type AdminPartnersSectionProps = {
  onToast: (message: string) => void;
};

function formatPartnerType(type: PartnerType): string {
  return PARTNER_TYPE_OPTIONS.find((opt) => opt.value === type)?.label ?? type;
}

function formatServices(services: string[]): string {
  if (services.length === 0) return "—";
  return services.join(", ");
}

export function AdminPartnersSection({ onToast }: AdminPartnersSectionProps) {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<PartnerType>("lab");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const loadPartners = useCallback(async () => {
    setLoadState({ status: "loading" });

    try {
      const res = await fetch("/api/admin/partners", { cache: "no-store" });
      const body = (await res.json()) as {
        partners?: AdminPartnerListItem[];
        error?: string;
        details?: string;
      };

      if (!res.ok) {
        setLoadState({
          status: "error",
          message: body.details ?? body.error ?? "Could not load partners.",
        });
        return;
      }

      setLoadState({
        status: "ready",
        partners: body.partners ?? [],
      });
    } catch {
      setLoadState({
        status: "error",
        message: "Network error while loading partners. Please try again.",
      });
    }
  }, []);

  useEffect(() => {
    void loadPartners();
  }, [loadPartners]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      onToast("Partner name is required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          type,
          address,
          description,
        }),
      });
      const body = (await res.json()) as { error?: string; details?: string };

      if (!res.ok) {
        onToast(body.details ?? body.error ?? "Could not add partner.");
        return;
      }

      onToast(`${trimmedName} has been added.`);
      setName("");
      setAddress("");
      setDescription("");
      setType("lab");
      await loadPartners();
    } catch {
      onToast("Network error while adding partner.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(partner: AdminPartnerListItem) {
    if (deletingId) return;

    const confirmed = window.confirm(`Delete ${partner.name}? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(partner.id);

    try {
      const res = await fetch(`/api/admin/partners/${partner.id}`, {
        method: "DELETE",
      });
      const body = (await res.json()) as { error?: string; details?: string };

      if (!res.ok) {
        onToast(body.details ?? body.error ?? "Could not delete partner.");
        return;
      }

      onToast(`${partner.name} has been removed.`);
      await loadPartners();
    } catch {
      onToast("Network error while deleting partner.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section
      id="partner-management"
      className="scroll-mt-6 space-y-4"
      aria-labelledby="partner-management-heading"
    >
      <div>
        <h2
          id="partner-management-heading"
          className="text-lg font-semibold text-slate-900 sm:text-xl"
        >
          Partner management
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Manage labs, pharmacies, and radiology centers for the partner directory.
        </p>
      </div>

      <form
        onSubmit={(event) => void handleCreate(event)}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <p className="text-sm font-semibold text-slate-900">Add partner</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-hc-brand/30 focus:border-hc-brand focus:ring-2"
              placeholder="City Lab Diagnostics"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Type</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as PartnerType)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-hc-brand/30 focus:border-hc-brand focus:ring-2"
            >
              {PARTNER_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-slate-700">Address</span>
            <input
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-hc-brand/30 focus:border-hc-brand focus:ring-2"
              placeholder="123 Main St, Springfield"
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-slate-700">Services / description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-hc-brand/30 focus:border-hc-brand focus:ring-2"
              placeholder="Blood panels, imaging, home collection…"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-hc-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-hc-brand-hover disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Adding…
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" aria-hidden />
              Add partner
            </>
          )}
        </button>
      </form>

      {loadState.status === "loading" ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-12 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Loading partners…
        </div>
      ) : null}

      {loadState.status === "error" ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Could not load partners</p>
            <p className="mt-1">{loadState.message}</p>
          </div>
        </div>
      ) : null}

      {loadState.status === "ready" ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-slate-700 sm:px-6"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-slate-700 sm:px-6"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-slate-700 sm:px-6"
                  >
                    Address
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-slate-700 sm:px-6"
                  >
                    Services
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-slate-700 sm:px-6"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadState.partners.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No partners listed yet.
                    </td>
                  </tr>
                ) : (
                  loadState.partners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-4 font-medium text-slate-900 sm:px-6">
                        {partner.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600 sm:px-6">
                        {formatPartnerType(partner.type)}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-slate-600 sm:px-6">
                        {partner.address ?? "—"}
                      </td>
                      <td className="max-w-sm px-4 py-4 text-slate-600 sm:px-6">
                        {formatServices(partner.services)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                        <button
                          type="button"
                          onClick={() => void handleDelete(partner)}
                          disabled={deletingId === partner.id}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 sm:text-sm"
                        >
                          {deletingId === partner.id ? (
                            <>
                              <Loader2
                                className="h-4 w-4 animate-spin"
                                aria-hidden
                              />
                              Deleting…
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" aria-hidden />
                              Delete
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
