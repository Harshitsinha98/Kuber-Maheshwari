import { Resend } from "resend";
import { prisma, safe } from "./prisma";
import { site } from "./site";
import { fmtDate, fmtTime, rupees } from "./format";
import { qrPng, ticketUrl } from "./tickets";

/**
 * Email via Resend. Everything switches on automatically once RESEND_API_KEY is set.
 *
 * Without a verified domain Resend runs in "testing" mode: the sender must be
 * onboarding@resend.dev and it only delivers to the email that owns the Resend account.
 * After verifying a domain, set EMAIL_FROM="Kuber Maheshwari <tickets@your-domain.com>".
 */

const SANDBOX_FROM = "Kuber Maheshwari <onboarding@resend.dev>";

export function emailConfig() {
  const apiKey = process.env.RESEND_API_KEY || "";
  const from = process.env.EMAIL_FROM || SANDBOX_FROM;
  const firstAdmin = (process.env.ADMIN_EMAILS || "").split(",")[0]?.trim() || "";
  const notify = process.env.NOTIFY_EMAIL || firstAdmin;
  return {
    enabled: Boolean(apiKey),
    from,
    notify,
    replyTo: notify || undefined,
    sandbox: /@resend\.dev>?$/i.test(from.trim()),
  };
}

export type SendResult = { ok: true; id?: string } | { ok: false; skipped?: boolean; error: string };

type Mail = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: { filename: string; content: Buffer; contentId?: string }[];
};

/** Turns Resend's raw errors into something the owner can act on. */
function explain(msg: string) {
  if (/only send testing emails|verify a domain/i.test(msg))
    return `${msg}. (Testing mode: until a domain is verified in Resend, emails only reach the email you signed up to Resend with.)`;
  if (/api key is invalid|unauthori[sz]ed|missing api key/i.test(msg)) return `${msg}. Check RESEND_API_KEY in Vercel.`;
  if (/domain is not verified|not verified/i.test(msg)) return `${msg}. Verify the domain in Resend, or remove EMAIL_FROM to use the testing sender.`;
  return msg;
}

async function record(ok: boolean, mail: Mail, error?: string) {
  const value = JSON.stringify({ at: new Date().toISOString(), to: mail.to, subject: mail.subject, error });
  const key = ok ? "email_last_ok" : "email_last_error";
  await safe(() => prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } }), null);
}

export async function sendMail(mail: Mail): Promise<SendResult> {
  const cfg = emailConfig();
  if (!cfg.enabled) {
    console.warn(`[email] RESEND_API_KEY not set. Skipped "${mail.subject}" to ${mail.to}`);
    return { ok: false, skipped: true, error: "Email is not set up yet (RESEND_API_KEY missing)." };
  }
  try {
    const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: cfg.from,
      replyTo: cfg.replyTo,
      ...mail,
    });
    if (error) throw new Error(error.message);
    await record(true, mail);
    return { ok: true, id: data?.id };
  } catch (e) {
    const error = explain((e as Error).message || "Unknown email error");
    console.error("[email]", mail.subject, "→", mail.to, ":", error);
    await record(false, mail, error);
    return { ok: false, error };
  }
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const shell = (body: string) => `<!doctype html><html><body style="margin:0;background:#f6eedf;font-family:Georgia,serif;color:#1a0f0a">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffaf1;border:1px solid #e6d4b0">
<tr><td style="background:#140d0e;padding:28px 32px;color:#f6eedf">
<div style="font-size:13px;word-spacing:6px;color:#d4a64a">॥ जय श्री राम ॥</div>
<div style="font-size:28px;line-height:1.5;margin-top:6px">${site.nameHi}</div>
<div style="font-size:12px;letter-spacing:2px;color:#bfae93;margin-top:2px">KUBER MAHESHWARI</div>
</td></tr>
<tr><td style="padding:28px 32px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6">${body}</td></tr>
<tr><td style="padding:18px 32px;border-top:1px solid #e6d4b0;font-family:Arial,sans-serif;font-size:12px;color:#7a6a55">
${site.phones.map((p) => p.display).join(" · ")} · ${site.city}</td></tr>
</table></td></tr></table></body></html>`;

const loadBooking = (id: string) =>
  prisma.booking.findUniqueOrThrow({
    where: { id },
    include: { event: true, ticketType: true, tickets: { orderBy: { seatLabel: "asc" } } },
  });

