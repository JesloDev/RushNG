import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { MapPin, Phone, Check, Trash2, Clock, Package, Navigation, TrendingUp, BarChart2, Volume2, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import LeafletMap from './Map';
import LocationSearch from './LocationSearch';

export default function SellerDashboard({ user }: { user: any }) {
  const [step, setStep] = useState(1);
  const [pickup, setPickup] = useState<{ lat: number, lng: number, address: string } | null>(null);
  const [dropoff, setDropoff] = useState<{ lat: number, lng: number, address: string } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number }>({ lat: 6.5244, lng: 3.3792 });
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'active' | 'analytics'>('new');
  const [calculatedFare, setCalculatedFare] = useState<number | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [isPidgin, setIsPidgin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (en: string, pid: string) => isPidgin ? pid : en;

  const speak = async (text: string) => {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY missing, TTS disabled');
      return;
    }
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

      const part = response.candidates?.[0]?.content?.parts?.[0];
      const base64Audio = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType || 'audio/wav';
      
      if (base64Audio) {
        const audio = new Audio(`data:${mimeType};base64,${base64Audio}`);
        audio.play();
      }
    } catch (err) {
      console.error('TTS error:', err);
    }
  };

  useEffect(() => {
    if (!pickup || !dropoff) return;

    const calculateFee = async () => {
      try {
        // Using OSRM public API for free routing
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=false`
        );
        const data = await response.json();

        if (data.routes?.[0]) {
          const distKm = data.routes[0].distance / 1000;
          const baseFare = 500; // Base price for Lagos traffic
          const perKmRate = 150;
          const totalFare = Math.ceil(baseFare + (distKm * perKmRate));
          
          setCalculatedFare(totalFare);
          setDistance(`${distKm.toFixed(1)} km`);
        }
      } catch (err) {
        console.error('Fee calculation error:', err);
        // Fallback to straight line distance if API fails
        const dist = Math.sqrt(
          Math.pow(pickup.lat - dropoff.lat, 2) + 
          Math.pow(pickup.lng - dropoff.lng, 2)
        ) * 111; // rough km conversion
        const totalFare = Math.ceil(500 + (dist * 150));
        setCalculatedFare(totalFare);
        setDistance(`${dist.toFixed(1)} km`);
      }
    };

    calculateFee();
  }, [pickup, dropoff]);
  const analyticsData = useMemo(() => {
    const delivered = orders.filter(o => o.status === 'delivered');
    const grouped = delivered.reduce((acc: any, o) => {
      const date = new Date(o.created_at).toLocaleDateString('en-NG', { weekday: 'short' });
      acc[date] = (acc[date] || 0) + o.fare;
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [orders]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setOrders(data);
      if (error) console.error('Fetch orders error:', error);
    };

    fetchOrders();

    // Set up real-time subscription
    const channel = supabase
      .channel('seller-orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `seller_id=eq.${user.id}`
      }, (payload) => {
        fetchOrders(); // Refresh all for simplicity, or handle delta
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const handleMapClick = (e: any) => {
    const pos = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng, address: 'Selected location' };
    if (step === 1) setPickup(pos);
    if (step === 2) setDropoff(pos);
  };

  const handlePlaceOrder = async () => {
    if (!pickup || !dropoff) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('orders').insert([{
        seller_id: user.id,
        pickup,
        dropoff,
        customer_phone: customerPhone,
        status: 'pending',
        fare: calculatedFare || 800,
        distance: distance || '0 km',
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
      }]);
      
      if (error) throw error;

      setStep(1);
      setPickup(null);
      setDropoff(null);
      setCustomerPhone('');
      setPaymentMethod('cash');
      setCalculatedFare(null);
      setDistance(null);
    } catch (error: any) {
      console.error('Order error:', error);
      setError(error.message || 'Failed to place order. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (id: string) => {
    try {
      const { error: deleteError } = await supabase.from('orders').delete().eq('id', id);
      if (deleteError) throw deleteError;
    } catch (err: any) {
      console.error('Cancel error:', err);
      setError(err.message || 'Failed to cancel order. Try again.');
    }
  };

  return (
    <div className="flex h-screen flex-col bg-midnight md:flex-row">
      {/* Sidebar - Order Flow */}
      <div className="z-20 flex w-full flex-col border-b border-carbon bg-midnight/80 backdrop-blur-xl md:w-[400px] md:border-b-0 md:border-r">
        <div className="flex items-center justify-between border-b border-carbon p-6">
          <div className="flex items-center gap-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('new')}
                className={`font-display text-xs font-bold tracking-widest uppercase transition-all ${
                  activeTab === 'new' ? 'text-rush-orange' : 'text-white/20 hover:text-white/40'
                }`}
              >
                {t('NEW', 'OYA')}
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`font-display text-xs font-bold tracking-widest uppercase transition-all ${
                  activeTab === 'active' ? 'text-rush-orange' : 'text-white/20 hover:text-white/40'
                }`}
              >
                {t('ACTIVE', 'DEY MOVE')}
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`font-display text-xs font-bold tracking-widest uppercase transition-all ${
                  activeTab === 'analytics' ? 'text-rush-orange' : 'text-white/20 hover:text-white/40'
                }`}
              >
                {t('ANALYTICS', 'MONEY')}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPidgin(!isPidgin)}
              className="rounded-full border border-rush-orange/30 bg-rush-orange/10 px-3 py-1 text-[10px] font-black text-rush-orange uppercase tracking-widest transition-all hover:bg-rush-orange hover:text-midnight"
            >
              {isPidgin ? 'ENGLISH' : 'PIDGIN'}
            </button>
            {user.opayData?.kycVerified && (
              <div className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[8px] font-black text-green-500 uppercase tracking-widest">
                <Check className="h-2 w-2" />
                {user.opayData.accountLevel}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-red-500 uppercase tracking-widest">{error}</p>
                <button onClick={() => setError(null)} className="text-red-500 hover:text-red-400">
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            {activeTab === 'new' && (
              <motion.div
                key="new-order"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-display text-xl font-extrabold text-cream">{t('New Delivery', 'New Way')}</h2>
                  <button 
                    onClick={() => speak(t('Welcome to RushNG. Let\'s set up your new delivery.', 'Welcome to RushNG. Oya, make we set up your new delivery.'))}
                    className="rounded-full p-2 text-rush-orange hover:bg-rush-orange/10"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(s => (
                      <div key={s} className={`h-1 w-8 rounded-full ${step >= s ? 'bg-rush-orange' : 'bg-carbon'}`} />
                    ))}
                  </div>
                </div>

                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 text-rush-orange">
                      <MapPin className="h-5 w-5" />
                      <span className="text-xs font-bold tracking-widest uppercase">{t('Step 1 — Pickup', 'Step 1 — Where you dey?')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-2xl font-bold text-cream">{t('Where are you?', 'Where we go pick am?')}</h3>
                      <button 
                        onClick={() => speak(t('Please type your address or tap the map to set your pickup location.', 'Abeg type your address or touch the map for where we go pick the load.'))}
                        className="rounded-full p-2 text-rush-orange hover:bg-rush-orange/10"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-white/40">{t('Type your address for suggestions or tap the map to set your pickup location.', 'Type your address or touch the map for where we go pick the load.')}</p>
                    
                    <LocationSearch 
                      placeholder={t('Search pickup address...', 'Search for where we go pick am...')}
                      onSelect={(loc) => {
                        setPickup(loc);
                        setMapCenter({ lat: loc.lat, lng: loc.lng });
                      }}
                    />

                    <div className="rounded-xl border border-carbon bg-white/5 p-4">
                      {pickup ? (
                        <div className="flex items-center gap-3 text-cream">
                          <Check className="h-5 w-5 text-rush-orange" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">Pickup set!</span>
                            <span className="text-[10px] text-white/40 line-clamp-1">{pickup.address}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm italic text-white/20">Waiting for map pin or search...</span>
                      )}
                    </div>
                    <button
                      disabled={!pickup}
                      onClick={() => setStep(2)}
                      className="w-full rounded-xl bg-rush-orange py-4 font-display text-sm font-bold text-midnight disabled:opacity-50"
                    >
                      NEXT →
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 text-rush-orange">
                      <Navigation className="h-5 w-5" />
                      <span className="text-xs font-bold tracking-widest uppercase">{t('Step 2 — Drop-off', 'Step 2 — Where e dey go?')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-2xl font-bold text-cream">{t("Where's it going?", 'Where the customer dey?')}</h3>
                      <button 
                        onClick={() => speak(t('Now, tell us where the delivery is going and enter the customer\'s phone number.', 'Now, tell us where the load dey go and put the customer phone number.'))}
                        className="rounded-full p-2 text-rush-orange hover:bg-rush-orange/10"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="relative">
                        <Phone className="absolute top-4 left-4 h-5 w-5 text-white/20" />
                        <input
                          type="tel"
                          placeholder="Customer Phone Number"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full rounded-xl border border-carbon bg-white/5 py-4 pr-4 pl-12 text-sm text-cream placeholder:text-white/20 focus:border-rush-orange focus:outline-none"
                        />
                      </div>

                      <LocationSearch 
                        placeholder={t('Search drop-off address...', 'Search for where the load dey go...')}
                        onSelect={(loc) => {
                          setDropoff(loc);
                          setMapCenter({ lat: loc.lat, lng: loc.lng });
                        }}
                      />

                      <div className="rounded-xl border border-carbon bg-white/5 p-4">
                        {dropoff ? (
                          <div className="flex items-center gap-3 text-cream">
                            <Check className="h-5 w-5 text-rush-orange" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">Drop-off set!</span>
                              <span className="text-[10px] text-white/40 line-clamp-1">{dropoff.address}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm italic text-white/20">Waiting for map pin or search...</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setStep(1)} className="flex-1 rounded-xl bg-carbon py-4 font-display text-sm font-bold text-white/40">BACK</button>
                      <button
                        disabled={!dropoff || !customerPhone}
                        onClick={() => setStep(3)}
                        className="flex-[2] rounded-xl bg-rush-orange py-4 font-display text-sm font-bold text-midnight disabled:opacity-50"
                      >
                        NEXT →
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 text-rush-orange">
                      <Package className="h-5 w-5" />
                      <span className="text-xs font-bold tracking-widest uppercase">{t('Step 3 — Confirm', 'Step 3 — Finish am')}</span>
                    </div>
                    
                    {calculatedFare && (
                      <div className="flex flex-col items-center rounded-2xl border border-rush-orange/20 bg-rush-orange/[0.03] py-10">
                        <span className="font-display text-6xl font-extrabold text-rush-orange">₦{calculatedFare.toLocaleString()}</span>
                        <span className="mt-2 text-xs font-bold tracking-widest text-white/20 uppercase">
                          {t('Estimated Fare', 'Logistics Money')} ({distance})
                        </span>
                        <button 
                          onClick={() => speak(t(`The delivery fee is ${calculatedFare} Naira based on the distance.`, `The logistics money na ${calculatedFare} Naira as the road far reach.`))}
                          className="mt-4 flex items-center gap-2 rounded-full bg-rush-orange/10 px-4 py-2 text-[10px] font-black text-rush-orange uppercase tracking-widest hover:bg-rush-orange hover:text-midnight"
                        >
                          <Volume2 className="h-3 w-3" />
                          {t('LISTEN TO PRICE', 'HEAR THE PRICE')}
                        </button>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl border border-carbon bg-white/5 p-4">
                        <span className="text-xs text-white/40">{t('Pickup', 'Where we pick am')}</span>
                        <span className="text-sm font-medium text-cream">{t('Set on Map', 'I don set am')}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-carbon bg-white/5 p-4">
                        <span className="text-xs text-white/40">{t('Drop-off', 'Where e dey go')}</span>
                        <span className="text-sm font-medium text-cream">{t('Set on Map', 'I don set am')}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-xs font-bold tracking-widest text-white/20 uppercase">{t('Payment Method', 'How dem go pay?')}</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setPaymentMethod('cash')}
                          className={`rounded-xl border py-3 text-xs font-bold transition-all ${
                            paymentMethod === 'cash' ? 'border-rush-orange bg-rush-orange/10 text-rush-orange' : 'border-carbon text-white/40'
                          }`}
                        >
                          {t('CASH', 'CASH')}
                        </button>
                        <button
                          onClick={() => setPaymentMethod('transfer')}
                          className={`rounded-xl border py-3 text-xs font-bold transition-all ${
                            paymentMethod === 'transfer' ? 'border-rush-orange bg-rush-orange/10 text-rush-orange' : 'border-carbon text-white/40'
                          }`}
                        >
                          {t('TRANSFER', 'TRANSFER')}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setStep(2)} className="flex-1 rounded-xl bg-carbon py-4 font-display text-sm font-bold text-white/40">{t('BACK', 'GO BACK')}</button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        className="flex-[2] rounded-xl bg-rush-orange py-4 font-display text-sm font-bold text-midnight transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-midnight border-t-transparent" />
                        ) : (
                          t('POST DELIVERY', 'OYA, POST AM!')
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'active' && (
              <motion.div
                key="active-orders"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <h2 className="font-display text-xl font-extrabold text-cream">Active Orders</h2>
                <div className="space-y-4">
                  {orders.length === 0 && (
                    <p className="text-center text-sm italic text-white/10">No active orders yet.</p>
                  )}
                  {orders.map(order => (
                    <div key={order.id} className="rounded-xl border border-carbon bg-white/5 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                          order.status === 'pending' ? 'bg-lagos-gold text-midnight' : 
                          order.status === 'delivered' ? 'bg-green-500 text-white' : 'bg-rush-orange text-midnight'
                        }`}>
                          {order.status}
                        </span>
                        <button onClick={() => cancelOrder(order.id)} className="text-white/20 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-xs text-white/40">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/40">
                          <Phone className="h-4 w-4" />
                          <span>{order.customer_phone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/40">
                          <Package className="h-4 w-4" />
                          <span className="uppercase">{order.payment_method}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-extrabold text-cream">Business Stats</h2>
                  <div className="flex items-center gap-2">
                    {user.opayData?.kycVerified && (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[8px] font-black text-green-500 uppercase tracking-widest">
                        OPay {user.opayData.accountLevel}
                      </span>
                    )}
                    <BarChart2 className="h-5 w-5 text-rush-orange" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-carbon bg-white/5 p-6">
                    <span className="text-[10px] font-bold tracking-widest text-white/20 uppercase">Total Orders</span>
                    <div className="mt-2 text-3xl font-black text-cream">{orders.length}</div>
                    <p className="mt-1 text-[10px] text-white/20 italic">Oya, more orders!</p>
                  </div>
                  <div className="rounded-2xl border border-carbon bg-white/5 p-6">
                    <span className="text-[10px] font-bold tracking-widest text-white/20 uppercase">Revenue</span>
                    <div className="mt-2 text-3xl font-black text-rush-orange">
                      ₦{(orders.filter(o => o.status === 'delivered').length * 800).toLocaleString()}
                    </div>
                    <p className="mt-1 text-[10px] text-white/20 italic">Money dey enter!</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-carbon bg-white/5 p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest text-white/20 uppercase">Weekly Revenue</span>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#4D4D4D', fontSize: 10 }} 
                        />
                        <YAxis hide />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255, 92, 26, 0.05)' }}
                          contentStyle={{ 
                            backgroundColor: '#0A0A0A', 
                            border: '1px solid #1A1A1A',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {analyticsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === analyticsData.length - 1 ? '#FF5C1A' : '#1A1A1A'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-carbon bg-white/5 p-6">
                  <span className="text-[10px] font-bold tracking-widest text-white/20 uppercase">Success Rate</span>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-carbon">
                    <div 
                      className="h-full bg-green-500 transition-all" 
                      style={{ width: `${orders.length > 0 ? (orders.filter(o => o.status === 'delivered').length / orders.length) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-white/20 italic">No dulling, keep delivering!</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Map View */}
      <div className="relative flex-1 bg-carbon">
        <LeafletMap 
          center={mapCenter}
          onMapClick={handleMapClick}
          markers={[
            ...(pickup ? [{ id: 'pickup', position: { lat: pickup.lat, lng: pickup.lng }, title: 'Pickup', color: '#FF5C1A' }] : []),
            ...(dropoff ? [{ id: 'dropoff', position: { lat: dropoff.lat, lng: dropoff.lng }, title: 'Drop-off', color: '#FFB347' }] : []),
            ...orders
              .filter(o => o.status !== 'delivered' && o.status !== 'cancelled' && o.rider_location)
              .map(o => ({
                id: `rider-${o.id}`,
                position: o.rider_location,
                title: `Rider for ${o.id}`,
                color: '#34A853'
              }))
          ]}
        />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
      </div>
    </div>
  );
}
