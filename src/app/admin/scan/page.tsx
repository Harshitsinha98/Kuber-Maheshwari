import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/format";
import { guard } from "../guard";
import Scanner from "./Scanner";

export const dynamic = "force-dynamic";

export default async function ScanPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  await guard(["ADMIN", "STAFF"]);
  const { event } = await searchParams;
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED", startsAt: { gte: new Date(Date.now() - 2 * 86400e3) } },
    orderBy: { startsAt: "asc" },
    select: { id: true, title: true, startsAt: true, city: true },
  });
  return <Scanner events={events.map((e) => ({ id: e.id, label: `${e.title} · ${e.city} · ${fmtDate(e.startsAt)}` }))} initialEvent={event || events[0]?.id || ""} />;
}
