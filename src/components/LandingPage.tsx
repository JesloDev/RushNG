import { motion } from 'motion/react';
import { ArrowUpRight, Bike, ShoppingBag, ShieldCheck, MapPin, Volume2, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-midnight text-cream selection:bg-rush-orange selection:text-midnight">
      {/* Hero Section */}
      <header className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        {/* Background Accents */}
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-rush-orange/10 blur-[120px]" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-lagos-gold/5 blur-[120px]" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="z-10"
        >
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rush-orange font-display text-3xl font-black text-midnight shadow-[0_0_40px_rgba(255,92,26,0.3)] tracking-tighter">
              R<ArrowUpRight className="h-6 w-6 -ml-1" />
            </div>
            <span className="font-display text-4xl font-black tracking-tight text-cream">RushNG</span>
          </div>
          
          <h1 className="max-w-4xl font-display text-5xl font-black leading-[1.1] tracking-tight md:text-8xl">
            DELIVERY WEY <span className="text-rush-orange italic">NO DEY DULL.</span>
          </h1>
          
          <p className="mx-auto mt-8 max-w-2xl text-lg font-medium text-white/40 md:text-xl">
            The fastest way to send and receive load in Lagos. 
            Real-time distance fees, OPay verified riders, and Pidgin support for everyone.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={onGetStarted}
              className="group flex items-center gap-3 rounded-2xl bg-rush-orange px-8 py-5 font-display text-lg font-bold text-midnight transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,92,26,0.4)]"
            >
              GET STARTED
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <div className="flex items-center gap-2 rounded-2xl border border-carbon bg-white/5 px-6 py-5 text-sm font-bold tracking-widest text-white/60 uppercase">
              <ShieldCheck className="h-5 w-5 text-lagos-gold" />
              OPay Verified
            </div>
          </div>
        </motion.div>

        {/* Floating Elements */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-10 hidden rounded-2xl border border-carbon bg-midnight/80 p-4 backdrop-blur-md md:block"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-500/20 p-2 text-green-500">
              <Volume2 className="h-4 w-4" />
            </div>
            <p className="text-xs font-bold tracking-widest text-white/40 uppercase">Pidgin Support</p>
          </div>
          <p className="mt-2 text-sm font-medium italic">"Oya, make we start!"</p>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-10 top-40 hidden rounded-2xl border border-carbon bg-midnight/80 p-4 backdrop-blur-md md:block"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-rush-orange/20 p-2 text-rush-orange">
              <MapPin className="h-4 w-4" />
            </div>
            <p className="text-xs font-bold tracking-widest text-white/40 uppercase">Real-time Fees</p>
          </div>
          <p className="mt-2 text-sm font-medium italic">₦500 Base + ₦150/km</p>
        </motion.div>
      </header>

      {/* Features Grid */}
      <section className="border-t border-carbon bg-midnight/50 py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-20 text-center">
            <h2 className="font-display text-4xl font-black md:text-6xl">WHY RUSH?</h2>
            <p className="mt-4 text-white/40">No stories, just results.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard 
              icon={<ShieldCheck className="h-8 w-8" />}
              title="OPAY VERIFIED"
              description="Every rider and seller is verified with OPay. Security first, tracking always."
              color="text-lagos-gold"
            />
            <FeatureCard 
              icon={<MapPin className="h-8 w-8" />}
              title="DISTANCE FEES"
              description="No more guessing. We calculate your fee based on real-time distance. Fair for everyone."
              color="text-rush-orange"
            />
            <FeatureCard 
              icon={<Volume2 className="h-8 w-8" />}
              title="PIDGIN VOICE"
              description="Market woman or CEO, everyone understands Rush. Full Pidgin support with voice instructions."
              color="text-blue-400"
            />
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-2">
            <div className="group relative overflow-hidden rounded-[32px] border border-carbon bg-white/5 p-12 transition-all hover:border-rush-orange/50">
              <ShoppingBag className="mb-6 h-12 w-12 text-rush-orange" />
              <h3 className="font-display text-3xl font-bold">FOR SELLERS</h3>
              <p className="mt-4 text-white/40">Send your goods across Lagos with peace of mind. Real-time tracking and fair pricing.</p>
              <ul className="mt-8 space-y-3 text-sm font-medium">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-rush-orange" />
                  Instant Rider Matching
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-rush-orange" />
                  OPay Wallet Integration
                </li>
              </ul>
            </div>

            <div className="group relative overflow-hidden rounded-[32px] border border-carbon bg-white/5 p-12 transition-all hover:border-lagos-gold/50">
              <Bike className="mb-6 h-12 w-12 text-lagos-gold" />
              <h3 className="font-display text-3xl font-bold">FOR RIDERS</h3>
              <p className="mt-4 text-white/40">Earn more with optimized routes and instant payouts. Be your own boss.</p>
              <ul className="mt-8 space-y-3 text-sm font-medium">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-lagos-gold" />
                  Low Commission
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-lagos-gold" />
                  Flexible Hours
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-carbon p-12 text-center">
        <div className="flex items-center justify-center gap-3 opacity-50">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-rush-orange font-display text-[10px] font-black text-midnight">
            R
          </div>
          <span className="font-display text-sm font-bold tracking-widest uppercase">RushNG © 2026</span>
        </div>
        <p className="mt-4 text-[10px] font-bold tracking-widest text-white/10 uppercase">Built for the streets of Lagos.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: any, title: string, description: string, color: string }) {
  return (
    <div className="rounded-[32px] border border-carbon bg-white/5 p-8 transition-all hover:bg-white/10">
      <div className={`mb-6 ${color}`}>{icon}</div>
      <h3 className="font-display text-xl font-bold tracking-widest uppercase">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-white/40">{description}</p>
    </div>
  );
}
