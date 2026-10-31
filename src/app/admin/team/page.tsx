/* eslint-disable @next/next/no-img-element */
import { envStaffEmails, ownerEmails } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma, safe } from "@/lib/prisma";
import { withTeamTable } from "@/lib/team-table";
import { guard } from "../guard";
import { Badge, Card, PageTitle } from "../ui";
import RemoveButton from "./RemoveButton";
import TeamForm from "./TeamForm";

export const dynamic = "force-dynamic";

const label = new Map<string, string>(PERMISSIONS.map((p) => [p.key, p.label]));

export default async function TeamPage() {
  const s = await guard("team");
  const myEmail = (s.user.email || "").toLowerCase();

  let tableMissing = false;
  const members = await withTeamTable(() => prisma.teamMember.findMany({ orderBy: [{ role: "asc" }, { createdAt: "asc" }] })).catch((e) => {
    console.error("[team]", (e as Error).message);
    tableMissing = true;
    return [];
  });
  const owners = ownerEmails();
  const legacyStaff = envStaffEmails().filter((e) => !owners.includes(e) && !members.some((m) => m.email === e));

  // Who has already signed in once (shows their Google photo/name).
  const all = [...owners, ...legacyStaff, ...members.map((m) => m.email)];
  const users = await safe(() => prisma.user.findMany({ where: { email: { in: all, mode: "insensitive" } }, select: { email: true, name: true, image: true } }), []);
  const byEmail = new Map(users.map((u) => [(u.email || "").toLowerCase(), u]));

  const Person = ({ email, name }: { email: string; name?: string | null }) => {
    const u = byEmail.get(email);
    const shown = name || u?.name || email.split("@")[0];
    return (
      <div className="flex min-w-0 items-center gap-3">
        {u?.image ? (
          <img src={u.image} alt="" className="h-10 w-10 shrink-0 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron/20 font-semibold text-maroon">{shown.charAt(0).toUpperCase()}</span>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium">
            {shown}
            {email === myEmail && <span className="ml-2 text-xs text-ink/50">(you)</span>}
          </p>
          <p className="truncate text-xs text-ink/55">{email}</p>
          {!u && <p className="text-[11px] text-amber-700">Has not signed in yet</p>}
        </div>
      </div>
    );
  };

  const coowners = members.filter((m) => m.role === "ADMIN");
  const employees = members.filter((m) => m.role !== "ADMIN");

  return (
    <>
      <PageTitle title="Team & Access" hi="टीम और अधिकार" />

      {tableMissing && (
        <Card className="mb-6 border-amber-300 bg-amber-50">
          <p className="font-semibold text-amber-900">Could not reach the team list</p>
          <p className="mt-1 text-sm text-amber-900/80">The database did not respond. Reload in a minute; if it keeps happening, run the &quot;Team &amp; access&quot; SQL from the README in Supabase.</p>
        </Card>
      )}

      <Card className="mb-6">
        <h2 className="font-display text-2xl">Add a person</h2>
        <p className="mt-1 text-sm text-ink/60">
          They sign in on the website with Google using this exact Gmail address. No password needed. Access starts on their first sign-in and any change applies right away.
        </p>
        <div className="mt-5">
          <TeamForm />
        </div>
      </Card>

      <section className="space-y-6">
        <Card>
          <h2 className="font-display text-2xl">Owners</h2>
          <p className="mt-1 text-xs text-ink/55">
            Set in <code>ADMIN_EMAILS</code> on Vercel. They always have full access and cannot be removed from here.
          </p>
          <ul className="mt-4 divide-y divide-[#f0e6d3]">
            {owners.map((e) => (
              <li key={e} className="flex items-center justify-between gap-3 py-3">
                <Person email={e} />
                <Badge tone="amber">Owner</Badge>
              </li>
            ))}
            {coowners.map((m) => (
              <li key={m.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Person email={m.email} name={m.name} />
                  <div className="flex items-center gap-4">
                    <Badge tone="amber">Co-owner · full access</Badge>
                    {m.email !== myEmail && <RemoveButton id={m.id} email={m.email} />}
                  </div>
                </div>
                {m.email !== myEmail && <EditBox member={m} />}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-display text-2xl">Employees</h2>
          <p className="mt-1 text-xs text-ink/55">They only see the sections ticked for them. Everything else is hidden and blocked.</p>
          {employees.length === 0 && legacyStaff.length === 0 ? (
            <p className="mt-4 text-sm text-ink/55">No employees yet. Add one above.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[#f0e6d3]">
              {employees.map((m) => (
                <li key={m.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Person email={m.email} name={m.name} />
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-ink/45">Added {fmtDate(m.createdAt)}</span>
                      {m.email !== myEmail && <RemoveButton id={m.id} email={m.email} />}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 pl-[52px]">
                    {m.permissions.map((p) => (
                      <Badge key={p} tone="blue">
                        {label.get(p) ?? p}
                      </Badge>
                    ))}
                  </div>
                  {m.email !== myEmail && <EditBox member={m} />}
                </li>
              ))}
              {legacyStaff.map((e) => (
                <li key={e} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <Person email={e} />
                  <span className="flex items-center gap-2 text-xs text-ink/55">
                    <Badge tone="blue">Scan Tickets</Badge> from <code>STAFF_EMAILS</code>. Add them above to change rights.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </>
  );
}

function EditBox({ member }: { member: { id: string; email: string; name: string | null; role: "ADMIN" | "STAFF" | "USER"; permissions: string[] } }) {
  return (
    <details className="group mt-2 pl-[52px]">
      <summary className="cursor-pointer list-none text-sm text-maroon underline-offset-4 hover:underline">
        <span className="group-open:hidden">Edit rights</span>
        <span className="hidden group-open:inline">Close</span>
      </summary>
      <div className="mt-3 rounded-2xl border border-[#ecdfc7] p-4">
        <TeamForm member={member} />
      </div>
    </details>
  );
}
