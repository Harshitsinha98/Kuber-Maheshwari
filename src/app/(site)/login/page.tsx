import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import GoogleButton from "@/components/site/GoogleButton";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const { callbackUrl, error } = await searchParams;
  const safeCb = callbackUrl?.startsWith("/") ? callbackUrl : "/my-tickets";
  if (await getSession()) redirect(safeCb);
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <Image src="/images/gallery/kuber-05.webp" alt="" fill className="object-cover opacity-25" sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/80 to-night/60" />
      <div className="relative w-full max-w-md border border-ivory/10 bg-night/70 p-10 text-center backdrop-blur-xl">
        <p className="font-hindi text-sm [word-spacing:0.5em] text-gold">॥ जय श्री राम ॥</p>
        <h1 className="mt-6 font-display text-5xl">
          Welcome <span className="italic text-gold">back</span>
        </h1>
        <p className="mt-4 text-sm text-muted">Sign in with Google to book tickets and see your QR e-tickets.</p>
        {error && <p className="mt-4 text-sm text-marigold">Sign-in failed. Please try again.</p>}
        <div className="mt-10">
          <GoogleButton callbackUrl={safeCb} />
        </div>
      </div>
    </section>
  );
}