/** E-tickets with inline QR codes to the buyer (+ a short alert to the owner). */
export async function sendTicketEmail(bookingId: string): Promise<SendResult> {
  const b = await loadBooking(bookingId);

  const attachments = await Promise.all(
    b.tickets.map(async (t, i) => ({ filename: `ticket-${i + 1}-${t.code}.png`, content: await qrPng(t.code), contentId: `qr-${t.code}` }))
  );

  const tickets = b.tickets
    .map(
      (t) => `<table width="100%" style="border:1px dashed #c9a227;margin:14px 0"><tr>
<td style="padding:14px;width:150px"><img src="cid:qr-${t.code}" width="150" height="150" alt="QR ${t.code}" style="display:block"/></td>
<td style="padding:14px;vertical-align:top"><div style="font-size:12px;color:#7a6a55">TICKET ${esc(t.seatLabel)}</div>
<div style="font-size:18px;font-weight:bold;letter-spacing:2px">${t.code}</div>
<div style="margin-top:6px">${esc(b.ticketType.name)}</div>
<a href="${ticketUrl(t.code)}" style="display:inline-block;margin-top:10px;color:#8b1e2d">Open ticket →</a></td></tr></table>`
    )
    .join("");

  const when = `${fmtDate(b.event.startsAt)} · ${fmtTime(b.event.startsAt)}`;
  const where = `${b.event.venueName}, ${b.event.address}, ${b.event.city}`;
  const html = shell(`<p>नमस्ते ${esc(b.attendeeName)} ji,</p>
<p>Your booking is confirmed. Show the QR code below at the entry gate. Each QR admits one person, once.</p>
<h2 style="font-family:Georgia,serif;margin:18px 0 4px">${esc(b.event.title)}</h2>
<div>${when}</div>
<div>${esc(where)}</div>
<div style="margin-top:8px;color:#7a6a55">${b.quantity} × ${esc(b.ticketType.name)} · ${rupees(b.amount)} · Booking ${b.id.slice(-8).toUpperCase()}</div>
${tickets}
<p style="color:#7a6a55;font-size:12px">You can also see your tickets anytime at <a href="${site.url}/my-tickets">${site.url}/my-tickets</a></p>`);

  const text = [
    `Namaste ${b.attendeeName} ji,`,
    `Your booking for ${b.event.title} is confirmed.`,
    `${when}\n${where}`,
    `${b.quantity} x ${b.ticketType.name} (${rupees(b.amount)})`,
    ...b.tickets.map((t) => `Ticket ${t.seatLabel}: ${t.code}  ${ticketUrl(t.code)}`),
    `All tickets: ${site.url}/my-tickets`,
  ].join("\n\n");

  const res = await sendMail({ to: b.attendeeEmail, subject: `🎟️ Your tickets: ${b.event.title}`, html, text, attachments });

  const { notify } = emailConfig();
  if (notify && res.ok) {
    await sendMail({
      to: notify,
      subject: `New booking: ${b.quantity} × ${b.ticketType.name} (${b.event.title})`,
      html: shell(
        `<p><b>${esc(b.attendeeName)}</b> (${esc(b.attendeePhone)}, ${esc(b.attendeeEmail)}) booked ${b.quantity} × ${esc(b.ticketType.name)} for <b>${esc(b.event.title)}</b>. Amount: ${rupees(b.amount)}.</p>`
      ),
    });
  }
  return res;
}

/** Sends tickets and records success on the booking (emailSentAt). Used for first send and re-sends. */
export async function sendTicketEmailAndMark(bookingId: string): Promise<SendResult> {
  const res = await sendTicketEmail(bookingId);
  await prisma.booking.update({ where: { id: bookingId }, data: { emailSentAt: res.ok ? new Date() : null } });
  return res;
}

/** Friendly "see you tomorrow" email with ticket links. */
export async function sendReminderEmail(bookingId: string): Promise<SendResult> {
  const b = await loadBooking(bookingId);
  const html = shell(`<p>नमस्ते ${esc(b.attendeeName)} ji,</p>
<p>A reminder that <b>${esc(b.event.title)}</b> is tomorrow. We look forward to seeing you! 🙏</p>
<p><b>${fmtDate(b.event.startsAt)} · ${fmtTime(b.event.startsAt)}</b>${b.event.gatesOpenAt ? `<br/>Gates open ${fmtTime(b.event.gatesOpenAt)}` : ""}<br/>${esc(
    `${b.event.venueName}, ${b.event.address}, ${b.event.city}`
  )}</p>
<p><a href="${b.event.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.event.venueName}, ${b.event.address}, ${b.event.city}`)}`}" style="color:#8b1e2d">Get directions →</a></p>
<p>Your ${b.tickets.length > 1 ? `${b.tickets.length} tickets` : "ticket"}:</p>
<ul>${b.tickets.map((t) => `<li><a href="${ticketUrl(t.code)}" style="color:#8b1e2d">Ticket ${esc(t.seatLabel)} · ${t.code}</a></li>`).join("")}</ul>
<p style="color:#7a6a55;font-size:12px">Please keep the QR ready on your phone at the gate.</p>`);
  return sendMail({ to: b.attendeeEmail, subject: `⏰ Tomorrow: ${b.event.title}`, html });
}

