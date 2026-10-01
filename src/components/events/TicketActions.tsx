"use client";

import { useEffect, useState } from "react";
import { WhatsappIcon } from "@/components/site/Icons";

type Props = {
  title: string;
  dateLine: string;
  venueLine: string;
  name: string;
  type: string;
  admits: number;
  qr: string; // data URL of the group pass QR
  links: { share: string; ics: string; google: string | null; apple: string | null };
};

const Ico = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const icons = {
  download: "M12 4v11m0 0-4-4m4 4 4-4M5 19h14",
  print: "M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M7 14h10v6H7z",
  calendar: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  install: "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm4 5v6m0 0-2.5-2.5M12 14l2.5-2.5",
  check: "M5 12.5l4.5 4.5L19 7.5",
};

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const btn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-ivory/20 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold hover:text-gold";

function cssFont(v: string, fallback: string) {
  const f = getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  return f ? `${f}, ${fallback}` : fallback;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

/** Draws the ticket on a canvas in the browser (uses the site's own Hindi/English fonts) and downloads a PNG. */
async function downloadImage(p: Props) {
  await document.fonts.ready;
  const W = 1080, PAD = 80;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = 1760;
  const ctx = c.getContext("2d")!;
  const hindi = cssFont("--font-tiro", "serif");
  const display = cssFont("--font-cormorant", "Georgia, serif");
  const sans = cssFont("--font-manrope", "Arial, sans-serif");

  ctx.fillStyle = "#0f0a0b";
  ctx.fillRect(0, 0, W, c.height);
  // card
  ctx.fillStyle = "#f6eedf";
  ctx.fillRect(40, 40, W - 80, c.height - 80);
  ctx.fillStyle = "#140d0e";
  ctx.fillRect(40, 40, W - 80, 560);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#d4a64a";
  ctx.font = `46px ${hindi}`;
  ctx.fillText("कुबेर माहेश्वरी", PAD + 20, 150);
  if (p.admits > 1) {
    const label = `ADMITS ${p.admits}`;
    ctx.font = `bold 30px ${sans}`;
    const w = ctx.measureText(label).width + 56;
    ctx.fillStyle = "#e8820c";
    ctx.beginPath();
    ctx.roundRect(W - PAD - 20 - w, 100, w, 64, 32);
    ctx.fill();
    ctx.fillStyle = "#0f0a0b";
    ctx.fillText(label, W - PAD - 20 - w + 28, 143);
  }
  ctx.fillStyle = "#f6eedf";
  ctx.font = `600 74px ${display}`;
  let y = 270;
  for (const l of wrap(ctx, p.title, W - 2 * PAD - 40).slice(0, 3)) {
    ctx.fillText(l, PAD + 20, y);
    y += 84;
  }
  ctx.fillStyle = "#bfae93";
  ctx.font = `34px ${sans}`;
  const dy = y + 6;
  ctx.fillText(p.dateLine, PAD + 20, dy);
  for (const [i, l] of wrap(ctx, p.venueLine, W - 2 * PAD - 40).slice(0, 2).entries()) ctx.fillText(l, PAD + 20, dy + 50 * (i + 1));

  // perforation
  ctx.strokeStyle = "rgba(29,20,22,0.25)";
  ctx.setLineDash([18, 14]);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(60, 600);
  ctx.lineTo(W - 60, 600);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#0f0a0b";
  for (const x of [40, W - 40]) {
    ctx.beginPath();
    ctx.arc(x, 600, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  // QR
  const img = new Image();
  img.src = p.qr;
  await img.decode();
  const Q = 680;
  ctx.drawImage(img, (W - Q) / 2, 660, Q, Q);

  ctx.fillStyle = "#1d1416";
  ctx.textAlign = "center";
  ctx.font = `bold 36px ${sans}`;
  ctx.fillText(p.admits > 1 ? `One QR for all ${p.admits} people` : "Show this QR at the gate", W / 2, 1410);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(29,20,22,0.5)";
  ctx.font = `26px ${sans}`;
  ctx.fillText("NAME", PAD + 20, 1520);
  ctx.textAlign = "right";
  ctx.fillText(p.type.toUpperCase(), W - PAD - 20, 1520);
  ctx.fillStyle = "#1d1416";
  ctx.font = `bold 38px ${sans}`;
  ctx.fillText(`${p.admits} ticket${p.admits > 1 ? "s" : ""}`, W - PAD - 20, 1575);
  ctx.textAlign = "left";
  ctx.fillText(p.name.slice(0, 28), PAD + 20, 1575);
  ctx.fillStyle = "rgba(29,20,22,0.5)";
  ctx.font = `24px ${sans}`;
  ctx.textAlign = "center";
  ctx.fillText("Each ticket enters once · kuber-maheshwari.vercel.app", W / 2, 1680);

  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  if (!blob) return;
  const file = new File([blob], `ticket-${p.title.replace(/[^\w]+/g, "-").toLowerCase()}.png`, { type: "image/png" });
  // On phones, the share sheet offers "Save image" straight to the gallery.
  if (navigator.canShare?.({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      await navigator.share({ files: [file], title: p.title });
      return;
    } catch {}
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export default function TicketActions(p: Props) {
  const [saving, setSaving] = useState(false);
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null);
  const [offline, setOffline] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(/iPhone|iPad|iPod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    navigator.serviceWorker?.ready.then(() => setOffline(true)).catch(() => {});
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const shareText = `🎟️ ${p.title}\n${p.dateLine}\n${p.venueLine}\n\nTicket${p.admits > 1 ? ` (admits ${p.admits})` : ""}: ${p.links.share}`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: p.title, text: shareText });
        return;
      } catch {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener");
  }

  return (
    <div className="print:hidden" data-ticket-actions>
      <div className="flex flex-wrap gap-3">
        {p.links.google && (
          <a href={p.links.google} className="inline-flex h-12 items-center gap-2 rounded-full bg-ivory px-5 text-xs font-semibold text-night hover:bg-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path fill="#4285F4" d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5V9H3z" />
              <path fill="#34A853" d="M3 9h18v3H3z" />
              <path fill="#FBBC04" d="M3 12h18v3H3z" />
              <path fill="#EA4335" d="M3 15h18v1.5A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
            </svg>
            Add to Google Wallet
          </a>
        )}
        {p.links.apple && (
          <a href={p.links.apple} className="inline-flex h-12 items-center gap-2 rounded-full bg-black px-5 text-xs font-semibold text-white ring-1 ring-ivory/30 hover:bg-neutral-900">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.8-3-.8-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.5 1.3-2.6-.1 0-2.5-.9-2.5-3.8zM14.2 5.8c.6-.8 1.1-1.8 1-2.8-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.7-1 2.7 1 .1 2-.5 2.7-1.3z" />
            </svg>
            Add to Apple Wallet
          </a>
        )}
        <button
          type="button"
          className={btn}
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await downloadImage(p);
            } finally {
              setSaving(false);
            }
          }}
        >
          <Ico d={icons.download} /> {saving ? "Preparing…" : "Save as image"}
        </button>
        <button type="button" className={btn} onClick={() => window.print()}>
          <Ico d={icons.print} /> Print / PDF
        </button>
        <button type="button" className={btn} onClick={share}>
          <WhatsappIcon className="h-4 w-4" /> Share
        </button>
        <a href={p.links.ics} className={btn}>
          <Ico d={icons.calendar} /> Add to calendar
        </a>
        {installEvt && (
          <button
            type="button"
            className={btn}
            onClick={async () => {
              await installEvt.prompt();
              setInstallEvt(null);
            }}
          >
            <Ico d={icons.install} /> Install app
          </button>
        )}
      </div>
      <p className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        {offline && (
          <span className="text-green-400">
            <Ico d={icons.check} />
          </span>
        )}
        {offline ? "Saved on this phone: this ticket opens even without internet. " : "Open this page once on your phone to keep the ticket available offline. "}
        {ios && !installEvt && "On iPhone: Share → Add to Home Screen to keep tickets one tap away."}
      </p>
    </div>
  );
}
