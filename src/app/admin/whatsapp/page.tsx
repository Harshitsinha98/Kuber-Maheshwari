import { WHATSAPP_TEMPLATES, whatsappActivity, whatsappConfig } from "@/lib/whatsapp";
import { guard } from "../guard";
import { Badge, Card, PageTitle } from "../ui";
import { CopyBlock, WhatsappTestForm } from "./WhatsappForms";

export const dynamic = "force-dynamic";
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "");

export default async function AdminWhatsapp() {
  await guard();
  const c = whatsappConfig();
  const a = await whatsappActivity();
  const rows: [string, boolean, string][] = [
    ["Access token (WHATSAPP_TOKEN)", Boolean(c.token), c.token ? "Added" : "Missing"],
    ["Sender number ID (WHATSAPP_PHONE_NUMBER_ID)", Boolean(c.phoneId), c.phoneId || "Missing"],
    ["Alerts go to (WHATSAPP_NOTIFY_TO)", c.notify.length > 0, c.notify.length ? c.notify.map((n) => `+${n}`).join(", ") : "Missing"],
    ["Tickets to buyers (WHATSAPP_SEND_TICKETS)", c.customerTickets, c.customerTickets ? "On" : "Off (optional)"],
  ];
  return (
    <>
      <PageTitle title="WhatsApp alerts" />
      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Status</h2>
          {c.enabled && c.notify.length ? <Badge tone="green">On</Badge> : <Badge tone="amber">Not set up</Badge>}
        </div>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          {rows.map(([k, ok, v]) => (
            <div key={k} className="flex items-start gap-2">
              <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${ok ? "bg-green-500" : "bg-amber-400"}`} />
              <div>
                <dt className="text-ink/50">{k}</dt>
                <dd className="break-all font-medium">{v}</dd>
              </div>
            </div>
          ))}
        </dl>
        <div className="mt-4 grid gap-2 text-xs text-ink/60 md:grid-cols-2">
          <p>Last sent: {a.lastOk ? `${when(a.lastOk.at)} · ${a.lastOk.template} → +${a.lastOk.to}` : "never"}</p>
          {a.lastError && <p className="text-red-700">Last error ({when(a.lastError.at)}): {a.lastError.error}</p>}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="font-semibold">How it works</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink/75">
            <li>Every confirmed booking → a WhatsApp alert to you with event, name, mobile, tickets and amount.</li>
            <li>Every website enquiry → a WhatsApp alert with name, mobile, event type, date and city.</li>
            <li>Optional: the buyer gets their ticket link on WhatsApp too.</li>
            <li>Uses Meta&apos;s official WhatsApp Cloud API. Meta charges about ₹0.115 + GST per message in India (utility templates).</li>
          </ul>
          <h3 className="mt-6 font-semibold">One-time setup</h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-ink/75">
            <li>
              <b>developers.facebook.com</b> → your app → <b>Add product → WhatsApp</b> → <b>API Setup</b>. Meta gives a free <b>test number</b> to start; add your own number under
              &quot;To&quot; (allowed recipients).
            </li>
            <li>
              For your own sender number: <b>Add phone number</b>. Use a number that will <i>send</i> alerts, different from the number that <i>receives</i> them. An existing WhatsApp
              Business app number can be connected (coexistence).
            </li>
            <li>
              <b>WhatsApp Manager → Message templates → Create</b>: category <b>Utility</b>, language <b>Hindi</b>, and paste the texts on the right exactly. Wait for
              &quot;Approved&quot;.
            </li>
            <li>
              <b>Business settings → System users</b> → add one (Admin) → assign the app and WhatsApp account → <b>Generate token</b> with <code>whatsapp_business_messaging</code>,{" "}
              <code>whatsapp_business_management</code>, no expiry.
            </li>
            <li>
              In Vercel add <code>WHATSAPP_TOKEN</code>, <code>WHATSAPP_PHONE_NUMBER_ID</code> (from API Setup) and <code>WHATSAPP_NOTIFY_TO</code> (e.g. <code>9827751400,9425331165</code>), then <b>Redeploy</b>.
            </li>
            <li>Come back here and send a test.</li>
          </ol>
        </Card>

        <div className="space-y-6">
          {(Object.keys(WHATSAPP_TEMPLATES) as (keyof typeof WHATSAPP_TEMPLATES)[]).map((k) => {
            const t = WHATSAPP_TEMPLATES[k];
            return (
              <Card key={k}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    Template name: <code className="rounded bg-[#f3ead8] px-1.5 py-0.5">{c.templates[k]}</code>
                  </p>
                  <span className="text-xs text-ink/50">{t.purpose}</span>
                </div>
                <CopyBlock text={t.body} />
                <p className="mt-2 text-xs text-ink/50">Sample values for Meta&apos;s review: {t.sample.join(" | ")}</p>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="mt-6">
        <h2 className="font-semibold">Send a test</h2>
        <div className="mt-3">
          <WhatsappTestForm disabled={!c.enabled} />
        </div>
      </Card>
    </>
  );
}
