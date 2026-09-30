import { prisma } from "@/lib/prisma";
import { waLink } from "@/lib/site";
import { guard } from "../guard";
import { Badge, Card, PageTitle } from "../ui";
import { toggleEnquiry } from "../actions";

export const dynamic = "force-dynamic";

export default async function Enquiries() {
  await guard();
  const list = await prisma.enquiry.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 300 });
  return (
    <>
      <PageTitle title="Enquiries" />
      <div className="space-y-3">
        {list.map((e) => (
          <Card key={e.id} className={e.handled ? "opacity-60" : ""}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{e.name}</span>
                  <Badge tone={e.handled ? "gray" : "amber"}>{e.handled ? "Handled" : "New"}</Badge>
                  <Badge tone="gray">{e.eventType}</Badge>
                </div>
                <div className="mt-1 text-sm text-ink/60">
                  {[e.eventDate, e.city, e.email].filter(Boolean).join(" · ")} · received {e.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                </div>
                {e.message && <p className="mt-2 whitespace-pre-line text-sm">{e.message}</p>}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <a href={`tel:+91${e.phone}`} className="rounded-full border border-[#dccfb6] px-4 py-1.5">
                  Call {e.phone}
                </a>
                <a href={waLink(`नमस्ते ${e.name} जी, कुबेर माहेश्वरी टीम से। आपकी ${e.eventType} enquiry के बारे में…`).replace(/wa\.me\/\d+/, `wa.me/91${e.phone}`)} target="_blank" rel="noopener" className="rounded-full bg-green-600 px-4 py-1.5 text-white">
                  WhatsApp
                </a>
                <form action={toggleEnquiry.bind(null, e.id, !e.handled)}>
                  <button className="rounded-full border border-[#dccfb6] px-4 py-1.5">{e.handled ? "Reopen" : "Mark handled"}</button>
                </form>
              </div>
            </div>
          </Card>
        ))}
        {list.length === 0 && <Card className="text-center text-ink/50">No enquiries yet.</Card>}
      </div>
    </>
  );
}
