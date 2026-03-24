import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { logActivity } from '../services/logger';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Check, Navigation, Package, Bike, List, Volume2, Loader2, Clock } from 'lucide-react';
import LeafletMap from './Map';

export default function RiderDashboard({ user }: { user: any }) {
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'quests' | 'my'>('quests');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPidgin, setIsPidgin] = useState(false);

  const t = (en: string, pid: string) => isPidgin ? pid : en;

  useEffect(() => {
    if (!user?.id) return;

    const fetchOrders = async () => {
      // Fetch available orders
      const { data: available, error: availError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (available) setAvailableOrders(available);
      if (availError) console.error('Fetch available error:', availError);

      // Fetch my active orders
      const { data: mine, error: mineError } = await supabase
        .from('orders')
        .select('*')
        .eq('rider_id', user.id)
        .in('status', ['accepted', 'picked_up', 'delivered', 'collected'])
        .neq('status', 'completed')
        .order('created_at', { ascending: false });
      
      if (mine) setMyOrders(mine);
      if (mineError) console.error('Fetch mine error:', mineError);
    };

    fetchOrders();

    const channel = supabase
      .channel('rider-orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders'
      }, () => {
        fetchOrders();
      })
      .subscribe();

    // Location tracking
    let locationInterval: any;
    if (myOrders.length > 0) {
      locationInterval = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            myOrders.forEach(order => {
              if (order.status !== 'completed') {
                supabase
                  .from('orders')
                  .update({ rider_location: { lat: latitude, lng: longitude } })
                  .eq('id', order.id)
                  .then(({ error }) => {
                    if (error) console.error('Location update error:', error);
                  });
              }
            });
          });
        }
      }, 10000);
    }

    return () => {
      supabase.removeChannel(channel);
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [user.id, myOrders.length]);

  const acceptOrder = async (orderId: string) => {
    if (myOrders.length >= 3) {
      setError(t('You can only have 3 active deliveries at a time.', 'You fit only carry 3 load at once. Finish the ones you get first!'));
      return;
    }

    setLoading(true);
    try {
      // Use a conditional update to ensure first-come-first-served
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          rider_id: user.id, 
          status: 'accepted' 
        })
        .eq('id', orderId)
        .eq('status', 'pending')
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(t('Someone else already accepted this order.', 'Another rider don carry this one. Sharp sharp!'));
      }

      await logActivity('order_accepted_by_rider', { orderId }, user.id);
    } catch (err: any) {
      console.error('Accept error:', err);
      setError(err.message || 'Failed to accept order.');
      await logActivity('order_acceptance_failed_by_rider', { orderId, error: err.message }, user.id);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelivery = async (orderId: string) => {
    try {
      const { data: order } = await supabase.from('orders').select('buyer_confirmed').eq('id', orderId).single();
      
      const updateData: any = { rider_confirmed: true };
      if (order?.buyer_confirmed) {
        updateData.status = 'completed';
      } else {
        updateData.status = 'delivered';
      }

      const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
      if (error) throw error;

      await logActivity('order_delivered_by_rider', { orderId, status: updateData.status }, user.id);
    } catch (err: any) {
      console.error('Confirm error:', err);
      setError(err.message || 'Failed to confirm delivery.');
      await logActivity('order_delivery_failed_by_rider', { orderId, error: err.message }, user.id);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-midnight md:flex-row">
      {/* Sidebar */}
      <div className="z-20 flex w-full flex-col border-b border-carbon bg-midnight/80 backdrop-blur-xl md:w-[400px] md:border-b-0 md:border-r">
        <div className="flex items-center justify-between border-b border-carbon p-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('quests')}
              className={`font-display text-xs font-bold tracking-widest uppercase transition-all ${
                activeTab === 'quests' ? 'text-rush-orange' : 'text-white/20 hover:text-white/40'
              }`}
            >
              {t('QUESTS', 'LOADS')}
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`font-display text-xs font-bold tracking-widest uppercase transition-all ${
                activeTab === 'my' ? 'text-rush-orange' : 'text-white/20 hover:text-white/40'
              }`}
            >
              {t('MY LOAD', 'MY WAY')}
            </button>
          </div>
          <button 
            onClick={() => setIsPidgin(!isPidgin)}
            className="rounded-full border border-rush-orange/30 bg-rush-orange/10 px-3 py-1 text-[10px] font-black text-rush-orange uppercase tracking-widest"
          >
            {isPidgin ? 'ENGLISH' : 'PIDGIN'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-500 uppercase tracking-widest">
              {error}
              <button onClick={() => setError(null)} className="ml-2 underline">DISMISS</button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'my' && (
              <motion.div
                key="my"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <h3 className="font-display text-xl font-extrabold text-cream">{t('My Deliveries', 'My Load')} ({myOrders.length}/3)</h3>
                <div className="space-y-4">
                  {myOrders.length === 0 ? (
                    <p className="text-sm text-white/20 italic">{t('No active deliveries.', 'You never carry any load.')}</p>
                  ) : (
                    myOrders.map(order => (
                      <div key={order.id} className="rounded-2xl border border-rush-orange/30 bg-rush-orange/[0.03] p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black text-rush-orange uppercase tracking-widest">{order.status}</span>
                          <span className="text-[10px] text-white/20">{new Date(order.created_at).toLocaleTimeString()}</span>
                        </div>
                        <h4 className="font-bold text-cream">{order.product_name}</h4>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2 text-[10px] text-white/40">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">Pickup: {order.pickup.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-white/40">
                            <Navigation className="h-3 w-3" />
                            <span className="truncate">Drop-off: {order.dropoff.address}</span>
                          </div>
                        </div>
                        
                        {!order.rider_confirmed && (
                          <button
                            onClick={() => confirmDelivery(order.id)}
                            className="mt-4 w-full rounded-xl bg-rush-orange py-2 text-xs font-bold text-midnight"
                          >
                            {t('MARK AS DELIVERED', 'I DON DELIVER AM')}
                          </button>
                        )}
                        {order.rider_confirmed && !order.buyer_confirmed && (
                          <p className="mt-4 text-[10px] text-center italic text-white/20">
                            {t('Waiting for customer to confirm...', 'Wait for customer to confirm...')}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'quests' && (
              <motion.div
                key="quests"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <h3 className="font-display text-xl font-extrabold text-cream">{t('Available Quests', 'Load wey dey ground')}</h3>
                <div className="space-y-4">
                  {availableOrders.length === 0 ? (
                    <p className="text-sm text-white/20 italic">{t('No available quests.', 'No load dey ground now.')}</p>
                  ) : (
                    availableOrders.map(order => (
                      <div key={order.id} className="rounded-2xl border border-carbon bg-white/5 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-display text-lg font-black text-rush-orange">₦{order.fare.toLocaleString()}</span>
                          <span className="text-[10px] text-white/20">{new Date(order.created_at).toLocaleTimeString()}</span>
                        </div>
                        <h4 className="font-bold text-cream">{order.product_name}</h4>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2 text-[10px] text-white/40">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">Pickup: {order.pickup.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-white/40">
                            <Navigation className="h-3 w-3" />
                            <span className="truncate">Drop-off: {order.dropoff.address}</span>
                          </div>
                        </div>
                        <button
                          disabled={loading || myOrders.length >= 3}
                          onClick={() => acceptOrder(order.id)}
                          className="mt-4 w-full rounded-xl bg-white/10 py-2 text-xs font-bold text-cream hover:bg-rush-orange hover:text-midnight disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : t('ACCEPT QUEST', 'I GO CARRY AM')}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1 bg-carbon">
        <LeafletMap 
          markers={[
            ...availableOrders.map(o => ({
              id: o.id,
              position: o.pickup,
              title: `₦${o.fare}`,
              color: '#FF5C1A'
            })),
            ...myOrders.map(o => ({
              id: `my-${o.id}`,
              position: o.dropoff,
              title: 'Drop-off',
              color: '#34A853'
            }))
          ]}
          onMarkerClick={(id) => acceptOrder(id)}
        />
      </div>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-carbon bg-midnight/80 px-6 py-3 backdrop-blur-xl md:hidden">
        <button
          onClick={() => setActiveTab('quests')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'quests' ? 'text-rush-orange' : 'text-white/20'
          }`}
        >
          <List className="h-5 w-5" />
          <span className="text-[8px] font-bold uppercase tracking-widest">{t('QUESTS', 'LOADS')}</span>
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'my' ? 'text-rush-orange' : 'text-white/20'
          }`}
        >
          <Bike className="h-5 w-5" />
          <span className="text-[8px] font-bold uppercase tracking-widest">{t('MY LOAD', 'MY WAY')}</span>
        </button>
      </div>
    </div>
  );
}
