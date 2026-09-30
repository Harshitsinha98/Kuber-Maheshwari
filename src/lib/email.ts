import { Resend } from "resend";
import { prisma } from "./prisma";
import { site } from "./site";
import { fmtDate, fmtTime, rupees } from "./format";
import { qrPng, ticketUrl } from "./tickets";

const resend = () => (process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null);
const from = () => process.env.EMAIL_FROM || "Kuber Maheshwari <onboarding@resend.dev>";

async function send(opts: {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentId?: string }[];
}) {
  const r = resend();
  if (!r) {
    console.warn(`[email] RESEND_API_KEY missing — would send "${opts.subject}" to ${opts.to}`);
    return;
  }
  const { error } = await r.emails.send({ from: from(), ...opts });
  if (error) throw new Error(error.message);
}

const shell = (body: string) => `<!doctype html><html><body style="margin:0;background:#f6eedf;font-family:Georgia,serif;color:#1a0f0a">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffaf1;border:1px solid #e6d4b0">
<tr><td style="background:#140d0e;padding:28px 32px;color:#f6eedf">
<div style="font-size:12px;letter-spacing:4px;color:#d4a64a">॥ जय श्री राम ॥</div>
<div style="font-size:28px;margin-top:6px">${site.nameHi}</div>
<div style="font-size:12px;letter-spacing:2px;color:#bfae93;margin-top:2px">KUBER MAHESHWARI</div>
</td></tr>
<tr><td style="padding:28px 32px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6">${body}</td></tr>
<tr><td style="padding:18px 32px;border-top:1px solid #e6d4b0;font-family:Arial,sans-serif;font-size:12px;color:#7a6a55">
${site.phones.map((p) => p.display).join(" · ")} · ${site.city}</td></tr>
</table></td></tr></table></body></html>`;

export async function sendTicketEmail(bookingId: string) {
  const b = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { event: true, ticketType: true, tickets: { orderBy: { seatLabel: "asc" } } },
  });

  const attachments = await Promise.all(
    b.tickets.map(async (t, i) => ({
      filename: `ticket-${i + 1}-${t.code}.png`,
      content: await qrPng(t.code),
      contentId: `qr-${t.code}`,
    }))
  );

  const tickets = b.tickets
    .map(
      (t) => `<table width="100%" style="border:1px dashed #c9a227;margin:14px 0"><tr>
<td style="padding:14px"><img src="cid:qr-${t.code}" width="150" height="150" alt="QR ${t.code}" style="display:block"/></td>
<td style="padding:14px;vertical-align:top"><div style="font-size:12px;color:#7a6a55">TICKET ${t.seatLabel}</div>
<div style="font-size:18px;font-weight:bold;letter-spacing:2px">${t.code}</div>
<div style="margin-top:6px">${b.ticketType.name}</div>
<a href="${ticketUrl(t.code)}" style="display:inline-block;margin-top:10px;color:#8b1e2d">Open ticket →</a></td></tr></table>`
    )
    .join("");

  const html = shell(`<p>नमस्ते ${b.attendeeName} ji,</p>
<p>Your booking is confirmed. Show the QR code below at the entry gate. Each QR admits one person, once.</p>
<h2 style="font-family:Georgia,serif;margin:18px 0 4px">${b.event.title}</h2>
<div>${fmtDate(b.event.startsAt)} · ${fmtTime(b.event.startsAt)}</div>
<div>${b.event.venueName}, ${b.event.address}, ${b.event.city}</div>
<div style="margin-top:8px;color:#7a6a55">${b.quantity} × ${b.ticketType.name} · ${rupees(b.amount)} · Booking ${b.id.slice(-8).toUpperCase()}</div>
${tickets}
<p style="color:#7a6a55;font-size:12px">You can also see your tickets anytime at ${site.url}/my-tickets</p>`);

  await send({ to: b.attendeeEmail, subject: `🎟️ Your tickets: ${b.event.title}`, html, attachments });

  if (process.env.NOTIFY_EMAIL) {
    await send({
      to: process.env.NOTIFY_EMAIL,
      subject: `New booking: ${b.quantity} × ${b.ticketType.name} (${b.event.title})`,
      html: shell(`<p><b>${b.attendeeName}</b> (${b.attendeePhone}, ${b.attendeeEmail}) booked ${b.quantity} × ${b.ticketType.name} for <b>${b.event.title}</b>. Amount: ${rupees(b.amount)}.</p>`),
    }).catch((e) => console.error("[email] owner notify failed", e));
  }
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
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#7a6a55">${k}</td><td>${escape(String(v))}</td></tr>`)
    .join("");

  const jobs: Promise<unknown>[] = [];
  if (process.env.NOTIFY_EMAIL)
    jobs.push(send({ to: process.env.NOTIFY_EMAIL, subject: `New enquiry: ${e.eventType} (${e.name})`, html: shell(`<table>${rows}</table>`) }));
  if (e.email)
    jobs.push(
      send({
        to: e.email,
        subject: "We received your enquiry | Kuber Maheshwari",
        html: shell(`<p>नमस्ते ${escape(e.name)} ji,</p><p>Thank you for reaching out. Our team will call you back shortly on ${escape(e.phone)}.</p><p>जय श्री राम 🙏</p>`),
      })
    );
  await Promise.allSettled(jobs);
}

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
