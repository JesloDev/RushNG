import { motion } from "motion/react";

const steps = [
  {
    num: 1,
    title: "Seller posts an order",
    desc: "SME creates a delivery request — item, pickup address, customer address, preferred time.",
  },
  {
    num: 2,
    title: "Nearest rider accepts",
    desc: "Registered riders in the area get a ping. First to accept gets the job. Rating system keeps quality high.",
  },
  {
    num: 3,
    title: "Real-time tracking",
    desc: "Seller and buyer both track the delivery on a live map. Automated WhatsApp updates at pickup and drop-off.",
  },
  {
    num: 4,
    title: "Payment & payout",
    desc: "Buyer pays on delivery (cash or transfer). Rider gets paid same day. RushNG takes a 10–15% platform fee per delivery.",
  },
];

export default function HowItWorks() {
  return (
    <section className="border-b border-carbon px-6 py-20 md:px-12">
      <div className="mb-16">
        <span className="text-[11px] font-bold tracking-[0.25em] text-rush-orange uppercase">
          How It Works
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-cream md:text-4xl">
          The Hustle Flow
        </h2>
      </div>

      <div className="relative mx-auto max-w-3xl">
        {/* Vertical Line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-carbon md:left-[23px]" />

        <div className="flex flex-col gap-12">
          {steps.map((step, idx) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="relative flex gap-8 md:gap-12"
            >
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-carbon bg-midnight font-display text-lg font-bold text-rush-orange md:h-12 md:w-12">
                {step.num}
              </div>
              <div className="pt-1 md:pt-2">
                <h3 className="mb-2 font-display text-xl font-bold text-cream">
                  {step.title}
                </h3>
                <p className="text-base leading-relaxed text-white/40 md:text-lg">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
