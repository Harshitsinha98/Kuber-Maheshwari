// Admin sections an owner can give to an employee. Safe to import in client components.

export const PERMISSIONS = [
  { key: "dashboard", label: "Dashboard", hi: "डैशबोर्ड", note: "Sales numbers, recent activity", href: "/admin" },
  { key: "events", label: "Events & Tickets", hi: "कार्यक्रम", note: "Create, edit and delete events, see attendees", href: "/admin/events" },
  { key: "bookings", label: "Bookings", hi: "बुकिंग", note: "See all bookings and buyer details, export CSV", href: "/admin/bookings" },
  { key: "scan", label: "Scan Tickets", hi: "टिकट स्कैन", note: "Check people in at the gate", href: "/admin/scan" },
  { key: "enquiries", label: "Enquiries", hi: "पूछताछ", note: "See and mark event enquiries", href: "/admin/enquiries" },
  { key: "gallery", label: "Gallery", hi: "गैलरी", note: "Upload and delete photos", href: "/admin/gallery" },
  { key: "videos", label: "Videos", hi: "वीडियो", note: "Add and remove YouTube videos", href: "/admin/videos" },
  { key: "testimonials", label: "Testimonials", hi: "अनुभव", note: "Add and remove testimonials", href: "/admin/testimonials" },
  { key: "social", label: "Social Feeds", hi: "सोशल", note: "Instagram / Facebook feed settings", href: "/admin/social" },
  { key: "whatsapp", label: "WhatsApp", hi: "व्हाट्सऐप", note: "WhatsApp alert settings and tests", href: "/admin/whatsapp" },
  { key: "email", label: "Email", hi: "ईमेल", note: "Email settings, resend tickets, reminders", href: "/admin/email" },
] as const;

export type Perm = (typeof PERMISSIONS)[number]["key"];
export const ALL_PERMS: Perm[] = PERMISSIONS.map((p) => p.key);
export const isPerm = (v: string): v is Perm => (ALL_PERMS as string[]).includes(v);

/** owner = ADMIN_EMAILS (env), coowner = added from Admin → Team with full rights. */
export type AccessKind = "owner" | "coowner" | "employee" | "none";
export type Access = { kind: AccessKind; perms: Perm[] };

export const isOwnerKind = (k: AccessKind) => k === "owner" || k === "coowner";
export const can = (a: Access, p: Perm | Perm[]) => (Array.isArray(p) ? p : [p]).some((x) => a.perms.includes(x));

/** First admin page this person may open (where to land after sign-in or a blocked page). */
export function homeFor(a: Access): string | null {
  if (a.kind === "none") return null;
  return PERMISSIONS.find((p) => a.perms.includes(p.key))?.href ?? (isOwnerKind(a.kind) ? "/admin/team" : null);
}
