"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

// Well-known lines from Shri Sundarkand (Shri Ramcharitmanas) with their meaning:
// a small taste of the "भावार्थ सहित" presentation.
const verses = [
  {
    kind: "चौपाई",
    lines: ["जामवंत के बचन सुहाए।", "सुनि हनुमंत हृदय अति भाए॥"],
    meaning: "जाम्बवान जी के सुंदर वचन सुनकर हनुमान जी के हृदय को वे बहुत ही भाए।",
  },
  {
    kind: "दोहा",
    lines: ["हनूमान तेहि परसा कर पुनि कीन्ह प्रनाम।", "राम काजु कीन्हें बिनु मोहि कहाँ बिश्राम॥"],
    meaning: "हनुमान जी ने मैनाक पर्वत को हाथ से छूकर प्रणाम किया और कहा: श्री राम का कार्य किए बिना मुझे विश्राम कहाँ?",
  },
  {
    kind: "चौपाई",
    lines: ["प्रबिसि नगर कीजे सब काजा।", "हृदयँ राखि कोसलपुर राजा॥"],
    meaning: "अयोध्यापुरी के राजा श्री रघुनाथ जी को हृदय में रखकर नगर में प्रवेश कीजिए और सब काम कीजिए।",
  },
  {
    kind: "दोहा",
    lines: ["सकल सुमंगल दायक रघुनायक गुन गान।", "सादर सुनहिं ते तरहिं भव सिंधु बिना जलजान॥"],
    meaning: "श्री रघुनाथ जी का गुणगान सभी सुंदर मंगल देने वाला है। जो इसे आदर सहित सुनते हैं, वे बिना किसी जहाज़ के भवसागर पार कर जाते हैं।",
  },
];

export default function ChaupaiCard() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setI((x) => (x + 1) % verses.length), 8000);
    return () => clearTimeout(t);
  }, [i, paused]);

  const v = verses[i];
  return (
    <div
      className="relative overflow-hidden rounded-[28px] border border-gold/30 bg-gradient-to-br from-[#3d0d16] via-[#2a0810] to-[#1a0709] p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] md:p-9"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute -right-6 -top-10 font-hindi text-[9rem] leading-none text-gold/[0.07]" aria-hidden>
        श्रीराम
      </div>
      <div className="relative flex items-center justify-between">
        <span className="rounded-full bg-gold/15 px-3 py-1 font-hindi text-sm text-gold">{v.kind}</span>
        <span className="font-hindi text-sm text-ivory/50">
          {i + 1} / {verses.length}
        </span>
      </div>

      <div className="relative mt-6 min-h-[260px] sm:min-h-[230px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-hindi text-2xl leading-[1.75] text-ivory md:text-[1.75rem]">
              {v.lines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </p>
            <div className="mt-6 border-t border-gold/20 pt-5">
              <p className="font-hindi text-sm text-saffron">भावार्थ</p>
              <p className="mt-2 font-hindi text-lg leading-[1.8] text-ivory/80">{v.meaning}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative mt-4 flex items-center gap-2" role="tablist" aria-label="Verses">
        {verses.map((_, k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={k === i}
            aria-label={`Verse ${k + 1}`}
            onClick={() => setI(k)}
            className={`h-1.5 rounded-full transition-all duration-500 ${k === i ? "w-10 bg-saffron" : "w-4 bg-ivory/25 hover:bg-ivory/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
