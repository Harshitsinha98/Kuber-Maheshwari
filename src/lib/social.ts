import { prisma, safe } from "./prisma";

/**
 * Social feeds are pulled from the official Meta APIs on the server and rendered
 * with our own components — no third-party widget, no watermark, no branding.
 * Results are cached (ISR) and re-fetched every 15 minutes, so new posts appear automatically.
 */

const REVALIDATE = 900;
const FB_VERSION = process.env.FB_GRAPH_VERSION || "v23.0";

export type SocialPost = {
  id: string;
  caption: string;
  image: string;
  isVideo: boolean;
  videoUrl?: string;
  permalink: string;
  timestamp: string;
};

export type SocialProfile = { username: string; name?: string; avatar?: string; followers?: number; posts?: number };

async function getSetting(key: string) {
  return safe(async () => (await prisma.setting.findUnique({ where: { key } }))?.value ?? null, null);
}

export const setSetting = (key: string, value: string) =>
  prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });

// ---------- Instagram (Instagram API with Instagram Login) ----------

async function igToken() {
  return (await getSetting("instagram_token")) || process.env.INSTAGRAM_ACCESS_TOKEN || null;
}

export async function getInstagram(limit = 12): Promise<{ profile: SocialProfile | null; posts: SocialPost[] }> {
  const token = await igToken();
  if (!token) return { profile: null, posts: [] };
  try {
    const [p, m] = await Promise.all([
      fetch(`https://graph.instagram.com/me?fields=username,name,profile_picture_url,followers_count,media_count&access_token=${token}`, {
        next: { revalidate: REVALIDATE, tags: ["instagram"] },
      }).then((r) => r.json()),
      fetch(
        `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=${limit}&access_token=${token}`,
        { next: { revalidate: REVALIDATE, tags: ["instagram"] } }
      ).then((r) => r.json()),
    ]);
    if (m.error) throw new Error(m.error.message);
    const posts: SocialPost[] = (m.data || []).map((x: Record<string, string>) => ({
      id: x.id,
      caption: x.caption || "",
      isVideo: x.media_type === "VIDEO",
      image: x.media_type === "VIDEO" ? x.thumbnail_url || x.media_url : x.media_url,
      videoUrl: x.media_type === "VIDEO" ? x.media_url : undefined,
      permalink: x.permalink,
      timestamp: x.timestamp,
    }));
    const profile = p.error
      ? null
      : { username: p.username, name: p.name, avatar: p.profile_picture_url, followers: p.followers_count, posts: p.media_count };
    return { profile, posts };
  } catch (e) {
    console.error("[instagram]", (e as Error).message);
    return { profile: null, posts: [] };
  }
}

/** Long-lived IG tokens last 60 days; refreshing resets that. Called by the weekly cron. */
export async function refreshInstagramToken() {
  const token = await igToken();
  if (!token) return { ok: false, reason: "no token configured" };
  const r = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`, {
    cache: "no-store",
  }).then((x) => x.json());
  if (!r.access_token) return { ok: false, reason: r.error?.message || "refresh failed" };
  await setSetting("instagram_token", r.access_token);
  return { ok: true, expiresInDays: Math.round((r.expires_in || 0) / 86400) };
}

// ---------- Facebook Page (Graph API) ----------

async function fbCreds() {
  const token = (await getSetting("facebook_page_token")) || process.env.FACEBOOK_PAGE_TOKEN || null;
  const pageId = (await getSetting("facebook_page_id")) || process.env.FACEBOOK_PAGE_ID || null;
  return token && pageId ? { token, pageId } : null;
}

export async function getFacebook(limit = 9): Promise<{ profile: SocialProfile | null; posts: SocialPost[] }> {
  const c = await fbCreds();
  if (!c) return { profile: null, posts: [] };
  const base = `https://graph.facebook.com/${FB_VERSION}/${c.pageId}`;
  try {
    const [p, f] = await Promise.all([
      fetch(`${base}?fields=name,username,followers_count,picture.type(large){url}&access_token=${c.token}`, {
        next: { revalidate: REVALIDATE, tags: ["facebook"] },
      }).then((r) => r.json()),
      fetch(
        `${base}/posts?fields=id,message,full_picture,permalink_url,created_time,attachments{media_type}&limit=${limit}&access_token=${c.token}`,
        { next: { revalidate: REVALIDATE, tags: ["facebook"] } }
      ).then((r) => r.json()),
    ]);
    if (f.error) throw new Error(f.error.message);
    const posts: SocialPost[] = (f.data || [])
      .filter((x: { full_picture?: string }) => x.full_picture)
      .map((x: { id: string; message?: string; full_picture: string; permalink_url: string; created_time: string; attachments?: { data?: { media_type?: string }[] } }) => ({
        id: x.id,
        caption: x.message || "",
        image: x.full_picture,
        isVideo: x.attachments?.data?.[0]?.media_type === "video",
        permalink: x.permalink_url,
        timestamp: x.created_time,
      }));
    const profile = p.error
      ? null
      : { username: p.username || p.name, name: p.name, avatar: p.picture?.data?.url, followers: p.followers_count };
    return { profile, posts };
  } catch (e) {
    console.error("[facebook]", (e as Error).message);
    return { profile: null, posts: [] };
  }
}

export async function socialStatus() {
  const [ig, fb] = await Promise.all([igToken(), fbCreds()]);
  const updated = await safe(() => prisma.setting.findUnique({ where: { key: "instagram_token" } }), null);
  return { instagram: Boolean(ig), facebook: Boolean(fb), igRefreshedAt: updated?.updatedAt ?? null };
}
