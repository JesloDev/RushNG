import React, { useState } from 'react';
import { supabase } from '../supabase';
import { logActivity } from '../services/logger';
import { motion } from 'motion/react';
import { Shield, Lock, Mail, ArrowRight, ArrowUpRight } from 'lucide-react';

export default function AdminAuth({ onAuthSuccess, onLogoClick }: { onAuthSuccess: (user: any) => void, onLogoClick: () => void }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return setError('Supabase not configured.');
    if (!email || !password) return setError('Enter email and password!');
    
    setLoading(true);
    setError('');
    
    // Safety timeout to prevent indefinite loading
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
      setError('Login timed out. Please try again.');
    }, 10000);

    try {
      const developerEmail = 'ojaomojesuloluwa@gmail.com';
      const magicPassword = 'admin-bypass-123'; // Magic password for developer
      
      let sessionUser: any = null;
      let userData: any = null;

      if (email === developerEmail && password === magicPassword) {
        console.log('Using Magic Password bypass for developer...');
        // Try to get existing session or mock it
        const { data: { session } } = await supabase.auth.getSession();
        sessionUser = session?.user || { 
          id: '00000000-0000-0000-0000-000000000000', 
          email: developerEmail 
        };
        
        // Pre-set userData for developer to ensure access even if DB fetch fails
        userData = {
          id: sessionUser.id,
          name: 'System Admin',
          role: 'admin',
          status: 'online',
          created_at: new Date().toISOString()
        };
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (!data.user) throw new Error('No user found');
        sessionUser = data.user;

        // Check if user is actually an admin in the users table
        const { data: dbUserData, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle();
        
        userData = dbUserData;
      }

      // Sync developer data to DB if possible, but don't block on failure
      if (sessionUser.email === developerEmail) {
        const adminData = {
          id: sessionUser.id,
          name: 'System Admin',
          role: 'admin',
          status: 'online',
          created_at: new Date().toISOString()
        };
        
        supabase.from('users').upsert(adminData).then(({ error }) => {
          if (error) console.warn('Background Admin Bootstrap failed:', error);
        });
      }

      if (!userData || userData.role !== 'admin') {
        // If not an admin in DB, sign them out and show error
        await supabase.auth.signOut();
        await logActivity('admin_login_denied', { email, userId: sessionUser.id }, sessionUser.id);
        throw new Error('Access denied. Admin privileges required.');
      }

      clearTimeout(safetyTimeout);
      await logActivity('admin_login_success', { email, userId: sessionUser.id }, sessionUser.id);
      onAuthSuccess(userData);
    } catch (err: any) {
      clearTimeout(safetyTimeout);
      console.error('Admin Login Error:', err);
      setError(err.message || 'Login failed. Check credentials.');
      await logActivity('admin_login_failed', { email, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-midnight px-6">
      <div className="noise-bg absolute inset-0 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-carbon bg-white/5 p-10 backdrop-blur-xl"
      >
        <button 
          onClick={onLogoClick}
          className="mb-10 flex w-full flex-col items-center gap-4 transition-transform hover:scale-105 active:scale-95"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rush-orange font-display text-3xl font-extrabold text-midnight tracking-tighter">
            R<ArrowUpRight className="h-6 w-6 -ml-1" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-4xl font-extrabold tracking-tighter text-cream">
              Rush<span className="text-rush-orange">NG</span>
            </h1>
            <p className="mt-2 text-sm font-bold text-rush-orange uppercase tracking-widest">
              ADMIN PORTAL
            </p>
          </div>
        </button>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute top-4 left-4 h-5 w-5 text-white/20" />
              <input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-carbon bg-white/5 py-4 pr-4 pl-12 text-sm text-cream placeholder:text-white/20 focus:border-rush-orange focus:outline-none"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute top-4 left-4 h-5 w-5 text-white/20" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-carbon bg-white/5 py-4 pr-4 pl-12 text-sm text-cream placeholder:text-white/20 focus:border-rush-orange focus:outline-none"
                required
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
              <p className="text-xs font-bold text-red-500 uppercase tracking-widest">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-rush-orange py-4 font-display text-sm font-bold tracking-wider text-midnight transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-midnight border-t-transparent" />
            ) : (
              <>
                SECURE LOGIN <Shield className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
          Authorized Personnel Only
        </p>
      </motion.div>
    </div>
  );
}
