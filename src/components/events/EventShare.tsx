"use client";

import { WhatsappIcon } from "@/components/site/Icons";

/** Share an event: native share sheet on phones, WhatsApp elsewhere. */
export default function EventShare({ title, line, url, className = "" }: { title: string; line: string; url: string; className?: string }) {
  const text = `🙏 ${title}\n${line}\n\nटिकट बुक करें: ${url}`;
  return (
    <button
      type="button"
      onClick={async () => {
        if (navigator.share) {
          try {
            await navigator.share({ title, text, url });
            return;
          } catch {}
        }
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
      }}
      className={`inline-flex items-center gap-2 rounded-full border border-ivory/20 px-5 py-3 font-hindi text-base hover:border-gold hover:text-gold ${className}`}
    >
      <WhatsappIcon className="h-4 w-4" /> दोस्तों को भेजें
    </button>
  );
}
