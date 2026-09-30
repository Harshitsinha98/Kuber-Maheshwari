import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-night px-6 text-center">
      <p className="font-hindi text-sm [word-spacing:0.5em] text-gold">॥ हरि ॐ ॥</p>
      <h1 className="mt-6 font-display text-8xl text-ivory">404</h1>
      <p className="mt-4 font-display text-2xl italic text-muted">This page has wandered off, like Hanuman ji in search of Sita maa.</p>
      <Link href="/" className="mt-10 inline-flex h-12 items-center rounded-full bg-saffron px-7 text-xs font-semibold uppercase tracking-[0.2em] text-night">
        Back home
      </Link>
    </main>
  );
}
