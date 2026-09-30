import { socialStatus } from "@/lib/social";
import { guard } from "../guard";
import { Badge, Card, PageTitle } from "../ui";
import SocialForm from "./SocialForm";

export const dynamic = "force-dynamic";

export default async function AdminSocial() {
  await guard();
  const s = await socialStatus();
  return (
    <>
      <PageTitle title="Social feeds" />
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Instagram</h2>
            <Badge tone={s.instagram ? "green" : "amber"}>{s.instagram ? "Connected" : "Not connected"}</Badge>
          </div>
          <p className="mt-2 text-sm text-ink/60">
            Latest posts & reels show on the Home and Videos pages in the site&apos;s own design and refresh every 15 minutes. The access token is renewed automatically every week.
            {s.igRefreshedAt && <> Last renewed: {s.igRefreshedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}.</>}
          </p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Facebook Page</h2>
            <Badge tone={s.facebook ? "green" : "amber"}>{s.facebook ? "Connected" : "Not connected"}</Badge>
          </div>
          <p className="mt-2 text-sm text-ink/60">Latest page posts appear under the Instagram grid. A Page token created from a long-lived user token does not expire.</p>
        </Card>
      </div>
      <Card>
        <SocialForm />
        <p className="mt-4 text-xs text-ink/50">Leave a field empty to keep the current value. The step-by-step guide to create these tokens is in the project README.</p>
      </Card>
    </>
  );
}
