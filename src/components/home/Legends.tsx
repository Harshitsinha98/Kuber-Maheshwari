import { Reveal } from "@/components/motion/Reveal";

const names = ["Lakhbir Singh Lakkha", "Baba Rasika Pagal", "Uma Lahari", "Reshmi Sharma"];

export default function Legends() {
  return (
    <section className="mx-auto max-w-[1500px] px-5 py-28 md:px-10 md:py-36">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.35em] text-gold">(04) 2014 – 2018 · Synthesizer, on tour with</p>
      </Reveal>
      <ul className="mt-10">
        {names.map((n, i) => (
          <li key={n} className="group border-b border-ivory/10 first:border-t">
            <Reveal delay={i * 0.06}>
              <div className="flex items-baseline justify-between py-6 md:py-8">
                <span className="font-display text-4xl text-ivory/35 transition-all duration-700 group-hover:translate-x-4 group-hover:italic group-hover:text-ivory md:text-7xl">
                  {n}
                </span>
                <span className="text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
      <Reveal>
        <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted">
          …and many more singers across India. Years of watching and learning from the best, on stage after stage, shaped the singer he is today.
        </p>
      </Reveal>
    </section>
  );
}