export async function sendTestEmail(to: string): Promise<SendResult> {
  const cfg = emailConfig();
  return sendMail({
    to,
    subject: "✅ Test email | Kuber Maheshwari website",
    html: shell(`<p>Email is working. 🎉</p><p>Sender: <b>${esc(cfg.from)}</b><br/>Mode: <b>${cfg.sandbox ? "Testing (no domain yet)" : "Own domain"}</b></p>
<p>Ticket emails, booking alerts, enquiry replies and event reminders will now be sent automatically.</p>`),
    text: `Email is working. Sender: ${cfg.from}`,
  });
}

export async function sendEnquiryEmails(e: {
  name: string;
  phone: string;
  email?: string | null;
  eventType: string;
  eventDate?: string | null;
  city?: string | null;
  message?: string | null;
}) {
  const rows = [
    ["Name", e.name],
    ["Phone", e.phone],
    ["Email", e.email],
    ["Event", e.eventType],
    ["Date", e.eventDate],
    ["City", e.city],
    ["Message", e.message],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#7a6a55;vertical-align:top">${k}</td><td>${esc(v)}</td></tr>`)
    .join("");

  const { notify } = emailConfig();
  const jobs: Promise<SendResult>[] = [];
  if (notify) jobs.push(sendMail({ to: notify, subject: `New enquiry: ${e.eventType} (${e.name})`, html: shell(`<table>${rows}</table>`) }));
  if (e.email)
    jobs.push(
      sendMail({
        to: e.email,
        subject: "We received your enquiry | Kuber Maheshwari",
        html: shell(`<p>नमस्ते ${esc(e.name)} ji,</p><p>Thank you for reaching out. Our team will call you back shortly on ${esc(e.phone)}.</p><p>जय श्री राम 🙏</p>`),
      })
    );
  await Promise.allSettled(jobs);
}

/** Last success / failure, shown on Admin → Email. */
export async function emailActivity() {
  const rows = await safe(() => prisma.setting.findMany({ where: { key: { in: ["email_last_ok", "email_last_error"] } } }), []);
  const get = (k: string) => {
    const v = rows.find((r) => r.key === k)?.value;
    try {
      return v ? (JSON.parse(v) as { at: string; to: string | string[]; subject: string; error?: string }) : null;
    } catch {
      return null;
    }
  };
  return { lastOk: get("email_last_ok"), lastError: get("email_last_error") };
}

/**
 * Reminders for events happening "tomorrow" (IST calendar day). Each event is reminded once.
 * Called daily by cron (and manually from Admin → Email).
 */
export async function sendTomorrowReminders() {
  const IST = 5.5 * 3600e3;
  const istNow = new Date(Date.now() + IST);
  const startOfTomorrowIST = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + 1) - IST;
  const from = new Date(startOfTomorrowIST);
  const to = new Date(startOfTomorrowIST + 24 * 3600e3);

  const events = await prisma.event.findMany({ where: { status: "PUBLISHED", startsAt: { gte: from, lt: to } }, select: { id: true, title: true } });
  const report: { event: string; sent: number; failed: number; skipped?: string }[] = [];
  for (const ev of events) {
    const key = `reminder_sent:${ev.id}`;
    if (await prisma.setting.findUnique({ where: { key } })) {
      report.push({ event: ev.title, sent: 0, failed: 0, skipped: "already reminded" });
      continue;
    }
    const bookings = await prisma.booking.findMany({ where: { eventId: ev.id, status: "PAID" }, select: { id: true } });
    let sent = 0;
    let failed = 0;
    for (const b of bookings) {
      if ((await sendReminderEmail(b.id)).ok) sent++;
      else failed++;
    }
    if (sent > 0 || bookings.length === 0) await prisma.setting.create({ data: { key, value: new Date().toISOString() } });
    report.push({ event: ev.title, sent, failed });
  }
  return { window: { from: from.toISOString(), to: to.toISOString() }, events: report };
}
