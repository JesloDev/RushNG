import { motion } from "motion/react";

const concepts = [
  {
    id: "01",
    icon: "🛍️",
    title: "The Problem",
    body: "Lagos SMEs — Instagram sellers, market vendors, home businesses — have no reliable, affordable delivery. Jumia doesn't serve them. Manual dispatch is chaos.",
  },
  {
    id: "02",
    icon: "🏍️",
    title: "The Solution",
    body: "A platform connecting SMEs to verified, rated okada and keke drivers for same-day delivery. Sellers post an order, nearest rider picks it up, buyer gets it fast.",
  },
  {
    id: "03",
    icon: "📱",
    title: "The Product",
    body: "Web + mobile app. Seller dashboard for digital orders. Rider app for pickups. Real-time tracking. Cash + transfer payment support.",
  },
  {
    id: "04",
    icon: "🌍",
    title: "The Market",
    body: "5M+ SMEs in Lagos. 500k+ active social sellers on Instagram & WhatsApp. 300k+ registered commercial riders looking for steady gigs.",
  },
];

export default function ConceptNote() {
  return (
    <section className="border-b border-carbon px-6 py-20 md:px-12">
      <div className="mb-12">
        <span className="text-[11px] font-bold tracking-[0.25em] text-rush-orange uppercase">
          Concept Note
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-cream md:text-4xl">
          What is RushNG?
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {concepts.map((concept, idx) => (
          <motion.div
            key={concept.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group relative overflow-hidden rounded-2xl border border-carbon bg-white/5 p-8 transition-colors hover:border-rush-orange/30 hover:bg-white/[0.07]"
          >
            <span className="absolute top-4 right-6 font-display text-5xl font-extrabold text-white/[0.03] transition-colors group-hover:text-rush-orange/5">
              {concept.id}
            </span>
            <div className="mb-4 text-3xl">{concept.icon}</div>
            <h3 className="mb-3 font-display text-lg font-bold tracking-tight text-cream">
              {concept.title}
            </h3>
            <p className="text-sm leading-relaxed text-white/40 group-hover:text-white/60 transition-colors">
              {concept.body}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
