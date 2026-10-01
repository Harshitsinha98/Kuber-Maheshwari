/** Money amount that is never shown as "Free" (revenue, totals). */
export const inr = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);

export const rupees = (paise: number) =>
  paise === 0
    ? "Free"
    : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);

const tz = "Asia/Kolkata";

export const fmtDate = (d: Date | string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: tz, weekday: "short", day: "numeric", month: "long", year: "numeric" }).format(new Date(d));

export const fmtTime = (d: Date | string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(d));

export const dayMonth = (d: Date | string) => {
  const parts = new Intl.DateTimeFormat("en-IN", { timeZone: tz, day: "2-digit", month: "short" }).formatToParts(new Date(d));
  return {
    day: parts.find((p) => p.type === "day")?.value ?? "",
    month: (parts.find((p) => p.type === "month")?.value ?? "").toUpperCase(),
  };
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 60) || "event";

/** Convert a <input type="datetime-local"> value (IST) to a Date. */
export const fromLocalIST = (v: string) => new Date(`${v}:00+05:30`);

export const toLocalIST = (d?: Date | null) => {
  if (!d) return "";
  const ist = new Date(d.getTime() + 5.5 * 3600 * 1000);
  return ist.toISOString().slice(0, 16);
};

/** Hindi date: "शुक्रवार, 2 अक्तूबर 2026" */
export const fmtDateHi = (d: Date | string) =>
  new Intl.DateTimeFormat("hi-IN", { timeZone: tz, weekday: "long", day: "numeric", month: "long", year: "numeric", numberingSystem: "latn" }).format(new Date(d));

export const fmtTimeHi = (d: Date | string) =>
  new Intl.DateTimeFormat("hi-IN", { timeZone: tz, hour: "numeric", minute: "2-digit", numberingSystem: "latn" }).format(new Date(d));

export const monthHi = (d: Date | string) =>
  new Intl.DateTimeFormat("hi-IN", { timeZone: tz, month: "short" }).format(new Date(d));
