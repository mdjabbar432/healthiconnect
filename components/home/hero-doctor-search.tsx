"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HeroDoctorSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function runSearch() {
    const trimmed = query.trim();
    const href = trimmed
      ? `/doctors?search=${encodeURIComponent(trimmed)}`
      : "/doctors";
    router.push(href);
  }

  return (
    <form
      className="search-form"
      onSubmit={(event) => {
        event.preventDefault();
        runSearch();
      }}
    >
      <label htmlFor="doctor-search" className="search-label">
        Search by doctor name or specialty
      </label>
      <div className="search-form__row">
        <input
          id="doctor-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. Cardiologist, Dr. Sarah Ahmed"
          className="search-input"
          autoComplete="off"
        />
        <button type="submit" className="hc-btn hc-btn--primary search-submit">
          <Search className="search-submit__icon" aria-hidden />
          <span>Search</span>
        </button>
      </div>
    </form>
  );
}
