import type { ReactNode } from "react";

export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-[#eadfca] bg-white p-5 shadow-[0_1px_0_#eadfca] ${className}`}>{children}</div>
);

export const PageTitle = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
    <h1 className="font-display text-4xl">{title}</h1>
    <div className="flex gap-2">{children}</div>
  </div>
);

export const btn = "inline-flex items-center justify-center rounded-full bg-saffron px-5 py-2.5 text-sm font-semibold text-night hover:bg-marigold disabled:opacity-50";
export const btnGhost = "inline-flex items-center justify-center rounded-full border border-[#dccfb6] px-4 py-2 text-sm hover:bg-[#f3ead8]";

export const Badge = ({ tone, children }: { tone: "green" | "amber" | "red" | "gray"; children: ReactNode }) => {
  const c = { green: "bg-green-100 text-green-800", amber: "bg-amber-100 text-amber-800", red: "bg-red-100 text-red-800", gray: "bg-stone-100 text-stone-700" }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${c}`}>{children}</span>;
};
