"use client";

import { useState } from "react";
import { PlayIcon } from "@/components/site/Icons";

/** Shows our own poster + play button; YouTube (privacy-enhanced) iframe loads only on click. */
export default function YouTubeLite({ id, title }: { id: string; title: string }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden bg-ink">
      {play ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} data-cursor="Play" className="group absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt={title} className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" loading="lazy" />
          <span className="absolute inset-0 bg-night/30" />
          <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ivory text-night transition-transform duration-500 group-hover:scale-110">
            <PlayIcon className="ml-1 h-7 w-7" />
          </span>
        </button>
      )}
    </div>
  );
}
