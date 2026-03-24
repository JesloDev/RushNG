import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, User as UserIcon, Bike, ShoppingBag, Globe, HelpCircle, X, Phone, Bell, Settings, Check, Shield } from 'lucide-react';
import Auth from './components/Auth';
import AdminAuth from './components/AdminAuth';
import SellerDashboard from './components/SellerDashboard';
import RiderDashboard from './components/RiderDashboard';
import BuyerDashboard from './components/BuyerDashboard';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Safety timeout to ensure loading spinner doesn't stay forever
    console.log('App: Starting safety timeout...');
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('App: Safety timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 8000); // Increased to 8s for slower networks

    // Check current session
    const checkSession = async () => {
      console.log('App: Checking session...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('App: Session data:', session ? 'User found' : 'No user');
        if (!isMounted) return;

        if (session?.user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (userError) console.error('App: User fetch error:', userError);
          
          const developerEmail = 'ojaomojesuloluwa@gmail.com';
          
          if (userData) {
            console.log('App: User data found:', userData.role);
            setUser(userData);
          } else if (session.user.email === developerEmail) {
            console.log('App: Developer session detected, forcing admin role');
            setUser({ 
              id: session.user.id, 
              name: 'System Admin', 
              role: 'admin',
              email: developerEmail
            });
          } else {
            console.log('App: No user data in DB, forcing registration');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('App: Session check error:', error);
      } finally {
        if (isMounted) {
          console.log('App: checkSession finished, setting loading to false');
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('App: Auth state change:', event);
      if (!isMounted) return;

      if (session?.user) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          const developerEmail = 'ojaomojesuloluwa@gmail.com';
          
          if (userData) {
            setUser(userData);
          } else if (session.user.email === developerEmail) {
            setUser({ 
              id: session.user.id, 
              name: 'System Admin', 
              role: 'admin',
              email: developerEmail
            });
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('App: Auth change user fetch error:', err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      clearTimeout(safetyTimeout);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const handleLogoClick = () => {
    setShowLanding(true);
    setShowAdminAuth(false);
  };

  const handleAuthSuccess = useCallback((userData: any) => {
    setUser(userData);
    setShowAdminAuth(false);
    setShowLanding(false);
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      setShowUserMenu(false);
    }
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
          {showLanding ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LandingPage 
                onGetStarted={() => {
                  setShowLanding(false);
                  setShowAdminAuth(false);
                }} 
                onAdminLogin={() => {
                  setShowLanding(false);
                  setShowAdminAuth(true);
                }}
              />
            </motion.div>
          ) : !user ? (
            <motion.div
              key={showAdminAuth ? "admin-auth" : "auth"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {showAdminAuth ? (
                <AdminAuth 
                  onAuthSuccess={handleAuthSuccess} 
                  onLogoClick={handleLogoClick}
                />
              ) : (
                <Auth 
                  onAuthSuccess={handleAuthSuccess} 
                  onLogoClick={handleLogoClick}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-screen flex-col"
            >
              {/* Top Nav */}
              <div className="relative z-[1000] flex items-center justify-between border-b border-carbon bg-midnight/80 px-6 py-4 backdrop-blur-xl">
                {/* Left: Logo & Role Badge */}
                <div className="flex items-center gap-6">
                  <button 
                    onClick={handleLogoClick}
                    className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rush-orange font-display text-sm font-extrabold text-midnight">
                      R
                    </div>
                    <span className="font-display text-xl font-bold text-cream">RushNG</span>
                  </button>

                  <div className="hidden items-center gap-2 rounded-full bg-carbon px-4 py-2 md:flex">
                    {user.role === 'seller' ? (
                      <ShoppingBag className="h-4 w-4 text-rush-orange" />
                    ) : user.role === 'rider' ? (
                      <Bike className="h-4 w-4 text-rush-orange" />
                    ) : user.role === 'admin' ? (
                      <Shield className="h-4 w-4 text-rush-orange" />
                    ) : (
                      <UserIcon className="h-4 w-4 text-rush-orange" />
                    )}
                    <span className="text-xs font-bold tracking-widest text-white/60 uppercase">{user.role}</span>
                  </div>
                </div>
                
                {/* Right: Icons */}
                <div className="flex items-center justify-end gap-2">
                  <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-carbon bg-white/5 text-white/40 transition-colors hover:border-rush-orange hover:text-rush-orange">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rush-orange ring-2 ring-midnight" />
                  </button>
                  
                  <button 
                    onClick={() => setShowHelp(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-carbon bg-white/5 text-white/40 transition-colors hover:border-rush-orange hover:text-rush-orange"
                  >
                    <HelpCircle className="h-5 w-5" />
                  </button>

                  <div className="relative">
                    <button 
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-carbon bg-white/5 text-white/40 transition-colors hover:border-rush-orange hover:text-rush-orange"
                    >
                      <UserIcon className="h-5 w-5" />
                    </button>
                    
                    <AnimatePresence>
                      {showUserMenu && (
                        <>
                          <div 
                            className="fixed inset-0 z-[1001]" 
                            onClick={() => setShowUserMenu(false)}
                          />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 top-full z-[1002] mt-2 w-64 origin-top-right rounded-2xl border border-carbon bg-midnight p-2 shadow-2xl"
                          >
                            <div className="px-4 py-3">
                              <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Account</div>
                              <div className="mt-1 text-sm font-bold text-cream">{user.name}</div>
                              <div className="text-[10px] text-white/40 font-mono">{user.phone || user.email}</div>
                              
                              <div className="mt-3 flex items-center gap-2 rounded-lg bg-rush-orange/10 px-2 py-1.5">
                                <Shield className="h-3 w-3 text-rush-orange" />
                                <span className="text-[10px] font-black text-rush-orange uppercase tracking-widest">{user.role}</span>
                              </div>
                            </div>
                            
                            <div className="my-2 h-px bg-carbon" />
                            
                            <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-bold text-white/60 transition-colors hover:bg-white/5 hover:text-white uppercase tracking-widest">
                              <Settings className="h-4 w-4" />
                              Settings
                            </button>
                            
                            <button
                              onClick={handleLogout}
                              className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-500/10 uppercase tracking-widest"
                            >
                              <LogOut className="h-4 w-4" />
                              Logout
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-hidden">
                {user.role === 'seller' ? (
                  <SellerDashboard user={user} />
                ) : user.role === 'rider' ? (
                  <RiderDashboard user={user} />
                ) : user.role === 'admin' ? (
                  <AdminDashboard user={user} />
                ) : (
                  <BuyerDashboard user={user} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Modal */}
        <AnimatePresence>
          {showHelp && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHelp(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-midnight shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-carbon p-6">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-rush-orange" />
                    <h3 className="font-display text-lg font-bold text-cream">Setup Guide</h3>
                  </div>
                  <button 
                    onClick={() => setShowHelp(false)}
                    className="rounded-full p-2 text-white/20 hover:bg-white/5 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="max-h-[70vh] overflow-y-auto p-8">
                  <div className="space-y-8">
                    <section>
                      <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rush-orange">
                        <Globe className="h-4 w-4" />
                        Map & Routing
                      </h4>
                      <div className="space-y-3 text-sm text-white/60">
                        <p>We use <strong>Leaflet</strong> and <strong>OSRM</strong> for free, open-source mapping and routing. No API keys or credit cards required!</p>
                        <p>1. Tap the map to set pickup and drop-off locations.</p>
                        <p>2. Fees are calculated automatically based on road distance (₦500 base + ₦150/km).</p>
                      </div>
                    </section>

                    <section>
                      <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rush-orange">
                        <Phone className="h-4 w-4" />
                        Twilio Phone Auth
                      </h4>
                      <div className="space-y-3 text-sm text-white/60">
                        <p>To enable real SMS verification:</p>
                        <ol className="list-decimal list-inside space-y-2">
                          <li>Create a <strong>Twilio</strong> account and get your Account SID and Auth Token.</li>
                          <li>In <strong>Supabase Dashboard</strong>, go to <strong>Authentication</strong> → <strong>Providers</strong> → <strong>Phone</strong>.</li>
                          <li>Enable Phone Provider and select <strong>Twilio</strong>.</li>
                          <li>Enter your Twilio credentials and your Twilio Phone Number.</li>
                          <li>Save changes. Now users can receive real OTP codes!</li>
                        </ol>
                      </div>
                    </section>

                    <section>
                      <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rush-orange">
                        <ShoppingBag className="h-4 w-4" />
                        Supabase Tables
                      </h4>
                      <div className="space-y-3 text-sm text-white/60">
                        <p>Ensure you have these tables in your Supabase database:</p>
                        <ul className="list-disc list-inside space-y-1 font-mono text-xs text-white/40">
                          <li>users (id, name, role, is_verified, opay_data)</li>
                          <li>orders (id, seller_id, rider_id, pickup, dropoff, status, fare, distance, payment_method)</li>
                        </ul>
                      </div>
                    </section>
                  </div>
                </div>
                
                <div className="border-t border-carbon bg-black/20 p-6 text-center">
                  <p className="text-xs text-white/20 italic">RushNG — Delivering Lagos, one order at a time.</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
}
