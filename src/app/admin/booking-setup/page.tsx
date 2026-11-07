import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { inr } from "@/lib/format";
import { razorpayEnabled, razorpayTestMode } from "@/lib/razorpay";
import { ensureBookingTables } from "@/lib/booking-tables";
import { getRules, toPublicQuestion } from "@/lib/show-booking";
import { guard } from "../guard";
import { Badge, Card, PageTitle, btn, btnGhost } from "../ui";
import { loadStarterSetup } from "../booking-actions";
import { LocationForm, QuestionForm, RulesForm, ServiceForm } from "./SetupForms";

export const dynamic = "force-dynamic";

const Section = ({ n, title, hi, note, children }: { n: number; title: string; hi: string; note: string; children: React.ReactNode }) => (
  <Card className="space-y-5">
    <div className="flex items-start gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron font-display text-xl text-night">{n}</span>
      <div>
        <p className="font-hindi text-sm text-kumkum">{hi}</p>
        <h2 className="font-display text-2xl leading-tight">{title}</h2>
        <p className="mt-1 text-sm text-ink/60">{note}</p>
      </div>
    </div>
    {children}
  </Card>
);

const Item = ({ title, sub, active, children }: { title: string; sub: string; active: boolean; children: React.ReactNode }) => (
  <details className="group rounded-2xl border border-[#ecdfc7] open:bg-[#fffcf6]">
    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
      <span className="flex-1">
        <span className="font-medium">{title}</span>
        <span className="block text-xs text-ink/55">{sub}</span>
      </span>
      <Badge tone={active ? "green" : "gray"}>{active ? "Live" : "Hidden"}</Badge>
      <span className="text-ink/40 transition-transform group-open:rotate-180">▾</span>
    </summary>
    <div className="border-t border-[#ecdfc7] p-4">{children}</div>
  </details>
);

export default async function BookingSetup() {
  await guard("pricing");
  await ensureBookingTables();
  const order = [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];
  const [services, locations, questionRows, rules] = await Promise.all([
    prisma.bookingService.findMany({ orderBy: order }),
    prisma.bookingLocation.findMany({ orderBy: order }),
    prisma.bookingQuestion.findMany({ orderBy: order }),
    getRules(),
  ]);
  const questions = questionRows.map((q) => ({ ...toPublicQuestion(q), active: q.active, sortOrder: q.sortOrder }));
  const svcNames = new Map(services.map((s) => [s.id, s.name]));

  const liveServices = services.filter((s) => s.active).length;
  const liveLocations = locations.filter((l) => l.active).length;
  const payments = razorpayEnabled();
  const checks = [
    { ok: liveServices > 0, text: liveServices ? `${liveServices} programme(s) live` : "Add a programme with its price and switch it on" },
    { ok: liveLocations > 0, text: liveLocations ? `${liveLocations} location(s) live` : "Add at least one location (e.g. Indore with ₹0 travel)" },
    {
      ok: payments || rules.advancePercent === 0,
      text: payments
        ? `Online payment on${razorpayTestMode() ? " (Razorpay TEST mode)" : ""}: customers pay ${rules.advancePercent}% advance`
        : "Razorpay keys not added: bookings arrive as requests for you to confirm",
    },
  ];
  const live = liveServices > 0 && liveLocations > 0;
  const empty = !services.length && !locations.length && !questions.length;

  return (
    <>
      <PageTitle title="Booking Setup" hi="बुकिंग सेटअप">
        <Link href="/booking#book" target="_blank" className={btnGhost}>
          View booking page ↗
        </Link>
      </PageTitle>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-ink/60">Online booking on the website</p>
            <p className={`font-display text-3xl ${live ? "text-green-700" : "text-amber-700"}`}>{live ? "● Live" : "○ Not live yet"}</p>
          </div>
          {empty && (
            <form action={loadStarterSetup}>
              <button className={btn}>Quick start: load programmes, Indore & a guests question</button>
            </form>
          )}
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          {checks.map((c) => (
            <li key={c.text} className={`rounded-2xl px-4 py-3 text-sm ${c.ok ? "bg-green-50 text-green-900" : "bg-amber-50 text-amber-900"}`}>
              {c.ok ? "✓" : "!"} {c.text}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink/60">
          Price the customer sees = <b>programme base price</b> + <b>travelling expense</b> of the chosen location + <b>extra price from their answers</b>. They pay the advance % online and the date is
          locked on the calendar instantly.
        </p>
      </Card>

      <div className="space-y-6">
        <Section n={1} title="Advance payment & booking window" hi="अग्रिम राशि" note="How much the customer pays online to lock the date, and how far ahead they can book.">
          <RulesForm rules={rules} />
        </Section>

        <Section n={2} title="Programmes & base price" hi="कार्यक्रम और मूल्य" note="What a customer can book (e.g. Sundarkand). Hidden programmes are not shown on the website.">
          <div className="space-y-2">
            {services.map((s) => (
              <Item key={s.id} title={s.nameHi ? `${s.nameHi} · ${s.name}` : s.name} sub={`Base price ${inr(s.basePrice)}`} active={s.active}>
                <ServiceForm s={s} />
              </Item>
            ))}
          </div>
          <div className="rounded-2xl border border-dashed border-[#dccfb6] p-4">
            <p className="mb-3 text-sm font-medium">Add a programme</p>
            <ServiceForm />
          </div>
        </Section>

        <Section
          n={3}
          title="Locations & travelling expense"
          hi="स्थान और यात्रा खर्च"
          note="Customers can only choose from these locations. Set the travelling expense for each one (₹0 for Indore)."
        >
          <div className="space-y-2">
            {locations.map((l) => (
              <Item key={l.id} title={l.name} sub={l.travelCost ? `Travel ${inr(l.travelCost)}` : "No travelling expense"} active={l.active}>
                <LocationForm l={l} />
              </Item>
            ))}
          </div>
          <div className="rounded-2xl border border-dashed border-[#dccfb6] p-4">
            <p className="mb-3 text-sm font-medium">Add a location</p>
            <LocationForm />
          </div>
        </Section>

        <Section
          n={4}
          title="Questions for the customer"
          hi="ग्राहक से सवाल"
          note="Asked after the location. Each answer can change the price, e.g. number of people, duration, sound system."
        >
          <div className="space-y-2">
            {questions.map((q) => (
              <Item
                key={q.id}
                title={q.labelHi || q.label}
                sub={[
                  q.kind === "CHOICE"
                    ? q.options.map((o) => `${o.label}${o.price ? ` +${inr(o.price)}` : ""}`).join(" · ")
                    : q.kind === "NUMBER"
                      ? `Number${q.unitPrice ? ` · ${inr(q.unitPrice)} per unit${q.freeUnits ? ` above ${q.freeUnits}` : ""}` : ""}`
                      : "Text answer",
                  q.serviceIds.length ? `Only for ${q.serviceIds.map((id) => svcNames.get(id) || "?").join(", ")}` : "All programmes",
                ].join("  |  ")}
                active={q.active}
              >
                <QuestionForm q={q} services={services} />
              </Item>
            ))}
          </div>
          <div className="rounded-2xl border border-dashed border-[#dccfb6] p-4">
            <p className="mb-3 text-sm font-medium">Add a question</p>
            <QuestionForm services={services} />
          </div>
        </Section>
      </div>
    </>
  );
}
