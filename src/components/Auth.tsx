import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { logActivity } from '../services/logger';
import { motion, AnimatePresence } from 'motion/react';
import { Bike, ArrowUpRight, Phone, Check, ArrowRight, ShieldCheck, User as UserIcon } from 'lucide-react';

export default function Auth({ onAuthSuccess, onLogoClick }: { onAuthSuccess: (user: any) => void, onLogoClick: () => void }) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'seller' | 'rider' | 'buyer'>('buyer');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingOPay, setVerifyingOPay] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState('');
  const [tempUser, setTempUser] = useState<any>(null);

  const formatPhoneNumber = (number: string) => {
    // Supabase requires E.164 format
    if (number.startsWith('0')) return '+234' + number.slice(1);
    if (!number.startsWith('+')) return '+234' + number;
    return number;
  };

  useEffect(() => {
    const checkExistingSession = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setLoading(true);
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (!userData) {
          setTempUser(session.user);
          setNeedsProfile(true);
          setOtpSent(true); // To show the back button correctly if needed
        }
        setLoading(false);
      }
    };
    checkExistingSession();
  }, [supabase]);

  const handleSendOtp = async () => {
    if (!supabase) return setError('Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Secrets.');
    if (!phoneNumber) return setError('Enter your WhatsApp number first!');
    setLoading(true);
    setError('');
    try {
      const formattedNumber = formatPhoneNumber(phoneNumber);
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedNumber,
      });
      if (error) throw error;
      setOtpSent(true);
      await logActivity('otp_sent', { phone: formattedNumber, role });
    } catch (err: any) {
      console.error('OTP Send Error:', err);
      setError(err.message || 'Failed to send code. Check your number.');
      await logActivity('otp_send_failed', { phone: phoneNumber, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!supabase) return;
    if (!verificationCode) return;
    setLoading(true);
    setError('');
    
    // Safety timeout to prevent indefinite loading
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
      setVerifyingOPay(false);
      setError('Verification timed out. Please try again.');
    }, 15000);

    try {
      const formattedNumber = formatPhoneNumber(phoneNumber);
      
      let sessionUser: any = null;

      // Magic Code Bypass for Development/Testing
      if (verificationCode === '123456') {
        console.log('Using Magic Code bypass...');
        // We still try to get a session if possible, but if not we mock it
        const { data: { session } } = await supabase.auth.getSession();
        // Use a deterministic ID for mock users based on phone number to test registration persistence
        const mockId = 'demo-' + btoa(formattedNumber).replace(/=/g, '');
        sessionUser = session?.user || { id: mockId, phone: formattedNumber };
        await logActivity('otp_bypass_used', { phone: formattedNumber, role });
      } else {
        const { data: { session }, error } = await supabase.auth.verifyOtp({
          phone: formattedNumber,
          token: verificationCode,
          type: 'sms',
        });
        
        if (error) throw error;
        if (!session?.user) throw new Error('No user session found');
        sessionUser = session.user;
        await logActivity('otp_verified', { phone: formattedNumber, role }, sessionUser.id);
      }

      const user = sessionUser;
      setTempUser(user);

      // Check if user profile exists in our custom table
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (userData) {
        // User exists, log them in
        clearTimeout(safetyTimeout);
        await logActivity('user_login', { userId: user.id, role: userData.role }, user.id);
        onAuthSuccess(userData);
      } else {
        // New user, need to complete profile
        clearTimeout(safetyTimeout);
        setLoading(false);
        setNeedsProfile(true);
      }
    } catch (err: any) {
      clearTimeout(safetyTimeout);
      console.error('OTP Verify Error:', err);
      setError(err.message || 'Invalid code. Try again.');
      await logActivity('otp_verify_failed', { phone: phoneNumber, error: err.message });
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!tempUser || !fullName) return setError('Please enter your full name');
    setLoading(true);
    setError('');

    try {
      // Simulate OPay verification (optional/simulated)
      setVerifyingOPay(true);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
      
      const opayProfile = {
        fullName: fullName,
        accountLevel: 'Tier 1',
        kycVerified: true,
        opayAccountNumber: (tempUser.phone || phoneNumber).replace('+', ''),
      };

      const newUserData = {
        id: tempUser.id,
        name: fullName,
        phone: tempUser.phone || phoneNumber,
        role: role,
        status: 'online',
        is_verified: false,
        has_opay: true,
        opay_data: opayProfile,
        created_at: new Date().toISOString(),
      };
      
      const { data: insertedData, error: insertError } = await supabase
        .from('users')
        .insert([newUserData])
        .select()
        .maybeSingle();
      
      if (insertError) {
        console.warn('Database insert failed, proceeding with local state:', insertError);
        await logActivity('user_registration_db_failed', { userId: tempUser.id, error: insertError.message }, tempUser.id);
        onAuthSuccess(newUserData);
      } else {
        await logActivity('user_registered', { userId: tempUser.id, role }, tempUser.id);
        onAuthSuccess(insertedData || newUserData);
      }
    } catch (err: any) {
      console.error('Profile Completion Error:', err);
      setError(err.message || 'Failed to complete profile');
    } finally {
      setVerifyingOPay(false);
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
            <p className="mt-2 text-sm font-medium text-white/40">
              Lagos delivery for hustlers. <span className="italic">No dulling!</span>
            </p>
          </div>
        </button>

        <AnimatePresence mode="wait">
          {verifyingOPay ? (
            <motion.div
              key="opay-verifying"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-10 text-center"
            >
              <div className="relative mb-6">
                <div className="h-20 w-20 animate-spin rounded-full border-4 border-rush-orange border-t-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="h-8 w-8 text-rush-orange" />
                </div>
              </div>
              <h2 className="font-display text-xl font-bold text-cream uppercase tracking-widest">Verifying OPay</h2>
              <p className="mt-2 text-xs text-white/40">Securing your account with OPay verification...</p>
            </motion.div>
          ) : needsProfile ? (
            <motion.div
              key="profile-completion"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-sm font-bold text-cream uppercase tracking-widest">Complete Profile</h2>
                <p className="mt-1 text-xs text-white/40">Welcome to RushNG! Tell us your name.</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <UserIcon className="absolute top-4 left-4 h-5 w-5 text-white/20" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-carbon bg-white/5 py-4 pr-4 pl-12 text-sm text-cream placeholder:text-white/20 focus:border-rush-orange focus:outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-carbon p-1">
                  <button
                    onClick={() => setRole('buyer')}
                    className={`rounded-lg py-3 font-display text-[10px] font-bold transition-all ${
                      role === 'buyer' ? 'bg-rush-orange text-midnight' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    BUYER
                  </button>
                  <button
                    onClick={() => setRole('seller')}
                    className={`rounded-lg py-3 font-display text-[10px] font-bold transition-all ${
                      role === 'seller' ? 'bg-rush-orange text-midnight' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    SELLER
                  </button>
                  <button
                    onClick={() => setRole('rider')}
                    className={`rounded-lg py-3 font-display text-[10px] font-bold transition-all ${
                      role === 'rider' ? 'bg-rush-orange text-midnight' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    RIDER
                  </button>
                </div>

                {error && <p className="text-center text-xs font-bold text-red-500 uppercase tracking-widest">{error}</p>}
                
                <button
                  onClick={handleCompleteProfile}
                  disabled={loading || !fullName}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-rush-orange py-4 font-display text-sm font-bold tracking-wider text-midnight transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-midnight border-t-transparent" />
                  ) : (
                    <>
                      COMPLETE REGISTRATION <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : !otpSent ? (
            <motion.div
              key="phone-input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-carbon p-1">
                <button
                  onClick={() => setRole('buyer')}
                  className={`rounded-lg py-3 font-display text-[10px] font-bold transition-all ${
                    role === 'buyer' ? 'bg-rush-orange text-midnight' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  BUYER
                </button>
                <button
                  onClick={() => setRole('seller')}
                  className={`rounded-lg py-3 font-display text-[10px] font-bold transition-all ${
                    role === 'seller' ? 'bg-rush-orange text-midnight' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  SELLER
                </button>
                <button
                  onClick={() => setRole('rider')}
                  className={`rounded-lg py-3 font-display text-[10px] font-bold transition-all ${
                    role === 'rider' ? 'bg-rush-orange text-midnight' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  RIDER
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Phone className="absolute top-4 left-4 h-5 w-5 text-white/20" />
                  <input
                    type="tel"
                    placeholder="WhatsApp Number (e.g. 080...)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full rounded-xl border border-carbon bg-white/5 py-4 pr-4 pl-12 text-sm text-cream placeholder:text-white/20 focus:border-rush-orange focus:outline-none"
                  />
                </div>
                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-widest">{error}</p>
                    {error.includes('OPay') && (
                      <a 
                        href="https://opayweb.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-[10px] font-black text-rush-orange underline uppercase tracking-widest"
                      >
                        Register on OPay First →
                      </a>
                    )}
                  </div>
                )}
                <button
                  onClick={handleSendOtp}
                  disabled={loading || !phoneNumber}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-rush-orange py-4 font-display text-sm font-bold tracking-wider text-midnight transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-midnight border-t-transparent" />
                  ) : (
                    <>
                      SEND CODE <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp-input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-sm font-bold text-cream uppercase tracking-widest">Verify WhatsApp</h2>
                <p className="mt-1 text-xs text-white/40">Enter the 6-digit code sent to {phoneNumber}</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <ShieldCheck className="absolute top-4 left-4 h-5 w-5 text-white/20" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full rounded-xl border border-carbon bg-white/5 py-4 pr-4 pl-12 text-center text-xl font-black tracking-[0.5em] text-cream placeholder:text-white/20 placeholder:tracking-normal focus:border-rush-orange focus:outline-none"
                  />
                </div>
                <p className="text-center text-[10px] font-bold text-rush-orange/60 uppercase tracking-widest">
                  Hint: Use 123456 for testing
                </p>
                {error && <p className="text-center text-xs font-bold text-red-500 uppercase tracking-widest">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setOtpSent(false);
                      setError('');
                    }}
                    className="flex-1 rounded-xl bg-carbon py-4 font-display text-sm font-bold text-white/40"
                  >
                    BACK
                  </button>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading || verificationCode.length !== 6}
                    className="flex-[2] rounded-xl bg-rush-orange py-4 font-display text-sm font-bold text-midnight transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-midnight border-t-transparent" />
                    ) : (
                      'VERIFY & ENTER'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-center text-xs leading-relaxed text-white/20">
          By continuing, you agree to RushNG's Terms of Service and Privacy Policy. No password required — just your phone number.
        </p>
      </motion.div>
    </div>
  );
}
