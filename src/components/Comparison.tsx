import { motion } from "motion/react";
import { Check, X } from "lucide-react";

export default function Comparison() {
  return (
    <section className="border-b border-carbon px-6 py-20 md:px-12">
      <div className="mb-12">
        <span className="text-[11px] font-bold tracking-[0.25em] text-rush-orange uppercase">
          App vs Website
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-cream md:text-4xl">
          The Verdict
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-carbon bg-white/5 p-8"
        >
          <div className="mb-8 flex items-center gap-3">
            <span className="text-2xl">📲</span>
            <h3 className="font-display text-xl font-bold text-cream">Native App</h3>
          </div>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-sm text-white/40">
              <X className="h-5 w-5 shrink-0 text-white/20" />
              <span>Must download from store</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-white/40">
              <X className="h-5 w-5 shrink-0 text-white/20" />
              <span>Takes phone storage</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-white/40">
              <X className="h-5 w-5 shrink-0 text-white/20" />
              <span>Harder to update</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-white/40">
              <X className="h-5 w-5 shrink-0 text-white/20" />
              <span>Expensive to build both iOS + Android</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-white/60">
              <Check className="h-5 w-5 shrink-0 text-rush-orange" />
              <span>Feels premium</span>
            </li>
          </ul>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl border border-rush-orange/30 bg-rush-orange/[0.03] p-8 shadow-[0_0_40px_rgba(255,92,26,0.05)]"
        >
          <div className="absolute top-4 right-6 rounded-full bg-rush-orange px-3 py-1 text-[10px] font-black tracking-widest text-midnight uppercase">
            Pick This
          </div>
          <div className="mb-8 flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <h3 className="font-display text-xl font-bold text-rush-orange">PWA</h3>
          </div>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-sm text-white/80">
              <Check className="h-5 w-5 shrink-0 text-rush-orange" />
              <span>Opens in browser — zero install</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-white/80">
              <Check className="h-5 w-5 shrink-0 text-rush-orange" />
              <span>Saves to home screen like an app</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-white/80">
              <Check className="h-5 w-5 shrink-0 text-rush-orange" />
              <span>Works on any Android or iPhone</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-white/80">
              <Check className="h-5 w-5 shrink-0 text-rush-orange" />
              <span>Works on low data / offline</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-white/80">
              <Check className="h-5 w-5 shrink-0 text-rush-orange" />
              <span>Push notifications supported</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-white/80">
              <Check className="h-5 w-5 shrink-0 text-rush-orange" />
              <span>WhatsApp share link = instant access</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
