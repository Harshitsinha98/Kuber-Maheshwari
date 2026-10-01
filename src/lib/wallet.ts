import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "./prisma";
import { passPayload, passUrl } from "./tickets";
import { site } from "./site";
import { fmtDate, fmtTime } from "./format";

/**
 * Wallet passes for a booking's group pass (one QR, same one-entry-per-ticket rule at the gate).
 * Both switch on automatically once their env vars are set in Vercel — see README "Wallet passes".
 */

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || site.url;

/** Env values may be pasted as-is (PEM / JSON), with literal "\n", or base64-encoded. */
function envText(name: string) {
  const raw = (process.env[name] || "").trim();
  if (!raw) return "";
  if (raw.startsWith("{")) return raw; // JSON keeps its own "\n" escapes
  if (raw.startsWith("-----")) return raw.replace(/\\n/g, "\n");
  try {
    const dec = Buffer.from(raw, "base64").toString("utf8");
    if (dec.startsWith("-----") || dec.trim().startsWith("{")) return dec;
  } catch {}
  return raw.replace(/\\n/g, "\n");
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

async function loadBooking(bookingId: string) {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { event: true, ticketType: true, _count: { select: { tickets: true } } },
  });
  return b && b.status === "PAID" && b._count.tickets > 0 ? b : null;
}

// ======================= Google Wallet =======================
// Needs: GOOGLE_WALLET_ISSUER_ID and GOOGLE_WALLET_SERVICE_ACCOUNT (the service-account JSON key).

function googleCreds() {
  const issuer = (process.env.GOOGLE_WALLET_ISSUER_ID || "").trim();
  const json = envText("GOOGLE_WALLET_SERVICE_ACCOUNT");
  if (!issuer || !json) return null;
  try {
    const sa = JSON.parse(json) as { client_email?: string; private_key?: string };
    return sa.client_email && sa.private_key ? { issuer, email: sa.client_email, key: sa.private_key } : null;
  } catch {
    return null;
  }
}

export const googleWalletEnabled = () => Boolean(googleCreds());

const gid = (s: string) => s.replace(/[^\w.-]/g, "_");
const lt = (value: string) => ({ defaultValue: { language: "en-IN", value } });

/** Returns the "Save to Google Wallet" link (a signed JWT carrying the ticket class + object). */
export async function googleWalletSaveUrl(bookingId: string) {
  const c = googleCreds();
  if (!c) throw new Error("Google Wallet is not configured");
  const b = await loadBooking(bookingId);
  if (!b) return null;

  const classId = `${c.issuer}.${gid(`km_event_${b.eventId}`)}`;
  const objectId = `${c.issuer}.${gid(`km_pass_${b.id}`)}`;
  const n = b._count.tickets;
  const claims = {
    iss: c.email,
    aud: "google",
    typ: "savetowallet",
    origins: [new URL(siteUrl()).origin],
    payload: {
      eventTicketClasses: [
        {
          id: classId,
          issuerName: "Kuber Maheshwari",
          reviewStatus: "UNDER_REVIEW",
          eventName: lt(b.event.title),
          venue: { name: lt(b.event.venueName), address: lt(`${b.event.address}, ${b.event.city}`) },
          dateTime: {
            start: b.event.startsAt.toISOString(),
            ...(b.event.endsAt ? { end: b.event.endsAt.toISOString() } : {}),
            ...(b.event.gatesOpenAt ? { doorsOpen: b.event.gatesOpenAt.toISOString() } : {}),
          },
          logo: { sourceUri: { uri: `${siteUrl()}/images/brand/km-logo.png` }, contentDescription: lt("Kuber Maheshwari") },
          hexBackgroundColor: "#140d0e",
          homepageUri: { uri: siteUrl(), description: "Kuber Maheshwari" },
        },
      ],
      eventTicketObjects: [
        {
          id: objectId,
          classId,
          state: "ACTIVE",
          ticketHolderName: b.attendeeName,
          ticketNumber: `PASS-${b.id.slice(-8).toUpperCase()}`,
          ticketType: lt(n > 1 ? `${b.ticketType.name} · Admits ${n}` : b.ticketType.name),
          barcode: { type: "QR_CODE", value: passPayload(b.id), alternateText: n > 1 ? `Admits ${n}` : "1 ticket" },
          textModulesData: [{ id: "admits", header: "Admits", body: n > 1 ? `${n} people (one QR)` : "1 person" }],
          linksModuleData: { uris: [{ uri: passUrl(b.id), description: "Open ticket on website", id: "web" }] },
          ...(b.event.endsAt ? { validTimeInterval: { end: { date: new Date(b.event.endsAt.getTime() + 6 * 3600e3).toISOString() } } } : {}),
        },
      ],
    },
  };

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(claims));
  const sig = crypto.createSign("RSA-SHA256").update(`${header}.${body}`).sign(c.key);
  return `https://pay.google.com/gp/v/save/${header}.${body}.${b64url(sig)}`;
}

// ======================= Apple Wallet =======================
// Needs (Apple Developer Program): APPLE_PASS_TYPE_ID, APPLE_TEAM_ID, APPLE_PASS_CERT (PEM),
// APPLE_PASS_KEY (PEM), APPLE_PASS_KEY_PASSPHRASE (optional), APPLE_WWDR_CERT (PEM, Apple G4).

