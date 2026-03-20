import { useState } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, Phone, Check, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Auth({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'seller' | 'rider'>('seller');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingOPay, setVerifyingOPay] = useState(false);
  const [error, setError] = useState('');

  const formatPhoneNumber = (number: string) => {
    // Supabase requires E.164 format
    if (number.startsWith('0')) return '+234' + number.slice(1);
    if (!number.startsWith('+')) return '+234' + number;
    return number;
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) return setError('Enter your number first!');
    setLoading(true);
    setError('');
    try {
      const formattedNumber = formatPhoneNumber(phoneNumber);
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedNumber,
      });
      if (error) throw error;
      setOtpSent(true);
    } catch (err: any) {
      console.error('OTP Send Error:', err);
      setError(err.message || 'Failed to send OTP. Check your number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!verificationCode) return;
    setLoading(true);
    setError('');
    try {
      const formattedNumber = formatPhoneNumber(phoneNumber);
      const { data: { session }, error } = await supabase.auth.verifyOtp({
        phone: formattedNumber,
        token: verificationCode,
        type: 'sms',
      });
      
      if (error) throw error;
      if (!session?.user) throw new Error('No user session found');

      const user = session.user;

      // After OTP, we check for OPay
      setVerifyingOPay(true);
      
      // Simulate OPay API Check
      setTimeout(async () => {
        const isOPayUser = !user.phone?.endsWith('00');
        
        if (isOPayUser) {
          // Check if user profile exists in our custom table
          const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          // Simulate fetching OPay Profile Data
          const opayProfile = {
            fullName: 'Olawale ' + (role === 'seller' ? 'Bakare' : 'Chukwuma'),
            accountLevel: 'Tier 3',
            kycVerified: true,
            opayAccountNumber: user.phone?.replace('+', ''),
          };

          if (!userData) {
            const newUserData = {
              id: user.id,
              name: opayProfile.fullName,
              phone: user.phone || phoneNumber,
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
              .single();
            
            if (insertError) throw insertError;
            onAuthSuccess(insertedData);
          } else {
            // Update existing user
            const { data: updatedData, error: updateError } = await supabase
              .from('users')
              .update({ opay_data: opayProfile, name: opayProfile.fullName })
              .eq('id', user.id)
              .select()
              .single();
            
            if (updateError) throw updateError;
            onAuthSuccess(updatedData);
          }
        } else {
          setVerifyingOPay(false);
          setError('No OPay account found for this number.');
        }
      }, 2000);

    } catch (err: any) {
      console.error('OTP Verify Error:', err);
      setError(err.message || 'Invalid code. Try again.');
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
        <div className="mb-10 flex flex-col items-center gap-4">
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
        </div>

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
              <p className="mt-2 text-xs text-white/40">Checking if your number has an active OPay account...</p>
            </motion.div>
          ) : !otpSent ? (
            <motion.div
              key="phone-input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-carbon p-1">
                <button
                  onClick={() => setRole('seller')}
                  className={`rounded-lg py-3 font-display text-sm font-bold transition-all ${
                    role === 'seller' ? 'bg-rush-orange text-midnight' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  I'M A SELLER
                </button>
                <button
                  onClick={() => setRole('rider')}
                  className={`rounded-lg py-3 font-display text-sm font-bold transition-all ${
                    role === 'rider' ? 'bg-rush-orange text-midnight' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  I'M A RIDER
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Phone className="absolute top-4 left-4 h-5 w-5 text-white/20" />
                  <input
                    type="tel"
                    placeholder="Phone Number (e.g. 080...)"
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
                      SEND OTP <ArrowRight className="h-4 w-4" />
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
                <h2 className="text-sm font-bold text-cream uppercase tracking-widest">Verify Number</h2>
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
          By continuing, you agree to RushNG's Terms of Service and Privacy Policy. No password required — just your Google account.
        </p>
      </motion.div>
    </div>
  );
}
