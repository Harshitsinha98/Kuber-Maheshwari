import { getFacebook, getInstagram, type SocialPost, type SocialProfile } from "@/lib/social";
import { site } from "@/lib/site";
import { Reveal } from "@/components/motion/Reveal";
import { FacebookIcon, InstagramIcon, PlayIcon } from "@/components/site/Icons";
import Tracked from "@/components/site/Tracked";

/**
 * Live Instagram + Facebook feeds.
 * Data comes from the official Meta Graph APIs (server side, cached 15 min),
 * rendered in the site's own design: no third-party widget, logo or watermark.
 */
export default async function SocialFeed({ limit = 8 }: { limit?: number }) {
  const [ig, fb] = await Promise.all([getInstagram(limit), getFacebook(6)]);

  return (
    <section className="mx-auto max-w-[1500px] px-5 py-28 md:px-10 md:py-36">
      <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gold"><Tracked text="(07) Social · हर दिन नया" /></p>
          <h2 className="mt-4 font-display text-5xl leading-none md:text-7xl">
            Latest from <span className="italic text-gold">Instagram & Facebook</span>
          </h2>
        </div>
        <div className="flex gap-3">
          <FollowButton href={site.social.instagram} label="Instagram" profile={ig.profile} icon="ig" />
          <FollowButton href={site.social.facebook} label="Facebook" profile={fb.profile} icon="fb" />
        </div>
      </div>

      {ig.posts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {ig.posts.slice(0, limit).map((p, i) => (
            <PostTile key={p.id} post={p} i={i} source="ig" />
          ))}
        </div>
      ) : (
        <EmptyFeed kind="Instagram" href={site.social.instagram} />
      )}

      {fb.posts.length > 0 && (
        <>
          <h3 className="mb-6 mt-20 flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-muted">
            <FacebookIcon className="h-4 w-4" /> From the Facebook page
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {fb.posts.slice(0, 3).map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <a href={p.permalink} target="_blank" rel="noopener" data-cursor="Open" className="group block border border-ivory/10 bg-night-2 transition-colors hover:border-gold/40">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
                  </div>
                  <div className="p-6">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-muted">{new Date(p.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ivory/80">{p.caption || "View post"}</p>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function PostTile({ post, i }: { post: SocialPost; i: number; source: "ig" | "fb" }) {
  return (
    <Reveal delay={(i % 4) * 0.07}>
      <a href={post.permalink} target="_blank" rel="noopener" data-cursor="Open" className="group relative block aspect-square overflow-hidden bg-ink">
        {/* Media CDN URLs are signed & rotate, so they're rendered directly (refreshed every 15 min). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.image} alt={post.caption.slice(0, 80) || "Instagram post"} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-110" />
        {post.isVideo && (
          <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-night/60 text-ivory backdrop-blur">
            <PlayIcon className="h-3.5 w-3.5" />
          </span>
        )}
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-night/90 via-night/20 to-transparent p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <p className="line-clamp-3 text-xs leading-relaxed text-ivory/90">{post.caption}</p>
        </div>
      </a>
    </Reveal>
  );
}

function FollowButton({ href, label, profile, icon }: { href: string; label: string; profile: SocialProfile | null; icon: "ig" | "fb" }) {
  const Icon = icon === "ig" ? InstagramIcon : FacebookIcon;
  return (
    <a href={href} target="_blank" rel="noopener" className="group flex items-center gap-3 rounded-full border border-ivory/15 py-2 pl-2 pr-5 transition-colors hover:border-gold">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ivory/5 text-gold">
        <Icon className="h-5 w-5" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm text-ivory">{profile?.username ? `@${profile.username}` : label}</span>
        <span className="block text-[11px] text-muted">
          {profile?.followers ? `${Intl.NumberFormat("en-IN", { notation: "compact" }).format(profile.followers)} followers` : "Follow"}
        </span>
      </span>
    </a>
  );
}

function EmptyFeed({ kind, href }: { kind: string; href: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {["kuber-03", "kuber-10", "kuber-37", "kuber-21"].map((n) => (
        <a key={n} href={href} target="_blank" rel="noopener" className="group relative block aspect-square overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/images/gallery/${n}.webp`} alt="" className="h-full w-full object-cover opacity-70 transition group-hover:opacity-100" />
        </a>
      ))}
      <p className="col-span-full mt-2 text-xs text-muted">Follow on {kind} for daily updates.</p>
    </div>
  );
}
