import type { ReactNode } from "react";

export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-3xl border border-[#ecdfc7] bg-white p-5 shadow-[0_12px_40px_-30px_rgba(110,26,38,0.45)] md:p-6 ${className}`}>{children}</div>
);

export const PageTitle = ({ title, hi, children }: { title: string; hi?: string; children?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      {hi && <p className="font-hindi text-sm text-kumkum">{hi}</p>}
      <h1 className="font-display text-4xl leading-tight">{title}</h1>
    </div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

export const btn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-saffron px-5 py-2.5 text-sm font-semibold text-night shadow-[0_8px_24px_-12px_rgba(232,130,12,0.9)] hover:bg-marigold disabled:opacity-50";
export const btnGhost = "inline-flex items-center justify-center gap-2 rounded-full border border-[#dccfb6] bg-white px-4 py-2 text-sm hover:bg-[#f3ead8]";

export const Badge = ({ tone, children }: { tone: "green" | "amber" | "red" | "gray" | "blue"; children: ReactNode }) => {
  const c = {
    green: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
    gray: "bg-stone-100 text-stone-700",
    blue: "bg-sky-100 text-sky-800",
  }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${c}`}>{children}</span>;
};
