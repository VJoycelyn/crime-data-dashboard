import assert from "node:assert/strict";
import test from "node:test";
import { defaultFilters } from "./data";
import { filtersFromURL, shareURL } from "./share";

test("shared links preserve every filter and the selected page", () => {
  const filters = {
    ...defaultFilters,
    from: "2026-06-01",
    to: "2026-09-30",
    category: "Theft",
    district: "North",
    severity: "High",
    status: "Closed",
    search: "Sector / Block 03",
  };
  const url = shareURL("https://example.com/?ref=portfolio#records", filters);
  assert.deepEqual(filtersFromURL(url), filters);
  assert.equal(new URL(url).hash, "#records");
  assert.equal(new URL(url).searchParams.get("ref"), "portfolio");
});

test("default links stay concise and invalid views fall back safely", () => {
  const url = shareURL(
    "https://example.com/?district=North#geography",
    defaultFilters,
  );
  assert.equal(url, "https://example.com/#geography");
  assert.deepEqual(
    filtersFromURL("https://example.com/?district=invalid"),
    defaultFilters,
  );
  assert.deepEqual(
    filtersFromURL("https://example.com/?from=2027-01-01"),
    defaultFilters,
  );
  assert.deepEqual(filtersFromURL("invalid URL"), defaultFilters);
});
