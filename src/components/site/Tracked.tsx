/**
 * Letter-spacing breaks Devanagari (matras and conjuncts come apart), so inside wide-tracked
 * labels, Hindi runs are rendered with normal tracking in the Hindi typeface.
 */
export default function Tracked({ text }: { text: string }) {
  const parts = text.split(/([\u0900-\u097F][\u0900-\u097F\s]*[\u0900-\u097F]|[\u0900-\u097F])/);
  return (
    <>
      {parts.map((p, i) =>
        /[\u0900-\u097F]/.test(p) ? (
          <span key={i} className="font-hindi text-[1.25em] normal-case tracking-normal">
            {p}
          </span>
        ) : (
          p
        )
      )}
    </>
  );
}
