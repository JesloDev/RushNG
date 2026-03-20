import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, User as UserIcon, Bike, ShoppingBag } from 'lucide-react';
import Auth from './components/Auth';
import SellerDashboard from './components/SellerDashboard';
import RiderDashboard from './components/RiderDashboard';
import LandingPage from './components/LandingPage';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check current session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userData) {
            setUser(userData);
          } else {
            // Fallback if user profile doesn't exist in our table yet
            setUser({ 
              id: session.user.id, 
              name: session.user.phone || 'Hustler', 
              role: 'seller' 
            });
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (userData) {
          setUser(userData);
        } else {
          setUser({ 
            id: session.user.id, 
            name: session.user.phone || 'Hustler', 
            role: 'seller' 
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-rush-orange border-t-transparent" />
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight p-4 text-center">
        <div className="max-w-md rounded-2xl bg-white/5 p-8 backdrop-blur-xl border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">Supabase Setup Required</h2>
          <p className="text-white/60 mb-6">
            Please add your Supabase credentials to the AI Studio Secrets to continue.
          </p>
          <div className="space-y-4 text-left">
            <div className="rounded-lg bg-black/20 p-4">
              <p className="text-xs font-mono text-rush-orange mb-1">VITE_SUPABASE_URL</p>
              <p className="text-xs text-white/40">Your project URL from Supabase dashboard</p>
            </div>
            <div className="rounded-lg bg-black/20 p-4">
              <p className="text-xs font-mono text-rush-orange mb-1">VITE_SUPABASE_ANON_KEY</p>
              <p className="text-xs text-white/40">Your anon/public key from Supabase dashboard</p>
            </div>
          </div>
          <p className="mt-8 text-xs text-white/40 italic">
            App will reload automatically after adding secrets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight selection:bg-rush-orange selection:text-midnight">
      <AnimatePresence mode="wait">
        {!user ? (
          showLanding ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LandingPage onGetStarted={() => setShowLanding(false)} />
            </motion.div>
          ) : (
            <motion.div
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Auth onAuthSuccess={(userData) => setUser(userData)} />
            </motion.div>
          )
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-screen flex-col"
          >
            {/* Top Nav */}
            <div className="flex items-center justify-between border-b border-carbon bg-midnight/80 px-6 py-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rush-orange font-display text-sm font-extrabold text-midnight">
                  R
                </div>
                <span className="font-display text-xl font-bold text-cream">RushNG</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden items-center gap-2 rounded-full bg-carbon px-4 py-2 md:flex">
                  {user.role === 'seller' ? (
                    <ShoppingBag className="h-4 w-4 text-rush-orange" />
                  ) : (
                    <Bike className="h-4 w-4 text-rush-orange" />
                  )}
                  <span className="text-xs font-bold tracking-widest text-white/60 uppercase">{user.role}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="group relative">
                    <button className="flex h-10 w-10 items-center justify-center rounded-full border border-carbon bg-white/5 text-white/40 transition-colors hover:border-rush-orange hover:text-rush-orange">
                      <UserIcon className="h-5 w-5" />
                    </button>
                    <div className="invisible absolute right-0 top-full mt-2 w-48 rounded-xl border border-carbon bg-midnight p-2 shadow-2xl group-hover:visible">
                      <div className="px-4 py-2 text-xs font-bold text-white/20 uppercase tracking-widest">Account</div>
                      <div className="px-4 py-2">
                        <div className="text-sm font-medium text-cream">{user.name}</div>
                        {user.opayData && (
                          <div className="mt-1 text-[10px] font-bold text-rush-orange uppercase tracking-widest">
                            OPay: {user.opayData.opayAccountNumber}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="mt-2 flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        LOGOUT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
              {user.role === 'seller' ? (
                <SellerDashboard user={user} />
              ) : (
                <RiderDashboard user={user} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
