import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { logActivity } from '../services/logger';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Check, Clock, Package, Navigation, Volume2, Search, Loader2 } from 'lucide-react';
import LeafletMap from './Map';
import LocationSearch from './LocationSearch';

export default function SellerDashboard({ user }: { user: any }) {
  const [shopAddress, setShopAddress] = useState<{ lat: number, lng: number, address: string } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number }>({ lat: 6.5244, lng: 3.3792 });
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'shop' | 'orders'>('shop');
  const [isPidgin, setIsPidgin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (en: string, pid: string) => isPidgin ? pid : en;

  useEffect(() => {
    if (!user?.id) return;

    const fetchShopAddress = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('shop_address')
        .eq('id', user.id)
        .single();
      
      if (data?.shop_address) {
        setShopAddress(data.shop_address);
        setMapCenter({ lat: data.shop_address.lat, lng: data.shop_address.lng });
      }
    };

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setOrders(data);
      if (error) console.error('Fetch orders error:', error);
    };

    fetchShopAddress();
    fetchOrders();

    const channel = supabase
      .channel('seller-orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `seller_id=eq.${user.id}`
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const handleUpdateShopAddress = async (loc: { lat: number, lng: number, address: string }) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ shop_address: loc })
        .eq('id', user.id);
      
      if (error) throw error;
      setShopAddress(loc);
      setMapCenter({ lat: loc.lat, lng: loc.lng });
      await logActivity('shop_address_updated', { address: loc.address }, user.id);
    } catch (err: any) {
      console.error('Update address error:', err);
      setError(err.message || 'Failed to update shop address.');
      await logActivity('shop_address_update_failed', { error: err.message }, user.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-midnight md:flex-row">
      {/* Sidebar */}
      <div className="z-20 flex w-full flex-col border-b border-carbon bg-midnight/80 backdrop-blur-xl md:w-[400px] md:border-b-0 md:border-r">
        <div className="flex items-center justify-between border-b border-carbon p-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('shop')}
              className={`font-display text-xs font-bold tracking-widest uppercase transition-all ${
                activeTab === 'shop' ? 'text-rush-orange' : 'text-white/20 hover:text-white/40'
              }`}
            >
              {t('SHOP', 'SHOP')}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`font-display text-xs font-bold tracking-widest uppercase transition-all ${
                activeTab === 'orders' ? 'text-rush-orange' : 'text-white/20 hover:text-white/40'
              }`}
            >
              {t('ORDERS', 'LOAD')}
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
            {activeTab === 'shop' && (
              <motion.div
                key="shop"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-rush-orange">
                    <MapPin className="h-5 w-5" />
                    <span className="text-xs font-bold tracking-widest uppercase">{t('Shop Location', 'Where your shop dey?')}</span>
                  </div>
                  <LocationSearch 
                    placeholder={t('Set your shop address...', 'Where your shop dey?')}
                    onSelect={handleUpdateShopAddress}
                  />
                  {shopAddress && (
                    <div className="rounded-xl border border-carbon bg-white/5 p-4">
                      <div className="flex items-center gap-3 text-cream">
                        <Check className="h-5 w-5 text-rush-orange" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{t('Shop Address Set', 'Shop address don set!')}</span>
                          <span className="text-[10px] text-white/40 line-clamp-1">{shopAddress.address}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <h3 className="font-display text-xl font-extrabold text-cream">{t('Assigned Orders', 'Orders wey riders don carry')}</h3>
                <div className="space-y-4">
                  {orders.filter(o => o.rider_id).length === 0 ? (
                    <p className="text-sm text-white/20 italic">{t('No orders assigned to riders yet.', 'No rider don carry any load yet.')}</p>
                  ) : (
                    orders.filter(o => o.rider_id).map(order => (
                      <div key={order.id} className="rounded-2xl border border-carbon bg-white/5 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black text-rush-orange uppercase tracking-widest">{order.status}</span>
                          <span className="text-[10px] text-white/20">{new Date(order.created_at).toLocaleTimeString()}</span>
                        </div>
                        <h4 className="font-bold text-cream">{order.product_name}</h4>
                        <div className="mt-4 flex items-center gap-3 border-t border-carbon pt-4">
                          <div className="h-8 w-8 rounded-full bg-rush-orange/20 flex items-center justify-center">
                            <Navigation className="h-4 w-4 text-rush-orange" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-white/20 uppercase">Rider Assigned</p>
                            <p className="text-xs text-cream">Order on the way</p>
                          </div>
                        </div>
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
          center={mapCenter}
          markers={[
            ...(shopAddress ? [{ id: 'shop', position: { lat: shopAddress.lat, lng: shopAddress.lng }, title: 'My Shop', color: '#FF5C1A' }] : []),
            ...orders
              .filter(o => o.status !== 'completed' && o.rider_location)
              .map(o => ({
                id: `rider-${o.id}`,
                position: o.rider_location,
                title: 'Rider',
                color: '#34A853'
              }))
          ]}
        />
      </div>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-carbon bg-midnight/80 px-6 py-3 backdrop-blur-xl md:hidden">
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'shop' ? 'text-rush-orange' : 'text-white/20'
          }`}
        >
          <MapPin className="h-5 w-5" />
          <span className="text-[8px] font-bold uppercase tracking-widest">{t('SHOP', 'SHOP')}</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'orders' ? 'text-rush-orange' : 'text-white/20'
          }`}
        >
          <Package className="h-5 w-5" />
          <span className="text-[8px] font-bold uppercase tracking-widest">{t('ORDERS', 'LOAD')}</span>
        </button>
      </div>
    </div>
  );
}
