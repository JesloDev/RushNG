import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { MapPin, Check, Navigation, Package, Bike, Map as MapIcon, List, Volume2 } from 'lucide-react';
import GoogleMap from './Map';

export default function RiderDashboard({ user }: { user: any }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [verifying, setVerifying] = useState(false);
  const [isPidgin, setIsPidgin] = useState(false);

  const t = (en: string, pid: string) => isPidgin ? pid : en;

  const speak = async (text: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this in a friendly Nigerian Pidgin voice: ${text}` }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audio.play();
      }
    } catch (err) {
      console.error('TTS error:', err);
    }
  };

  useEffect(() => {
    const fetchPendingOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('createdAt', { ascending: false });
      
      if (data) setOrders(data);
      if (error) console.error('Fetch pending error:', error);
    };

    const fetchActiveOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('riderId', user.id)
        .in('status', ['accepted', 'picked_up'])
        .maybeSingle();
      
      if (data) setActiveOrder(data);
      else setActiveOrder(null);
      if (error) console.error('Fetch active error:', error);
    };

    fetchPendingOrders();
    fetchActiveOrder();

    // Set up real-time subscription
    const channel = supabase
      .channel('rider-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders' 
      }, () => {
        fetchPendingOrders();
        fetchActiveOrder();
      })
      .subscribe();

    // Location tracking
    let locationInterval: any;
    if (activeOrder) {
      locationInterval = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            supabase
              .from('orders')
              .update({ riderLocation: { lat: latitude, lng: longitude } })
              .eq('id', activeOrder.id)
              .then(({ error }) => {
                if (error) console.error('Location update error:', error);
              });
          });
        }
      }, 10000); // Every 10 seconds
    }

    return () => {
      supabase.removeChannel(channel);
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [user.id, activeOrder?.id]);

  const acceptOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          riderId: user.id,
          status: 'accepted',
        })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Accept error:', error);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Update status error:', error);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    // Simulate a verification process
    setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('users')
          .update({ is_verified: true })
          .eq('id', user.id);
        
        if (error) throw error;
        alert('Account verified successfully! 🚀');
      } catch (error) {
        console.error('Verification error:', error);
      } finally {
        setVerifying(false);
      }
    }, 2000);
  };

  return (
    <div className="flex h-screen flex-col bg-midnight">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-carbon bg-midnight/80 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rush-orange font-display text-lg font-extrabold text-midnight">
            R
          </div>
          <h2 className="font-display text-xl font-extrabold text-cream">{t('Rider Hub', 'Rider Hub')}</h2>
          {user.opayData?.kycVerified && (
            <div className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[8px] font-black text-green-500 uppercase tracking-widest">
              <Check className="h-2 w-2" />
              OPay {user.opayData.accountLevel}
            </div>
          )}
          <button 
            onClick={() => setIsPidgin(!isPidgin)}
            className="rounded-full border border-rush-orange/30 bg-rush-orange/10 px-3 py-1 text-[8px] font-black text-rush-orange uppercase tracking-widest transition-all hover:bg-rush-orange hover:text-midnight"
          >
            {isPidgin ? 'ENGLISH' : 'PIDGIN'}
          </button>
          <span className="text-[10px] font-bold tracking-widest text-white/20 uppercase">{t('Oya, make we deliver!', 'Oya, make we deliver!')}</span>
        </div>
        <div className="flex gap-2 rounded-xl bg-carbon p-1">
          {!user.isVerified && (
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="mr-4 rounded-lg bg-lagos-gold/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-lagos-gold transition-all hover:bg-lagos-gold hover:text-midnight disabled:opacity-50"
            >
              {verifying ? 'VERIFYING...' : 'VERIFY ACCOUNT'}
            </button>
          )}
          {user.isVerified && (
            <div className="mr-4 flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-500">
              <Check className="h-3 w-3" />
              VERIFIED
            </div>
          )}
          <button
            onClick={() => setView('list')}
            className={`rounded-lg p-2 transition-all ${view === 'list' ? 'bg-rush-orange text-midnight' : 'text-white/40'}`}
          >
            <List className="h-5 w-5" />
          </button>
          <button
            onClick={() => setView('map')}
            className={`rounded-lg p-2 transition-all ${view === 'map' ? 'bg-rush-orange text-midnight' : 'text-white/40'}`}
          >
            <MapIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto p-6"
            >
              {activeOrder ? (
                <div className="mb-12 space-y-6">
                  <h3 className="text-xs font-bold tracking-[0.2em] text-rush-orange uppercase">Active Delivery</h3>
                  <div className="rounded-3xl border border-rush-orange/30 bg-rush-orange/[0.03] p-8">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bike className="h-6 w-6 text-rush-orange" />
                        <span className="font-display text-xl font-bold text-cream">Order #{activeOrder.id.slice(0, 5)}</span>
                      </div>
                      <span className="rounded-full bg-rush-orange px-3 py-1 text-[10px] font-black uppercase tracking-widest text-midnight">
                        {activeOrder.status === 'accepted' ? 'Oya, go pick am!' : 'On the way!'}
                      </span>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-carbon text-rush-orange">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold tracking-widest text-white/20 uppercase">Pickup</p>
                          <p className="text-sm text-cream">{activeOrder.pickup.address}</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-carbon text-lagos-gold">
                          <Navigation className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold tracking-widest text-white/20 uppercase">Drop-off</p>
                          <p className="text-sm text-cream">{activeOrder.dropoff.address}</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-carbon text-green-500">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold tracking-widest text-white/20 uppercase">Payment Method</p>
                          <p className="text-sm font-bold text-cream uppercase">{activeOrder.paymentMethod}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                      {activeOrder.status === 'accepted' && (
                        <button
                          onClick={() => updateStatus(activeOrder.id, 'picked_up')}
                          className="w-full rounded-xl bg-rush-orange py-4 font-display text-sm font-bold text-midnight uppercase tracking-widest"
                        >
                          I'VE PICKED UP 📦
                        </button>
                      )}
                      {activeOrder.status === 'picked_up' && (
                        <button
                          onClick={() => updateStatus(activeOrder.id, 'delivered')}
                          className="w-full rounded-xl bg-green-500 py-4 font-display text-sm font-bold text-midnight uppercase tracking-widest"
                        >
                          DELIVERED! ✅
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold tracking-[0.2em] text-white/20 uppercase">{t('Pending Pickups', 'Load wey dey wait')}</h3>
                    <button 
                      onClick={() => speak(t('Here are the orders available for delivery. Tap one to see details.', 'Look all the load wey dey ground for delivery. Touch any one to see more.'))}
                      className="rounded-full p-2 text-rush-orange hover:bg-rush-orange/10"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                  {orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="mb-4 text-4xl">😴</div>
                      <p className="text-sm text-white/20">{t('No orders available right now. Lagos is quiet.', 'No load dey ground now. Lagos quiet.')}</p>
                      <p className="mt-2 text-[10px] text-white/10 italic">{t('Wait small, money go come.', 'Wait small, money go come.')}</p>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {orders.map(order => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl border border-carbon bg-white/5 p-6"
                      >
                        <div className="mb-6 flex items-center justify-between">
                          <span className="font-display text-2xl font-extrabold text-rush-orange">₦{order.fare}</span>
                          <span className="text-xs text-white/20">{new Date(order.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="mb-6 space-y-3">
                          <div className="flex items-center gap-2 text-xs text-white/40">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{order.pickup.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-white/40">
                            <Navigation className="h-3 w-3" />
                            <span className="truncate">{order.dropoff.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-rush-orange/60 uppercase">
                            <Package className="h-3 w-3" />
                            <span>{order.paymentMethod}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => acceptOrder(order.id)}
                          className="w-full rounded-xl bg-white/5 py-3 font-display text-xs font-bold text-cream transition-colors hover:bg-rush-orange hover:text-midnight"
                        >
                          ACCEPT PICKUP
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <GoogleMap 
                markers={orders.map(o => ({
                  id: o.id,
                  position: o.pickup,
                  title: `₦${o.fare}`,
                  color: '#FF5C1A'
                }))}
                onMarkerClick={(id) => acceptOrder(id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
