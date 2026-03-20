import { motion } from "motion/react";

const principles = [
  {
    emoji: "🔤",
    title: "Big text, big buttons — always",
    desc: "Minimum 18px body text. Tap targets at least 48px tall. No tiny links. If it can't be tapped with a thumb easily, redesign it.",
    example: "Buttons should be thumb-sized",
  },
  {
    emoji: "🇳🇬",
    title: "Pidgin + English toggle",
    desc: "Let users switch the app language to Nigerian Pidgin. 'Send delivery' becomes 'Send am.' 'Track order' becomes 'Find your parcel.' Instant trust.",
    example: "'How much e go cost?' not 'Calculate fare'",
  },
  {
    emoji: "📞",
    title: "Phone number login — no email",
    desc: "Market women don't remember passwords. Use phone number + OTP via SMS or WhatsApp. Done. No barriers to entry.",
    example: "Login = enter number → get WhatsApp code",
  },
  {
    emoji: "🗺️",
    title: "No typing addresses — use map pin",
    desc: "Nobody in Lagos knows their street address exactly. Let them drop a pin on a map or use 'Use my current location.' Simple.",
    example: "Pin drop → 'Yes, this is my shop' → Done",
  },
  {
    emoji: "💬",
    title: "WhatsApp is the backbone",
    desc: "Every notification goes to WhatsApp — not email, not in-app only. 'Your rider don reach your shop.' 'Delivery complete.' That's what they trust.",
    example: "Rider update → instant WhatsApp message",
  },
  {
    emoji: "💰",
    title: "Cash AND transfer — no card required",
    desc: "Most market sellers collect cash or bank transfer. Support both. Don't force card payments — that's where you'll lose 70% of your users.",
    example: "Pay options: Cash on delivery / Bank transfer",
  },
];

export default function UXPrinciples() {
  return (
    <section className="border-b border-carbon px-6 py-20 md:px-12">
      <div className="mb-12">
        <span className="text-[11px] font-bold tracking-[0.25em] text-rush-orange uppercase">
          UX Principles
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-cream md:text-4xl">
          Rules for the Lagos Market
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {principles.map((p, idx) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="flex flex-col gap-4 rounded-2xl border border-carbon bg-white/5 p-8"
          >
            <div className="text-4xl">{p.emoji}</div>
            <div>
              <h3 className="mb-2 font-display text-lg font-bold text-cream">
                {p.title}
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-white/40">
                {p.desc}
              </p>
              <span className="inline-block rounded-full bg-carbon px-4 py-1 text-[11px] font-bold text-rush-orange">
                {p.example}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
