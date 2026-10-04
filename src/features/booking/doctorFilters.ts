import type { PublicPractitioner } from "./hooks";

export const GENDER_LABEL: Record<string, string> = { F: "Female", M: "Male", O: "Other" };

export type DoctorFilters = {
  gender: string;
  language: string; // language code
  discipline: string;
  interest: string;
  acceptingOnly: boolean;
};

export const NO_FILTERS: DoctorFilters = { gender: "", language: "", discipline: "", interest: "", acceptingOnly: false };

const hasProfileFilter = (f: DoctorFilters) => Boolean(f.gender || f.language || f.discipline || f.interest);
export const hasAnyFilter = (f: DoctorFilters) => hasProfileFilter(f) || f.acceptingOnly;

const speaks = (d: PublicPractitioner, code: string) =>
  [...(d.languages_fluent ?? []), ...(d.languages_conversational ?? [])].some((l) => l.code === code);

export function applyFilters(doctors: PublicPractitioner[], f: DoctorFilters) {
  return doctors.filter((d) => {
    if (hasProfileFilter(f)) {
      // A doctor who keeps their profile private can't be matched on it, so they drop out
      if (!d.has_profile) return false;
      if (f.gender && d.gender !== f.gender) return false;
      if (f.language && !speaks(d, f.language)) return false;
      if (f.discipline && d.discipline !== f.discipline) return false;
      if (f.interest && !(d.special_interests ?? []).some((i) => i.toLowerCase() === f.interest.toLowerCase())) {
        return false;
      }
    }
    if (f.acceptingOnly && d.has_profile && d.accepts_new_patients === false) return false;
    return true;
  });
}

/** Only offer filter choices that at least one doctor actually has. */
export function filterOptions(doctors: PublicPractitioner[]) {
  const visible = doctors.filter((d) => d.has_profile);
  const languages = new Map<string, string>();
  const disciplines = new Map<string, string>();
  const interests = new Map<string, string>(); // lowercase -> as written
  const genders = new Set<string>();

  for (const d of visible) {
    if (d.gender) genders.add(d.gender);
    if (d.discipline) disciplines.set(d.discipline, d.discipline_label || d.discipline);
    for (const l of [...(d.languages_fluent ?? []), ...(d.languages_conversational ?? [])]) languages.set(l.code, l.label);
    for (const i of d.special_interests ?? []) if (!interests.has(i.toLowerCase())) interests.set(i.toLowerCase(), i);
  }

  const byLabel = (a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label);
  return {
    hasAny: visible.length > 0,
    genders: [...genders].map((value) => ({ value, label: GENDER_LABEL[value] ?? value })),
    languages: [...languages].map(([value, label]) => ({ value, label })).sort(byLabel),
    disciplines: [...disciplines].map(([value, label]) => ({ value, label })).sort(byLabel),
    interests: [...interests.values()].sort((a, b) => a.localeCompare(b)),
  };
}