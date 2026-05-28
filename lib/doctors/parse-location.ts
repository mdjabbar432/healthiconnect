/** Splits "City, Country" or uses the whole string as city. */
export function parseLocationInput(location: string): {
  city: string;
  country: string | null;
} {
  const trimmed = location.trim();
  const commaIndex = trimmed.indexOf(",");
  if (commaIndex === -1) {
    return { city: trimmed, country: null };
  }

  const city = trimmed.slice(0, commaIndex).trim();
  const country = trimmed.slice(commaIndex + 1).trim();
  return {
    city: city || trimmed,
    country: country || null,
  };
}
