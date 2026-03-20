import { motion } from "motion/react";

export default function FlowMockup() {
  return (
    <section className="border-b border-carbon px-6 py-20 md:px-12 overflow-hidden">
      <div className="mb-12">
        <span className="text-[11px] font-bold tracking-[0.25em] text-rush-orange uppercase">
          Seller Order Flow
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-cream md:text-4xl">
          3 Screens to Success
        </h2>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide">
        {/* Screen 1 */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="min-w-[280px] shrink-0 rounded-3xl border border-carbon bg-midnight p-6 shadow-2xl"
        >
          <div className="mb-8 text-[10px] font-bold tracking-widest text-white/20 uppercase">
            Screen 1 — Pickup
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-carbon bg-white/5 p-4 text-sm text-white/40">
              📍 Use my location
            </div>
            <div className="rounded-xl border border-carbon bg-white/5 p-4 text-sm text-white/40">
              🗺️ Drop pin on map
            </div>
            <button className="w-full rounded-xl bg-rush-orange py-4 font-display text-sm font-bold text-midnight">
              Next →
            </button>
          </div>
        </motion.div>

        <div className="flex items-center text-carbon text-4xl">›</div>

        {/* Screen 2 */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="min-w-[280px] shrink-0 rounded-3xl border border-carbon bg-midnight p-6 shadow-2xl"
        >
          <div className="mb-8 text-[10px] font-bold tracking-widest text-white/20 uppercase">
            Screen 2 — Drop-off
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-carbon bg-white/5 p-4 text-sm text-white/40">
              📞 Customer number
            </div>
            <div className="rounded-xl border border-carbon bg-white/5 p-4 text-sm text-white/40">
              🗺️ Their location
            </div>
            <button className="w-full rounded-xl bg-rush-orange py-4 font-display text-sm font-bold text-midnight">
              Next →
            </button>
          </div>
        </motion.div>

        <div className="flex items-center text-carbon text-4xl">›</div>

        {/* Screen 3 */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="min-w-[280px] shrink-0 rounded-3xl border border-carbon bg-midnight p-6 shadow-2xl"
        >
          <div className="mb-8 text-[10px] font-bold tracking-widest text-white/20 uppercase">
            Screen 3 — Confirm
          </div>
          <div className="flex flex-col items-center py-4">
            <span className="font-display text-5xl font-extrabold text-rush-orange">₦800</span>
            <span className="mt-2 text-xs text-white/20">Estimated fare</span>
          </div>
          <div className="mt-6 space-y-3">
            <button className="w-full rounded-xl bg-rush-orange py-4 font-display text-sm font-bold text-midnight">
              Send am! 🏍️
            </button>
            <button className="w-full rounded-xl bg-white/5 py-4 font-display text-sm font-bold text-white/40">
              Edit
            </button>
          </div>
        </motion.div>

        <div className="flex items-center text-carbon text-4xl">›</div>

        {/* Success */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="min-w-[280px] shrink-0 rounded-3xl border border-rush-orange/20 bg-rush-orange/[0.02] p-6 shadow-2xl"
        >
          <div className="mb-8 text-[10px] font-bold tracking-widest text-rush-orange/40 uppercase">
            Done!
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 text-6xl">✅</div>
            <p className="font-display text-lg font-bold text-cream">
              Rider don dey come.
            </p>
            <p className="mt-2 text-sm text-white/40">
              WhatsApp update go reach you.
            </p>
          </div>
        </motion.div>
      </div>

      <p className="mt-8 text-center text-sm text-white/20">
        The whole flow should take <span className="text-rush-orange font-bold">under 60 seconds</span>.
      </p>
    </section>
  );
}
