import { defaultFilters, validateFilters, type Filters } from "./data";

const fields: (keyof Filters)[] = [
  "from",
  "to",
  "category",
  "district",
  "severity",
  "status",
  "search",
];

export function filtersFromURL(value: string): Filters {
  try {
    const url = new URL(value);
    const candidate = { ...defaultFilters };
    for (const field of fields) {
      const supplied = url.searchParams.get(field);
      if (supplied !== null) candidate[field] = supplied;
    }
    return validateFilters(candidate);
  } catch {
    return { ...defaultFilters };
  }
}

export function shareURL(value: string, filters: Filters): string {
  const url = new URL(value);
  const valid = validateFilters(filters);
  for (const field of fields) {
    if (valid[field] === defaultFilters[field]) url.searchParams.delete(field);
    else url.searchParams.set(field, valid[field]);
  }
  return url.toString();
}
