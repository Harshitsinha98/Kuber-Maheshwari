import { NextResponse } from "next/server";
import { verifyPassSig } from "@/lib/tickets";
import { googleWalletEnabled, googleWalletSaveUrl } from "@/lib/wallet";

type Ctx = { params: Promise<{ id: string }> };

/** Redirects to Google's "Save to Google Wallet" page for this booking's pass. */
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!verifyPassSig(id, new URL(req.url).searchParams.get("s"))) return new Response("Not found", { status: 404 });
  if (!googleWalletEnabled()) return new Response("Google Wallet is not set up yet", { status: 503 });
  try {
    const url = await googleWalletSaveUrl(id);
    if (!url) return new Response("Not found", { status: 404 });
    return NextResponse.redirect(url, 302);
  } catch (e) {
    console.error("[google-wallet]", e);
    return new Response("Could not create the Google Wallet pass. Check GOOGLE_WALLET_* settings.", { status: 500 });
  }
}
