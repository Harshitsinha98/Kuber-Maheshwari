"use client";

/** Mobile-only bottom bar on event pages: price + jump to the ticket panel. */
export default function MobileBookBar({ price, label, disabled }: { price: string | null; label: string; disabled?: boolean }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-gold/25 bg-night/92 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5 backdrop-blur-xl print:hidden lg:hidden">
      <div className="leading-tight">
        {price && <div className="font-display text-2xl text-ivory">{price}</div>}
        <div className="font-hindi text-xs text-gold-soft">{disabled ? label : "प्रति टिकट से शुरू"}</div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          const el = document.getElementById("tickets");
          const lenis = (window as unknown as { lenis?: { scrollTo(t: Element, o?: object): void } }).lenis;
          if (!el) return;
          if (lenis) lenis.scrollTo(el, { offset: -90 });
          else el.scrollIntoView({ behavior: "smooth" });
        }}
        className="shine h-12 flex-1 max-w-[220px] rounded-full bg-saffron font-hindi text-lg font-semibold text-night disabled:bg-ivory/15 disabled:text-ivory/50"
      >
        {disabled ? "बुकिंग बंद" : "टिकट बुक करें"}
      </button>
    </div>
  );
}
