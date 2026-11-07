// Month grid helpers shared by the public and admin calendars. Client-safe.

export const WEEKDAYS_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];
export const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** 6 weeks × 7 days (Sunday first) covering the month of `month` ("YYYY-MM"). */
export function monthCells(month: string) {
  const first = new Date(`${month}-01T00:00:00Z`);
  const start = new Date(first);
  start.setUTCDate(1 - first.getUTCDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { key, day: d.getUTCDate(), inMonth: key.slice(0, 7) === month, weekday: d.getUTCDay() };
  });
}

export const shiftMonth = (month: string, n: number) => {
  const d = new Date(`${month}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
};

export const monthTitle = (month: string, lang: "hi" | "en") =>
  new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { month: "long", year: "numeric", timeZone: "UTC", numberingSystem: "latn" }).format(new Date(`${month}-15T00:00:00Z`));
