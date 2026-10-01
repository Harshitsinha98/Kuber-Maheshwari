import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { emailActivity, emailConfig } from "@/lib/email";
import { fmtDate } from "@/lib/format";
import { guard } from "../guard";
import { Badge, Card, PageTitle } from "../ui";
import { EmailActionButton, TestEmailForm } from "./EmailForms";
import { resendUnsentTickets, sendRemindersNow } from "../actions";

export const dynamic = "force-dynamic";

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "");

export default async function AdminEmail() {
  const s = await guard();
  const cfg = emailConfig();
  const [activity, unsent] = await Promise.all([
    emailActivity(),
    prisma.booking.findMany({
      where: { status: "PAID", emailSentAt: null },
      include: { event: { select: { title: true, startsAt: true } }, ticketType: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <>
      <PageTitle title="Email" />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Status</h2>
          {!cfg.enabled ? <Badge tone="amber">Not set up</Badge> : cfg.sandbox ? <Badge tone="amber">On · testing mode</Badge> : <Badge tone="green">On · own domain</Badge>}
        </div>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div>
            <dt className="text-ink/50">API key (RESEND_API_KEY)</dt>
            <dd className="mt-0.5 font-medium">{cfg.enabled ? "✓ Added" : "✗ Missing"}</dd>
          </div>
          <div>
            <dt className="text-ink/50">Sender (EMAIL_FROM)</dt>
            <dd className="mt-0.5 break-all font-medium">{cfg.from}</dd>
          </div>
          <div>
            <dt className="text-ink/50">Owner alerts go to (NOTIFY_EMAIL)</dt>
            <dd className="mt-0.5 break-all font-medium">{cfg.notify || "—"}</dd>
          </div>
        </dl>

        {!cfg.enabled && (
          <div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">To switch email on:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>
                Sign up at <b>resend.com</b> → <b>API Keys</b> → <b>Create API Key</b> (permission: Sending access).
              </li>
              <li>
                Vercel → Settings → Environment Variables → add <code>RESEND_API_KEY</code> → <b>Redeploy</b>.
              </li>
              <li>Come back here and click <b>Send test email</b>.</li>
            </ol>
            <p className="mt-2">Nothing else is needed. Tickets of bookings made before that will be listed below so you can send them in one click.</p>
          </div>
        )}
        {cfg.enabled && cfg.sandbox && (
          <div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            <p>
              <b>Testing mode (no domain yet):</b> Resend only delivers to <b>the email you signed up to Resend with</b>. Customers will not receive ticket emails yet, but they
              can always see and show their QR tickets under <b>My Tickets</b> on the website.
            </p>
            <p className="mt-2">
              When the domain is ready: Resend → <b>Domains</b> → add it and the DNS records → after it shows <i>Verified</i>, set{" "}
              <code>EMAIL_FROM=&quot;Kuber Maheshwari &lt;tickets@your-domain.com&gt;&quot;</code> in Vercel and redeploy.
            </p>
          </div>
        )}

        <div className="mt-5 grid gap-3 text-xs text-ink/60 md:grid-cols-2">
          <p>
            Last sent: {activity.lastOk ? `${when(activity.lastOk.at)} · “${activity.lastOk.subject}” → ${[activity.lastOk.to].flat().join(", ")}` : "never"}
          </p>
          {activity.lastError && (
            <p className="text-red-700">
              Last error ({when(activity.lastError.at)}): {activity.lastError.error}
            </p>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Send a test email</h2>
          <p className="mt-1 text-sm text-ink/60">In testing mode, use the email address of your Resend account.</p>
          <div className="mt-4">
            <TestEmailForm defaultTo={cfg.notify || s.user.email || ""} disabled={!cfg.enabled} />
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Event reminders</h2>
          <p className="mt-1 text-sm text-ink/60">
            Every day at 10:00 AM (IST) ticket holders of the next day&apos;s events get a reminder with their ticket links. Each event is reminded only once.
          </p>
          <div className="mt-4">
            <EmailActionButton action={sendRemindersNow} label="Send tomorrow's reminders now" disabled={!cfg.enabled} />
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="font-semibold">Tickets not emailed ({unsent.length})</h2>
            <p className="text-sm text-ink/60">Paid bookings whose ticket email was not delivered (email off, or failed).</p>
          </div>
          {unsent.length > 0 && <EmailActionButton action={resendUnsentTickets} label={`Send all ${unsent.length}`} disabled={!cfg.enabled} />}
        </div>
        {unsent.length > 0 && (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[#f0e6d4] border-t border-[#f0e6d4]">
              {unsent.map((b) => (
                <tr key={b.id}>
                  <td className="px-5 py-2.5">
                    <Link href={`/bookings/${b.id}`} className="font-medium hover:text-kumkum">
                      {b.attendeeName}
                    </Link>
                    <div className="text-xs text-ink/50">{b.attendeeEmail}</div>
                  </td>
                  <td className="px-5 py-2.5 text-ink/70">
                    {b.quantity} × {b.ticketType.name} · {b.event.title} · {fmtDate(b.event.startsAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="mt-6 text-sm text-ink/70">
        <h2 className="font-semibold text-ink">What gets emailed automatically</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Buyer: QR e-tickets right after booking/payment</li>
          <li>You: an alert for every new booking and every enquiry</li>
          <li>Enquirer: a “we received your enquiry” reply (if they gave an email)</li>
          <li>Ticket holders: a reminder the day before the event</li>
        </ul>
      </Card>
    </>
  );
}
