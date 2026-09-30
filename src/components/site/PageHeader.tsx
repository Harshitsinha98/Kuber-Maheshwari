import { Reveal, SplitText } from "@/components/motion/Reveal";
import Tracked from "./Tracked";

export default function PageHeader({ kicker, title, italic, intro }: { kicker: string; title: string; italic?: string; intro?: string }) {
  return (
    <header className="relative mx-auto max-w-[1500px] px-5 pb-16 pt-40 md:px-10 md:pb-24 md:pt-52">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(50%_60%_at_20%_0%,rgba(232,130,12,0.14),transparent_70%)]" />
      <Reveal>
        <p className="text-xs uppercase tracking-[0.35em] text-gold">
          <Tracked text={kicker} />
        </p>
      </Reveal>
      <h1 className="mt-6 font-display text-[13vw] leading-[0.92] tracking-[-0.02em] text-ivory md:text-[8.5vw]">
        <SplitText text={title} immediate delay={0.1} />
        {italic && (
          <>
            <br />
            <SplitText text={italic} immediate delay={0.3} className="italic text-gold" />
          </>
        )}
      </h1>
      {intro && (
        <Reveal delay={0.4}>
          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-ivory/70">{intro}</p>
        </Reveal>
      )}
    </header>
  );
}
