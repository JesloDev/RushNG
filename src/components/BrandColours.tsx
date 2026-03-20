import { motion } from "motion/react";

const swatches = [
  { name: "Rush Orange", hex: "#FF5C1A", bg: "bg-[#FF5C1A]" },
  { name: "Midnight", hex: "#0A0A0A", bg: "bg-[#0A0A0A]" },
  { name: "Cream", hex: "#F5F0E8", bg: "bg-[#F5F0E8]" },
  { name: "Carbon", hex: "#1E1E1E", bg: "bg-[#1E1E1E]" },
  { name: "Lagos Gold", hex: "#FFB347", bg: "bg-[#FFB347]" },
];

export default function BrandColours() {
  return (
    <section className="border-b border-carbon px-6 py-20 md:px-12">
      <div className="mb-12">
        <span className="text-[11px] font-bold tracking-[0.25em] text-rush-orange uppercase">
          Brand Identity
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-cream md:text-4xl">
          The Lagos Palette
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {swatches.map((s, idx) => (
          <motion.div
            key={s.hex}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
            className="overflow-hidden rounded-2xl border border-carbon bg-white/5"
          >
            <div className={`h-24 w-full ${s.bg}`} />
            <div className="p-4">
              <div className="font-display text-sm font-bold text-cream">{s.name}</div>
              <div className="mt-1 font-mono text-[10px] text-white/20">{s.hex}</div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <p className="mt-8 text-sm leading-relaxed text-white/30">
        Dark-first brand — bold, energetic, built for Lagos. Orange signals speed and hustle. Cream adds warmth so it doesn't feel cold.
      </p>
    </section>
  );
}
