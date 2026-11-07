// Price calculation for show bookings. Pure and safe to import in client components:
// the browser uses it for the live price, the server re-runs it on fresh DB data before charging.

export type ChoiceOption = { id: string; label: string; price: number }; // price in paise

export type PublicService = { id: string; name: string; nameHi: string | null; description: string | null; basePrice: number };
export type PublicLocation = { id: string; name: string; travelCost: number; note: string | null };
export type PublicQuestion = {
  id: string;
  label: string;
  labelHi: string | null;
  help: string | null;
  kind: "CHOICE" | "NUMBER" | "TEXT";
  required: boolean;
  options: ChoiceOption[];
  unitPrice: number;
  freeUnits: number;
  minValue: number | null;
  maxValue: number | null;
  serviceIds: string[];
};

export type BookingRules = { advancePercent: number; minNoticeDays: number; maxMonthsAhead: number };

export type Answers = Record<string, string>; // questionId → option id / number / text

export type QuoteLine = { label: string; amount: number };
export type AnswerSnapshot = { question: string; answer: string; price: number };

export type Quote = {
  base: number;
  travel: number;
  extras: number;
  total: number;
  advancePercent: number;
  advance: number;
  balance: number;
  lines: QuoteLine[];
  answers: AnswerSnapshot[];
};

export const questionsFor = (questions: PublicQuestion[], serviceId: string | null) =>
  questions.filter((q) => !q.serviceIds.length || (serviceId != null && q.serviceIds.includes(serviceId)));

/** Returns an error message for the first invalid / missing answer, or null. */
export function checkAnswers(questions: PublicQuestion[], answers: Answers): string | null {
  for (const q of questions) {
    const v = (answers[q.id] ?? "").trim();
    if (!v) {
      if (q.required) return `Please answer: ${q.labelHi || q.label}`;
      continue;
    }
    if (q.kind === "CHOICE" && !q.options.some((o) => o.id === v)) return `Please choose an option for: ${q.labelHi || q.label}`;
    if (q.kind === "NUMBER") {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0) return `Please enter a whole number for: ${q.labelHi || q.label}`;
      if (q.minValue != null && n < q.minValue) return `${q.labelHi || q.label}: minimum ${q.minValue}`;
      if (q.maxValue != null && n > q.maxValue) return `${q.labelHi || q.label}: maximum ${q.maxValue}`;
    }
    if (q.kind === "TEXT" && v.length > 300) return `${q.labelHi || q.label}: please keep it under 300 characters`;
  }
  return null;
}

/** Advance rounded up to whole rupees, never more than the total. */
export const advanceFor = (total: number, percent: number) => Math.min(total, Math.ceil((total * percent) / 100 / 100) * 100);

export function quote(
  service: PublicService | null,
  location: PublicLocation | null,
  questions: PublicQuestion[],
  answers: Answers,
  advancePercent: number,
): Quote {
  const base = service?.basePrice ?? 0;
  const travel = location?.travelCost ?? 0;
  const lines: QuoteLine[] = [];
  const snaps: AnswerSnapshot[] = [];
  if (service) lines.push({ label: service.nameHi || service.name, amount: base });
  if (location) lines.push({ label: travel ? `यात्रा खर्च · ${location.name}` : `${location.name} (कोई यात्रा खर्च नहीं)`, amount: travel });

  let extras = 0;
  for (const q of questionsFor(questions, service?.id ?? null)) {
    const v = (answers[q.id] ?? "").trim();
    if (!v) continue;
    const label = q.labelHi || q.label;
    let price = 0;
    let shown = v;
    if (q.kind === "CHOICE") {
      const o = q.options.find((x) => x.id === v);
      if (!o) continue;
      price = Math.max(0, o.price);
      shown = o.label;
    } else if (q.kind === "NUMBER") {
      const n = Math.max(0, Math.floor(Number(v) || 0));
      price = Math.max(0, n - q.freeUnits) * q.unitPrice;
      shown = String(n);
    }
    snaps.push({ question: label, answer: shown, price });
    if (price) {
      extras += price;
      lines.push({ label: `${label}: ${shown}`, amount: price });
    }
  }
  const total = base + travel + extras;
  const advance = advanceFor(total, advancePercent);
  return { base, travel, extras, total, advancePercent, advance, balance: total - advance, lines, answers: snaps };
}
