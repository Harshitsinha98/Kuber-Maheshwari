import { prisma, safe } from "./prisma";
import { fmtDate, fmtTime, rupees } from "./format";
import { passUrl } from "./tickets";

/**
 * WhatsApp alerts via Meta's official WhatsApp Cloud API.
 * Switches on automatically when WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID are set.
 *
 * Business-initiated messages must use pre-approved templates. The exact template texts
 * to create in WhatsApp Manager are in WHATSAPP_TEMPLATES below (also shown in Admin → WhatsApp).
 */

export const WHATSAPP_TEMPLATES = {
  booking: {
    env: "WHATSAPP_TEMPLATE_BOOKING",
    defaultName: "new_booking_alert",
    purpose: "To you, for every confirmed booking",
    body: "नई बुकिंग 🎟️\nकार्यक्रम: {{1}}\nनाम: {{2}}\nमोबाइल: {{3}}\nटिकट: {{4}}\nराशि: {{5}}",
    sample: ["Sangeetmay Sundarkand · 2 Oct", "Ramesh Sharma", "9827751400", "2 × General", "₹390"],
  },
  enquiry: {
    env: "WHATSAPP_TEMPLATE_ENQUIRY",
    defaultName: "new_enquiry_alert",
    purpose: "To you, for every enquiry from the website",
    body: "नई पूछताछ 📩\nनाम: {{1}}\nमोबाइल: {{2}}\nआयोजन: {{3}}\nतारीख / शहर: {{4}}",
    sample: ["Suresh Gupta", "9425331165", "Sundarkand", "12 Oct · Ujjain"],
  },
  ticket: {
    env: "WHATSAPP_TEMPLATE_TICKET",
    defaultName: "ticket_confirmed",
    purpose: "To the buyer, with their ticket link (optional)",
    body: "नमस्ते {{1}} जी 🙏\n{{2}} के लिए आपकी बुकिंग कन्फर्म है।\nतारीख: {{3}}\nटिकट: {{4}}\nअपना QR टिकट यहाँ देखें: {{5}}",
    sample: ["Ramesh", "Sangeetmay Sundarkand", "2 Oct, 5:20 pm", "2 × General", "https://kuber-maheshwari.vercel.app/p/abc?s=xyz"],
  },
} as const;

type Kind = keyof typeof WHATSAPP_TEMPLATES;

const digits = (s: string) => s.replace(/\D/g, "");
/** Indian numbers: 10 digits → 91XXXXXXXXXX. Anything longer is kept as given. */
export const waNumber = (s: string) => {
  const d = digits(s);
  return d.length === 10 ? `91${d}` : d.replace(/^0+/, "");
};

export function whatsappConfig() {
  const token = (process.env.WHATSAPP_TOKEN || "").trim();
  const phoneId = (process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
  const notify = (process.env.WHATSAPP_NOTIFY_TO || "")
    .split(",")
    .map((s) => waNumber(s))
    .filter((s) => s.length >= 11);
  const name = (k: Kind) => (process.env[WHATSAPP_TEMPLATES[k].env] || WHATSAPP_TEMPLATES[k].defaultName).trim();
  return {
    enabled: Boolean(token && phoneId),
    token,
    phoneId,
    notify,
    lang: (process.env.WHATSAPP_TEMPLATE_LANG || "hi").trim(),
    templates: { booking: name("booking"), enquiry: name("enquiry"), ticket: name("ticket") },
    // Ticket messages to buyers are opt-in: only when this is "on".
    customerTickets: (process.env.WHATSAPP_SEND_TICKETS || "").toLowerCase() === "on",
    base: (process.env.WHATSAPP_API_BASE || "https://graph.facebook.com").replace(/\/$/, ""),
    version: process.env.WHATSAPP_GRAPH_VERSION || "v23.0",
  };
}

export type WaResult = { ok: true; id?: string } | { ok: false; skipped?: boolean; error: string };

// Template parameters can't contain new lines, tabs or more than 4 spaces in a row.
const clean = (s: string) => s.replace(/[\r\n\t]+/g, " ").replace(/ {4,}/g, "   ").trim().slice(0, 900) || "-";

function explain(code: number | undefined, msg: string) {
  if (code === 132001) return `${msg}. The template name/language doesn't exist or isn't approved yet. Check WhatsApp Manager → Message templates.`;
  if (code === 132000) return `${msg}. The template's number of {{variables}} doesn't match. Copy the template text exactly from Admin → WhatsApp.`;
  if (code === 190) return `${msg}. The access token is invalid or expired. Create a permanent System User token.`;
  if (code === 131030) return `${msg}. With the free test number, recipients must first be added (Allowed numbers) in the WhatsApp API setup page.`;
  if (code === 131026) return `${msg}. This number can't receive the message (not on WhatsApp, or hasn't accepted the latest terms).`;
  return msg;
}

async function record(ok: boolean, info: { to: string; template: string; error?: string }) {
  const key = ok ? "wa_last_ok" : "wa_last_error";
  const value = JSON.stringify({ at: new Date().toISOString(), ...info });
  await safe(() => prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } }), null);
}

