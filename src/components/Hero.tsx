import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-carbon bg-midnight px-6 pt-16 pb-12 md:px-12 md:pt-24 md:pb-20">
      <div className="noise-bg absolute inset-0 pointer-events-none" />
      
      {/* Ambient Glow */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-rush-orange/10 blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10"
      >
        <div className="mb-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-rush-orange font-display text-2xl font-extrabold text-midnight tracking-tighter">
            R<ArrowUpRight className="h-5 w-5 -ml-1" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tighter text-cream md:text-5xl">
              Rush<span className="text-rush-orange">NG</span>
            </h1>
            <p className="text-[11px] font-bold tracking-[0.2em] text-white/40 uppercase">
              Deliver fast. Earn more.
            </p>
          </div>
        </div>

        <h2 className="max-w-2xl font-display text-5xl font-extrabold leading-[0.95] tracking-tighter text-cream md:text-7xl lg:text-8xl">
          Lagos delivery, <br />
          <span className="text-rush-orange italic">finally</span> built <br />
          for hustlers.
        </h2>

        <p className="mt-8 max-w-lg text-lg leading-relaxed text-white/60 md:text-xl">
          RushNG connects SMEs and social sellers to verified okada and keke riders for same-day delivery across Lagos — no middlemen, no wahala.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <button className="rounded-xl bg-rush-orange px-8 py-4 font-display text-sm font-bold tracking-wider text-midnight transition-transform hover:scale-105 active:scale-95">
            START SHIPPING →
          </button>
          <button className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 font-display text-sm font-bold tracking-wider text-cream backdrop-blur-sm transition-colors hover:bg-white/10">
            BECOME A RIDER
          </button>
        </div>
      </motion.div>
    </section>
  );
}
