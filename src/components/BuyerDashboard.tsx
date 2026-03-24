import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { logActivity } from '../services/logger';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, ShoppingBag, Check, Clock, Package, Navigation, Volume2, Search, Loader2 } from 'lucide-react';
import LeafletMap from './Map';
import LocationSearch from './LocationSearch';

// Mock products for now
const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Jollof Rice & Chicken', price: 3500, seller_id: 'seller1', seller_name: 'Mama Put Express', shop_address: '123 Ikorodu Rd, Lagos' },
  { id: 'p2', name: 'Suya Platter (Large)', price: 5000, seller_id: 'seller2', seller_name: 'Suya Spot', shop_address: '45 Lekki Phase 1, Lagos' },
  { id: 'p3', name: 'Amala & Ewedu', price: 2500, seller_id: 'seller3', seller_name: 'Amala Sky', shop_address: '88 Ikeja, Lagos' },
];

export default function BuyerDashboard({ user }: { user: any }) {
  const [step, setStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [dropoff, setDropoff] = useState<{ lat: number, lng: number, address: string } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number }>({ lat: 6.5244, lng: 3.3792 });
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'orders'>('browse');
  const [isPidgin, setIsPidgin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (en: string, pid: string) => isPidgin ? pid : en;

  useEffect(() => {
    if (!user?.id) return;

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setOrders(data);
      if (error) console.error('Fetch orders error:', error);
    };

    fetchOrders();

    const channel = supabase
      .channel('buyer-orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `buyer_id=eq.${user.id}`
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const handlePlaceOrder = async () => {
    if (!selectedProduct || !dropoff) return;
    setLoading(true);
    try {
      const orderData = {
        buyer_id: user.id,
        seller_id: selectedProduct.seller_id,
        product_name: selectedProduct.name,
        pickup: { lat: 6.5244, lng: 3.3792, address: selectedProduct.shop_address }, // Mocked pickup for now
        dropoff,
        status: 'pending',
        fare: selectedProduct.price + 1000, // Mocked fare
        payment_method: 'cash',
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('orders').insert([orderData]).select().single();
      
      if (error) throw error;

      await logActivity('order_placed', { orderId: data.id, product: selectedProduct.name, fare: orderData.fare }, user.id);

      setStep(1);
      setSelectedProduct(null);
      setDropoff(null);
      setActiveTab('orders');
    } catch (err: any) {
      console.error('Order error:', err);
      setError(err.message || 'Failed to place order. Try again.');
      await logActivity('order_placement_failed', { product: selectedProduct.name, error: err.message }, user.id);
    } finally {
      setLoading(false);
    }
  };

  const confirmCollection = async (orderId: string) => {
    try {
      const { data: order } = await supabase.from('orders').select('rider_confirmed').eq('id', orderId).single();
      
      const updateData: any = { buyer_confirmed: true };
      if (order?.rider_confirmed) {
        updateData.status = 'completed';
      } else {
        updateData.status = 'collected';
      }

      const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
      if (error) throw error;

      await logActivity('order_confirmed_by_buyer', { orderId, status: updateData.status }, user.id);
    } catch (err: any) {
      console.error('Confirm error:', err);
      setError(err.message || 'Failed to confirm collection.');
      await logActivity('order_confirmation_failed_by_buyer', { orderId, error: err.message }, user.id);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-midnight md:flex-row">
      {/* Sidebar */}
      <div className="z-20 flex w-full flex-col border-b border-carbon bg-midnight/80 backdrop-blur-xl md:w-[400px] md:border-b-0 md:border-r">
        <div className="flex items-center justify-between border-b border-carbon p-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('browse')}
              className={`font-display text-xs font-bold tracking-widest uppercase transition-all ${
                activeTab === 'browse' ? 'text-rush-orange' : 'text-white/20 hover:text-white/40'
              }`}
            >
              {t('BROWSE', 'SHOP')}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`font-display text-xs font-bold tracking-widest uppercase transition-all ${
                activeTab === 'orders' ? 'text-rush-orange' : 'text-white/20 hover:text-white/40'
              }`}
            >
              {t('MY ORDERS', 'MY LOAD')}
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
            {activeTab === 'browse' && (
              <motion.div
                key="browse"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-xl font-extrabold text-cream">{t('What are you craving?', 'Wetin you wan chop?')}</h2>
                    <div className="grid gap-4">
                      {MOCK_PRODUCTS.map(product => (
                        <button
                          key={product.id}
                          onClick={() => {
                            setSelectedProduct(product);
                            setStep(2);
                          }}
                          className="group relative overflow-hidden rounded-2xl border border-carbon bg-white/5 p-4 text-left transition-all hover:border-rush-orange/50"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-cream">{product.name}</h3>
                              <p className="text-xs text-white/40">{product.seller_name}</p>
                            </div>
                            <span className="font-display text-lg font-black text-rush-orange">₦{product.price.toLocaleString()}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-rush-orange">
                      <MapPin className="h-5 w-5" />
                      <span className="text-xs font-bold tracking-widest uppercase">{t('Delivery Location', 'Where we go bring am?')}</span>
                    </div>
                    <LocationSearch 
                      placeholder={t('Enter your address...', 'Where you dey?')}
                      onSelect={(loc) => {
                        setDropoff(loc);
                        setMapCenter({ lat: loc.lat, lng: loc.lng });
                      }}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setStep(1)} className="flex-1 rounded-xl bg-carbon py-4 font-display text-sm font-bold text-white/40">BACK</button>
                      <button
                        disabled={!dropoff || loading}
                        onClick={handlePlaceOrder}
                        className="flex-[2] rounded-xl bg-rush-orange py-4 font-display text-sm font-bold text-midnight disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : t('ORDER NOW', 'ORDER AM')}
                      </button>
                    </div>
                  </div>
                )}
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
                <h2 className="font-display text-xl font-extrabold text-cream">{t('Active Orders', 'Your Load')}</h2>
                {orders.length === 0 ? (
                  <p className="text-sm text-white/20 italic">{t('No orders yet.', 'You never order anything.')}</p>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="rounded-2xl border border-carbon bg-white/5 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-rush-orange uppercase tracking-widest">{order.status}</span>
                        <span className="text-[10px] text-white/20">{new Date(order.created_at).toLocaleTimeString()}</span>
                      </div>
                      <h3 className="font-bold text-cream">{order.product_name}</h3>
                      <p className="text-xs text-white/40 mb-4">{order.dropoff.address}</p>
                      
                      {order.status === 'delivered' && !order.buyer_confirmed && (
                        <button
                          onClick={() => confirmCollection(order.id)}
                          className="w-full rounded-xl bg-green-500 py-2 text-xs font-bold text-white"
                        >
                          {t('CONFIRM COLLECTION', 'I DON COLLECT AM')}
                        </button>
                      )}
                      
                      {order.rider_id && (
                        <div className="mt-4 flex items-center gap-3 border-t border-carbon pt-4">
                          <div className="h-8 w-8 rounded-full bg-rush-orange/20 flex items-center justify-center">
                            <Navigation className="h-4 w-4 text-rush-orange" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-white/20 uppercase">Rider Assigned</p>
                            <p className="text-xs text-cream">Heading to you</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
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
            ...(dropoff ? [{ id: 'dropoff', position: { lat: dropoff.lat, lng: dropoff.lng }, title: 'My Location', color: '#FF5C1A' }] : []),
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
          onClick={() => setActiveTab('browse')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'browse' ? 'text-rush-orange' : 'text-white/20'
          }`}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-[8px] font-bold uppercase tracking-widest">{t('BROWSE', 'SHOP')}</span>
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