export async function sendTemplate(to: string, template: string, params: string[]): Promise<WaResult> {
  const c = whatsappConfig();
  if (!c.enabled) return { ok: false, skipped: true, error: "WhatsApp is not set up yet (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID missing)." };
  const num = waNumber(to);
  try {
    const r = await fetch(`${c.base}/${c.version}/${c.phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: num,
        type: "template",
        template: {
          name: template,
          language: { code: c.lang },
          components: params.length ? [{ type: "body", parameters: params.map((t) => ({ type: "text", text: clean(t) })) }] : [],
        },
      }),
      cache: "no-store",
    });
    const j = (await r.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { code?: number; message?: string; error_data?: { details?: string } } };
    if (!r.ok || j.error) {
      const msg = j.error?.error_data?.details || j.error?.message || `HTTP ${r.status}`;
      throw Object.assign(new Error(msg), { code: j.error?.code });
    }
    await record(true, { to: num, template });
    return { ok: true, id: j.messages?.[0]?.id };
  } catch (e) {
    const err = explain((e as { code?: number }).code, (e as Error).message || "WhatsApp error");
    console.error("[whatsapp]", template, "→", num, ":", err);
    await record(false, { to: num, template, error: err });
    return { ok: false, error: err };
  }
}

/** Sends to every WHATSAPP_NOTIFY_TO number; never throws. */
async function toOwners(kind: "booking" | "enquiry", params: string[]) {
  const c = whatsappConfig();
  if (!c.enabled || !c.notify.length) return [];
  return Promise.all(c.notify.map((n) => sendTemplate(n, c.templates[kind], params)));
}

const shortDate = (d: Date) => `${fmtDate(d).replace(/^\w+, /, "")}`;

/** Called once per booking when it becomes PAID (after tickets exist). */
export async function whatsappBookingAlerts(bookingId: string) {
  const c = whatsappConfig();
  if (!c.enabled) return;
  const b = await prisma.booking.findUnique({ where: { id: bookingId }, include: { event: true, ticketType: true } });
  if (!b) return;
  await toOwners("booking", [
    `${b.event.title} · ${shortDate(b.event.startsAt)}`,
    b.attendeeName,
    b.attendeePhone,
    `${b.quantity} × ${b.ticketType.name}`,
    b.amount === 0 ? "Free" : rupees(b.amount),
  ]);
  if (c.customerTickets) {
    await sendTemplate(b.attendeePhone, c.templates.ticket, [
      b.attendeeName.split(" ")[0],
      b.event.title,
      `${shortDate(b.event.startsAt)}, ${fmtTime(b.event.startsAt)}`,
      `${b.quantity} × ${b.ticketType.name}`,
      passUrl(b.id),
    ]);
  }
}

export async function whatsappEnquiryAlert(e: { name: string; phone: string; eventType: string; eventDate?: string | null; city?: string | null }) {
  await toOwners("enquiry", [e.name, e.phone, e.eventType, [e.eventDate, e.city].filter(Boolean).join(" · ") || "—"]);
}

export async function whatsappTest(kind: Kind, to?: string): Promise<WaResult[]> {
  const c = whatsappConfig();
  const targets = to ? [to] : c.notify;
  if (!targets.length) return [{ ok: false, error: "Add WHATSAPP_NOTIFY_TO (your WhatsApp number) first." }];
  return Promise.all(targets.map((n) => sendTemplate(n, c.templates[kind], [...WHATSAPP_TEMPLATES[kind].sample])));
}

export async function whatsappActivity() {
  const rows = await safe(() => prisma.setting.findMany({ where: { key: { in: ["wa_last_ok", "wa_last_error"] } } }), []);
  const get = (k: string) => {
    try {
      const v = rows.find((r) => r.key === k)?.value;
      return v ? (JSON.parse(v) as { at: string; to: string; template: string; error?: string }) : null;
    } catch {
      return null;
    }
  };
  return { lastOk: get("wa_last_ok"), lastError: get("wa_last_error") };
}
