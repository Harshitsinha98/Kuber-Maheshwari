import { verifyPassSig } from "@/lib/tickets";
import { applePass, appleWalletEnabled } from "@/lib/wallet";

type Ctx = { params: Promise<{ id: string }> };

/** Downloads a signed .pkpass — opening it on an iPhone shows "Add to Apple Wallet". */
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!verifyPassSig(id, new URL(req.url).searchParams.get("s"))) return new Response("Not found", { status: 404 });
  if (!appleWalletEnabled()) return new Response("Apple Wallet is not set up yet", { status: 503 });
  try {
    const buf = await applePass(id);
    if (!buf) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="kuber-maheshwari-${id.slice(-8)}.pkpass"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[apple-wallet]", e);
    return new Response("Could not create the Apple Wallet pass. Check APPLE_* certificate settings.", { status: 500 });
  }
}
