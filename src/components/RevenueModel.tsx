import { motion } from "motion/react";

const streams = [
  { label: "10–15% per delivery commission", amount: "Core revenue" },
  { label: "SME subscription (premium features)", amount: "₦3,000–5,000/mo" },
  { label: "Rider registration & verification", amount: "₦2,000 one-time" },
  { label: "In-app ads (logistics, fintechs)", amount: "Secondary" },
];

export default function RevenueModel() {
  return (
    <section className="border-b border-carbon px-6 py-20 md:px-12">
      <div className="mb-12">
        <span className="text-[11px] font-bold tracking-[0.25em] text-rush-orange uppercase">
          Revenue Model
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-cream md:text-4xl">
          Sustainability
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {streams.map((s, idx) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center justify-between rounded-xl border border-carbon bg-white/5 p-6 transition-colors hover:bg-white/[0.08]"
          >
            <span className="text-sm font-medium text-white/60 md:text-base">
              {s.label}
            </span>
            <span className="font-display text-sm font-bold text-rush-orange md:text-base">
              {s.amount}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
