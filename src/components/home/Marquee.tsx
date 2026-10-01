const items = ["Sundarkand", "भजन संध्या", "Bhajan Clubbing", "भक्ति फ्यूज़न", "Mata Jagran", "श्याम कीर्तन", "Weddings", "Studio"];

export default function Marquee({ reverse = false, tone = "saffron" }: { reverse?: boolean; tone?: "saffron" | "dark" }) {
  const row = [...items, ...items];
  return (
    <div
      data-scroller
      className={`relative overflow-hidden py-5 ${tone === "saffron" ? "bg-saffron text-night" : "border-y border-ivory/10 text-ivory"} ${
        reverse ? "-rotate-1" : "rotate-1"
      }`}
    >
      <div className="marquee flex w-max items-center gap-10" style={{ animationDirection: reverse ? "reverse" : "normal", ["--dur" as string]: "45s" }}>
        {[0, 1].map((k) => (
          <div key={k} className="flex items-center gap-10" aria-hidden={k === 1}>
            {row.map((t, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap">
                <span className={`${/[a-z]/i.test(t) ? "font-display italic" : "font-hindi"} text-3xl md:text-5xl`}>{t}</span>
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0Z" /></svg>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
