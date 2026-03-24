import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ShoppingBag, 
  MessageSquare, 
  TrendingUp, 
  Search, 
  Trash2, 
  CheckCircle, 
  ChevronRight,
  Shield,
  Activity,
  Calendar,
  Filter
} from 'lucide-react';

interface AdminDashboardProps {
  user: any;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'orders' | 'feedback' | 'logs'>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [usersRes, ordersRes, feedbackRes, logsRes] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('feedback').select('*').order('created_at', { ascending: false }),
          supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100)
        ]);

        if (usersRes.data) setUsers(usersRes.data);
        if (ordersRes.data) setOrders(ordersRes.data);
        if (feedbackRes.data) setFeedback(feedbackRes.data);
        if (logsRes.data) setLogs(logsRes.data);
      } catch (error) {
        console.error('Fetch admin data error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();

    // Set up real-time subscriptions
    const usersSub = supabase.channel('users-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
      if (payload.eventType === 'INSERT') setUsers(prev => [...prev, payload.new]);
      if (payload.eventType === 'UPDATE') setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new : u));
      if (payload.eventType === 'DELETE') setUsers(prev => prev.filter(u => u.id === payload.old.id));
    }).subscribe();

    const ordersSub = supabase.channel('orders-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      if (payload.eventType === 'INSERT') setOrders(prev => [payload.new, ...prev]);
      if (payload.eventType === 'UPDATE') setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
      if (payload.eventType === 'DELETE') setOrders(prev => prev.filter(o => o.id === payload.old.id));
    }).subscribe();

    const feedbackSub = supabase.channel('feedback-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, (payload) => {
      if (payload.eventType === 'INSERT') setFeedback(prev => [payload.new, ...prev]);
      if (payload.eventType === 'DELETE') setFeedback(prev => prev.filter(f => f.id === payload.old.id));
    }).subscribe();

    const logsSub = supabase.channel('logs-changes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
      setLogs(prev => [payload.new, ...prev].slice(0, 100));
    }).subscribe();

    return () => {
      supabase.removeChannel(usersSub);
      supabase.removeChannel(ordersSub);
      supabase.removeChannel(feedbackSub);
      supabase.removeChannel(logsSub);
    };
  }, []);

  const handleDeleteFeedback = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        const { error } = await supabase.from('feedback').delete().eq('id', id);
        if (error) throw error;
        setFeedback(prev => prev.filter(f => f.id !== id));
      } catch (error) {
        console.error('Delete feedback error:', error);
      }
    }
  };

  const stats = {
    totalUsers: users.length,
    totalOrders: orders.length,
    pendingFeedback: feedback.length,
    activeRiders: users.filter(u => u.role === 'rider' && u.status === 'online').length
  };

  return (
    <div className="flex h-full flex-col bg-midnight">
      {/* Sidebar / Tabs */}
      <div className="flex border-b border-carbon bg-midnight/50 px-6 overflow-x-auto scrollbar-hide">
        <TabButton 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')} 
          icon={<TrendingUp className="h-4 w-4" />} 
          label="Overview" 
        />
        <TabButton 
          active={activeTab === 'users'} 
          onClick={() => setActiveTab('users')} 
          icon={<Users className="h-4 w-4" />} 
          label="Users" 
        />
        <TabButton 
          active={activeTab === 'orders'} 
          onClick={() => setActiveTab('orders')} 
          icon={<ShoppingBag className="h-4 w-4" />} 
          label="Orders" 
        />
        <TabButton 
          active={activeTab === 'feedback'} 
          onClick={() => setActiveTab('feedback')} 
          icon={<MessageSquare className="h-4 w-4" />} 
          label="Feedback" 
          badge={feedback.length > 0 ? feedback.length : undefined}
        />
        <TabButton 
          active={activeTab === 'logs'} 
          onClick={() => setActiveTab('logs')} 
          icon={<Activity className="h-4 w-4" />} 
          label="Activity Logs" 
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<Users className="text-blue-400" />} label="Total Users" value={stats.totalUsers} />
                <StatCard icon={<ShoppingBag className="text-rush-orange" />} label="Total Orders" value={stats.totalOrders} />
                <StatCard icon={<MessageSquare className="text-lagos-gold" />} label="Feedback" value={stats.pendingFeedback} />
                <StatCard icon={<Shield className="text-green-400" />} label="Active Riders" value={stats.activeRiders} />
              </div>

              {/* Recent Activity */}
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="rounded-3xl border border-carbon bg-white/5 p-6">
                  <h3 className="mb-6 font-display text-lg font-bold uppercase tracking-widest">Recent Orders</h3>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between rounded-2xl bg-carbon/50 p-4">
                        <div className="flex items-center gap-4">
                          <div className="rounded-full bg-rush-orange/10 p-2">
                            <ShoppingBag className="h-4 w-4 text-rush-orange" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-cream">{order.product_name}</div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest">{order.status}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-rush-orange">₦{order.fare}</div>
                          <div className="text-[10px] text-white/40">{new Date(order.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-carbon bg-white/5 p-6">
                  <h3 className="mb-6 font-display text-lg font-bold uppercase tracking-widest">Latest Feedback</h3>
                  <div className="space-y-4">
                    {feedback.slice(0, 5).map(item => (
                      <div key={item.id} className="rounded-2xl bg-carbon/50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-bold text-cream">{item.name}</div>
                          <div className="text-[10px] text-white/40">{new Date(item.created_at).toLocaleDateString()}</div>
                        </div>
                        <p className="text-xs text-white/60 line-clamp-2">{item.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight">User Management</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      className="rounded-xl border border-carbon bg-white/5 py-2 pl-10 pr-4 text-xs text-cream focus:border-rush-orange focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-carbon bg-white/5">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-carbon bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-carbon">
                    {users.map(u => (
                      <tr key={u.id} className="text-sm hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-cream">{u.name}</div>
                          <div className="text-[10px] text-white/40 font-mono">{u.id.slice(0, 8)}...</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${
                            u.role === 'admin' ? 'bg-red-500/10 text-red-500' :
                            u.role === 'rider' ? 'bg-lagos-gold/10 text-lagos-gold' :
                            u.role === 'seller' ? 'bg-rush-orange/10 text-rush-orange' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/60">{u.phone}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${u.status === 'online' ? 'bg-green-500' : 'bg-white/10'}`} />
                            <span className="text-xs text-white/40 capitalize">{u.status || 'offline'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button className="rounded-lg p-2 text-white/20 hover:bg-white/5 hover:text-white">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="font-display text-2xl font-black uppercase tracking-tight mb-6">Order Management</h2>
              <div className="overflow-hidden rounded-3xl border border-carbon bg-white/5">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-carbon bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Fare</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-carbon">
                    {orders.map(o => (
                      <tr key={o.id} className="text-sm hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-white/40">{o.id.slice(0, 8)}...</td>
                        <td className="px-6 py-4 font-bold text-cream">{o.product_name}</td>
                        <td className="px-6 py-4 text-rush-orange font-bold">₦{o.fare}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${
                            o.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                            o.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                            'bg-rush-orange/10 text-rush-orange'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/40">{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="font-display text-2xl font-black uppercase tracking-tight">Feedback & Complaints</h2>
              
              <div className="grid gap-4">
                {feedback.map(item => (
                  <div key={item.id} className="group relative rounded-3xl border border-carbon bg-white/5 p-6 transition-all hover:border-rush-orange/30">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-white/5 p-3">
                          <MessageSquare className="h-5 w-5 text-white/40" />
                        </div>
                        <div>
                          <div className="font-bold text-cream">{item.name}</div>
                          <div className="text-[10px] text-white/40">{item.phone}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[10px] font-black uppercase tracking-widest text-white/20">Received</div>
                          <div className="text-xs text-white/40">{new Date(item.created_at).toLocaleString()}</div>
                        </div>
                        <button 
                          onClick={() => handleDeleteFeedback(item.id)}
                          className="rounded-xl bg-red-500/10 p-3 text-red-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-6 rounded-2xl bg-black/20 p-4 text-sm leading-relaxed text-white/60">
                      {item.message}
                    </div>
                  </div>
                ))}
                {feedback.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 rounded-full bg-white/5 p-6">
                      <CheckCircle className="h-12 w-12 text-white/10" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-white/20">NO FEEDBACK YET</h3>
                    <p className="mt-2 text-sm text-white/10 italic">Everything dey soft!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight">System Activity Logs</h2>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 rounded-xl border border-carbon bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">
                    <Filter className="h-3 w-3" /> Filter
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {logs.map(log => (
                  <div key={log.id} className="group relative overflow-hidden rounded-2xl border border-carbon bg-white/5 p-4 transition-all hover:border-rush-orange/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`rounded-full p-2 ${
                          log.action.includes('failed') || log.action.includes('denied') || log.action.includes('error')
                            ? 'bg-red-500/10 text-red-500'
                            : log.action.includes('success') || log.action.includes('verified')
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-cream uppercase tracking-wider">{log.action.replace(/_/g, ' ')}</div>
                          <div className="flex items-center gap-2 text-[10px] text-white/40">
                            <Calendar className="h-3 w-3" />
                            {new Date(log.created_at).toLocaleString()}
                            {log.user_id && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-white/10" />
                                <span className="font-mono">UID: {log.user_id.slice(0, 8)}...</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-3 rounded-xl bg-black/20 p-3">
                        <pre className="text-[10px] font-mono text-white/60 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 rounded-full bg-white/5 p-6">
                      <Activity className="h-12 w-12 text-white/10" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-white/20">NO LOGS FOUND</h3>
                    <p className="mt-2 text-sm text-white/10 italic">System is quiet...</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: any, label: string, badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 border-b-2 px-6 py-4 transition-all ${
        active 
          ? 'border-rush-orange text-rush-orange' 
          : 'border-transparent text-white/40 hover:text-white/60'
      }`}
    >
      {icon}
      <span className="text-xs font-black uppercase tracking-widest">{label}</span>
      {badge !== undefined && (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rush-orange text-[10px] font-black text-midnight">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ icon, label, value }: { icon: any, label: string, value: number }) {
  return (
    <div className="rounded-3xl border border-carbon bg-white/5 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-xl bg-white/5 p-3">{icon}</div>
        <TrendingUp className="h-4 w-4 text-white/10" />
      </div>
      <div className="text-2xl font-black text-cream">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</div>
    </div>
  );
}
