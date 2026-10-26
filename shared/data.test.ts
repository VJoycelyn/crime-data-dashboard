import assert from "node:assert/strict";
import test from "node:test";
import {
  AS_OF,
  DATA_START,
  categories,
  categoryColors,
  defaultFilters,
  districts,
  filterRecords,
  records,
  severities,
  statuses,
  summarize,
  type Filters,
  validateFilters,
} from "./data.js";

const validDate = /^\d{4}-\d{2}-\d{2}$/;

test("generates a deterministic-sized synthetic dataset with unique bounded records", () => {
  assert.ok(
    records.length >= 7500 && records.length <= 9500,
    `unexpected record count ${records.length}`,
  );
  const ids = new Set(records.map((record) => record.id));
  assert.equal(ids.size, records.length);
  for (const record of records) {
    assert.match(record.id, /^DEMO-(25|26)-\d{6}$/);
    assert.match(record.date, validDate);
    assert.ok(record.date >= DATA_START && record.date <= AS_OF);
    assert.match(record.time, /^\d{2}:\d{2}$/);
    assert.ok(
      categories.includes(record.category as (typeof categories)[number]),
    );
    assert.ok(
      districts.includes(record.district as (typeof districts)[number]),
    );
    assert.ok(
      severities.includes(record.severity as (typeof severities)[number]),
    );
    assert.ok(statuses.includes(record.status as (typeof statuses)[number]));
    assert.match(record.subject, /^Synthetic subject #\d{6}$/);
    assert.ok(
      record.x >= 0 && record.x <= 100 && record.y >= 0 && record.y <= 100,
    );
    assert.equal(record.timeline[0].event, "Report logged");
    assert.equal(record.timeline[0].date, record.date);
    assert.equal(
      new Set(record.linkedOffenses).size,
      record.linkedOffenses.length,
    );
    for (let index = 0; index < record.timeline.length; index += 1) {
      const event = record.timeline[index];
      assert.ok(event.date >= record.date && event.date <= AS_OF);
      if (index > 0) assert.ok(event.date >= record.timeline[index - 1].date);
    }
    assert.ok(
      !/\b(Alice|Bob|John|Jane|Street|Avenue|Road)\b/i.test(
        `${record.summary} ${record.location} ${record.subject}`,
      ),
    );
  }
});

test("default filters constrain records accurately and search is case insensitive", () => {
  const selected = filterRecords(defaultFilters);
  assert.ok(selected.length > 0);
  assert.ok(
    selected.every(
      (record) =>
        record.date >= defaultFilters.from && record.date <= defaultFilters.to,
    ),
  );
  const target = selected[0];
  const byId = filterRecords({
    ...defaultFilters,
    search: target.id.toLowerCase(),
  });
  assert.ok(byId.some((record) => record.id === target.id));
  assert.ok(
    byId.every((record) =>
      record.id.toLowerCase().includes(target.id.toLowerCase()),
    ),
  );
  const constrained = filterRecords({
    ...defaultFilters,
    category: "Burglary",
    district: "North",
    severity: "High",
    status: "Closed",
  });
  assert.ok(
    constrained.every(
      (record) =>
        record.category === "Burglary" &&
        record.district === "North" &&
        record.severity === "High" &&
        record.status === "Closed",
    ),
  );
});

test("summary identities, stable ordering, category colors, and trend totals hold", () => {
  const summary = summarize(defaultFilters);
  assert.equal(summary.total, filterRecords(defaultFilters).length);
  assert.equal(
    summary.closed +
      summary.open +
      summary.statuses.find((item) => item.name === "Referred")!.count,
    summary.total,
  );
  assert.equal(
    summary.closed,
    summary.statuses.find((item) => item.name === "Closed")!.count,
  );
  assert.equal(
    summary.open,
    summary.statuses.find((item) => item.name === "Open")!.count +
      summary.statuses.find((item) => item.name === "Investigating")!.count,
  );
  assert.equal(
    summary.categories.reduce((sum, item) => sum + item.count, 0),
    summary.total,
  );
  assert.equal(
    summary.districts.reduce((sum, item) => sum + item.count, 0),
    summary.total,
  );
  assert.equal(
    summary.severity.reduce((sum, item) => sum + item.count, 0),
    summary.total,
  );
  assert.equal(
    summary.statuses.reduce((sum, item) => sum + item.count, 0),
    summary.total,
  );
  assert.deepEqual(
    summary.categories.map((item) => item.name),
    [...categories],
  );
  assert.deepEqual(
    summary.districts.map((item) => item.name),
    [...districts],
  );
  assert.deepEqual(
    summary.severity.map((item) => item.name),
    [...severities],
  );
  assert.deepEqual(
    summary.statuses.map((item) => item.name),
    [...statuses],
  );
  assert.deepEqual(
    summary.categories.map((item) => item.color),
    categories.map((name) => categoryColors[name]),
  );
  assert.equal(
    summary.trend.reduce((sum, item) => sum + item.total, 0),
    summary.total,
  );
  assert.equal(
    summary.trend.reduce((sum, item) => sum + item.closed, 0),
    summary.closed,
  );
});

test("previous equal-length window uses all non-date filters and returns a percentage delta", () => {
  const filters: Filters = {
    ...defaultFilters,
    from: "2026-05-01",
    to: "2026-08-31",
    category: "Theft",
    district: "Central",
    search: "",
  };
  const summary = summarize(filters);
  assert.ok(summary.previousTotal > 0);
  assert.notEqual(summary.delta, null);
  const previous = filterRecords({
    ...filters,
    from: "2025-12-29",
    to: "2026-04-30",
  });
  assert.equal(summary.previousTotal, previous.length);
  const noHistory = summarize({
    ...defaultFilters,
    from: DATA_START,
    to: "2025-01-31",
  });
  assert.equal(noHistory.previousTotal, 0);
  assert.equal(noHistory.delta, null);
});

test("zero-record summaries preserve every chart bucket and have zero-safe rates", () => {
  const filters = { ...defaultFilters, search: "DEMO-NOT-FOUND" };
  const summary = summarize(filters);
  assert.equal(summary.total, 0);
  assert.equal(summary.closed, 0);
  assert.equal(summary.closureRate, 0);
  assert.equal(summary.open, 0);
  assert.equal(summary.delta, null);
  assert.equal(summary.categories.length, categories.length);
  assert.equal(summary.districts.length, districts.length);
  assert.equal(summary.trend.length, 6);
  assert.ok(
    summary.trend.every((item) => item.total === 0 && item.closed === 0),
  );
});

test("validation rejects malformed, out-of-scope, and oversized filters", () => {
  assert.throws(
    () => validateFilters({ ...defaultFilters, from: "2024-01-01" }),
    /within/,
  );
  assert.throws(
    () => validateFilters({ ...defaultFilters, to: "2026-10-25" }),
    /within/,
  );
  assert.throws(
    () =>
      validateFilters({
        ...defaultFilters,
        from: "2026-06-02",
        to: "2026-06-01",
      }),
    /on or before/,
  );
  assert.throws(
    () => validateFilters({ ...defaultFilters, category: "Unknown" }),
    /category/,
  );
  assert.throws(
    () => validateFilters({ ...defaultFilters, search: "x".repeat(81) }),
    /80/,
  );
});

test("monthly labels stay in the correct UTC month across client timezones", () => {
  const original = process.env.TZ;
  try {
    process.env.TZ = "America/New_York";
    assert.deepEqual(
      summarize(defaultFilters).trend.map((item) => item.label),
      ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    );
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});
