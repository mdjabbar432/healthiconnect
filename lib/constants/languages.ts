/** Common languages for doctor registration and profile filters. */
export const DIRECTORY_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "Arabic",
  "Hindi",
  "Bengali",
  "Mandarin",
  "Portuguese",
  "German",
  "Urdu",
] as const;

export type DirectoryLanguage = (typeof DIRECTORY_LANGUAGES)[number];