function appleCreds() {
  const passTypeIdentifier = (process.env.APPLE_PASS_TYPE_ID || "").trim();
  const teamIdentifier = (process.env.APPLE_TEAM_ID || "").trim();
  const signerCert = envText("APPLE_PASS_CERT");
  const signerKey = envText("APPLE_PASS_KEY");
  const wwdr = envText("APPLE_WWDR_CERT");
  if (!passTypeIdentifier || !teamIdentifier || !signerCert || !signerKey || !wwdr) return null;
  return { passTypeIdentifier, teamIdentifier, signerCert, signerKey, wwdr, signerKeyPassphrase: process.env.APPLE_PASS_KEY_PASSPHRASE || undefined };
}

export const appleWalletEnabled = () => Boolean(appleCreds());

let iconCache: Record<string, Buffer> | null = null;
async function appleImages() {
  if (iconCache) return iconCache;
  const sharp = (await import("sharp")).default;
  const src = fs.readFileSync(path.join(process.cwd(), "public", "images", "brand", "km-logo.png"));
  const png = (size: number) => sharp(src).resize(size, size).png().toBuffer();
  iconCache = {
    "icon.png": await png(29),
    "icon@2x.png": await png(58),
    "icon@3x.png": await png(87),
    "logo.png": await png(50),
    "logo@2x.png": await png(100),
    "logo@3x.png": await png(150),
  };
  return iconCache;
}

/** Builds a signed .pkpass file for the booking's group pass. */
export async function applePass(bookingId: string): Promise<Buffer | null> {
  const c = appleCreds();
  if (!c) throw new Error("Apple Wallet is not configured");
  const b = await loadBooking(bookingId);
  if (!b) return null;
  const { PKPass } = await import("passkit-generator");
  const n = b._count.tickets;

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: c.passTypeIdentifier,
    teamIdentifier: c.teamIdentifier,
    serialNumber: `km-${b.id}`,
    organizationName: "Kuber Maheshwari",
    description: `Ticket: ${b.event.title}`,
    logoText: "Kuber Maheshwari",
    backgroundColor: "rgb(20, 13, 14)",
    foregroundColor: "rgb(246, 238, 223)",
    labelColor: "rgb(212, 166, 74)",
    eventTicket: {},
  };

  const pass = new PKPass(
    { ...(await appleImages()), "pass.json": Buffer.from(JSON.stringify(passJson)) },
    { wwdr: c.wwdr, signerCert: c.signerCert, signerKey: c.signerKey, signerKeyPassphrase: c.signerKeyPassphrase }
  );

  pass.primaryFields.push({ key: "event", label: "EVENT", value: b.event.title });
  pass.secondaryFields.push(
    { key: "date", label: "DATE", value: fmtDate(b.event.startsAt) },
    { key: "time", label: "TIME", value: fmtTime(b.event.startsAt) }
  );
  pass.auxiliaryFields.push(
    { key: "name", label: "NAME", value: b.attendeeName },
    { key: "admits", label: "ADMITS", value: n > 1 ? `${n} people` : "1 person" },
    { key: "type", label: "TICKET", value: b.ticketType.name }
  );
  pass.backFields.push(
    { key: "venue", label: "Venue", value: `${b.event.venueName}, ${b.event.address}, ${b.event.city}` },
    { key: "how", label: "Entry", value: n > 1 ? `One QR for all ${n} people. Each ticket can enter only once.` : "Show this QR at the gate." },
    { key: "web", label: "Ticket online", value: passUrl(b.id) },
    { key: "booking", label: "Booking", value: b.id.slice(-8).toUpperCase() }
  );
  pass.setBarcodes({ format: "PKBarcodeFormatQR", message: passPayload(b.id), messageEncoding: "iso-8859-1", altText: n > 1 ? `Admits ${n}` : "" });
  pass.setRelevantDate(b.event.startsAt);
  if (b.event.endsAt) pass.setExpirationDate(new Date(b.event.endsAt.getTime() + 12 * 3600e3));
  return pass.getAsBuffer();
}

// ======================= Calendar (.ics) =======================

const icsEsc = (s: string) => s.replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => `\\${m}`).replace(/\r?\n/g, "\\n");
const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export async function bookingIcs(bookingId: string) {
  const b = await loadBooking(bookingId);
  if (!b) return null;
  const end = b.event.endsAt || new Date(b.event.startsAt.getTime() + 3 * 3600e3);
  const url = passUrl(b.id);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kuber Maheshwari//Tickets//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:km-${b.id}@kuber-maheshwari`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(b.event.startsAt)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEsc(b.event.title)}`,
    `LOCATION:${icsEsc(`${b.event.venueName}, ${b.event.address}, ${b.event.city}`)}`,
    `DESCRIPTION:${icsEsc(`${b._count.tickets} × ${b.ticketType.name} for ${b.attendeeName}.\nYour ticket: ${url}`)}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT3H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEsc(`${b.event.title} today. Keep your QR ready.`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // RFC 5545: CRLF line endings, lines folded at 75 octets
  const fold = (l: string) => {
    const out: string[] = [];
    let buf = Buffer.from(l);
    while (buf.length > 75) {
      let cut = 75;
      while (cut > 0 && (buf[cut] & 0xc0) === 0x80) cut--; // don't split a UTF-8 character
      out.push(buf.subarray(0, cut).toString());
      buf = Buffer.concat([Buffer.from(" "), buf.subarray(cut)]);
    }
    out.push(buf.toString());
    return out.join("\r\n");
  };
  return { filename: `${b.event.slug}.ics`, body: lines.map(fold).join("\r\n") + "\r\n" };
}
