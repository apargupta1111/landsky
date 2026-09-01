import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, User, AlertCircle, Mail, Phone, UserCircle} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function Register({ onGoToLogin }: { onGoToLogin: () => void }) {
  const register = useAppStore((s) => s.register);

  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    registration_type: 'new_client', // new_client, sub_user, installer
    parent_email: ''
  });

  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [shake, setShake]       = useState(false);
  const [success, setSuccess]   = useState(false);

  // OTP Flow states
  const [step, setStep]         = useState<1 | 2>(1);
  const [otp, setOtp]           = useState('');
  const [otpError, setOtpError] = useState('');
  
  const SERVER_IP = import.meta.env.VITE_SERVER_IP || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5001` : 'http://localhost:5001');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    // Optional artificial delay for animation
    await new Promise((r) => setTimeout(r, 600));

    // Simple email validation
    if (!form.email.includes('@')) {
      setError('Please enter a valid email address.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${SERVER_IP}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setLoading(true);

    try {
      const verifyRes = await fetch(`${SERVER_IP}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Invalid OTP');
      }

      // OTP verified, now register
      const role = form.registration_type === 'installer' ? 'installer' : 'user';
      const parent_email = form.registration_type === 'new_client' ? '' : form.parent_email;

      const ok = await register({ ...form, role, parent_email });
      if (ok) {
        setSuccess(true);
      } else {
        setOtpError('Registration failed during final step.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-color)] py-12">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-md mx-4">
          <div className="glass-panel rounded-2xl border glowing-border p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-wide text-glow mb-4">Request Sent!</h1>
            <p className="text-[var(--text-secondary)] mb-8">
              {form.registration_type === 'new_client' 
                ? 'Your registration has been sent to our Superadmins for approval. You will be notified once activated.'
                : 'Your request has been sent to the Primary Client for approval. You can log in once they approve it.'}
            </p>
            <button
              onClick={onGoToLogin}
              className="px-8 py-3 rounded-xl bg-primary text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all"
            >
              Return to Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-color)] py-12">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full max-w-md mx-4"
          >
            <div className="glass-panel rounded-2xl border glowing-border p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="text-center mb-8 relative">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-wide text-glow mb-2">Create Account</h2>
                <p className="text-sm text-[var(--text-secondary)]">Join the LandSky SmartLight network</p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3 text-error text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 relative">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">First Name</label>
                    <input
                      name="first_name"
                      type="text"
                      value={form.first_name}
                      onChange={handleChange}
                      placeholder="First Name"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] focus:border-primary focus:outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Last Name</label>
                    <input
                      name="last_name"
                      type="text"
                      value={form.last_name}
                      onChange={handleChange}
                      placeholder="Last Name"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] focus:border-primary focus:outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      required
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] focus:border-primary focus:outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                      <input
                        name="username"
                        type="text"
                        value={form.username}
                        onChange={handleChange}
                        placeholder="johndoe"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] focus:border-primary focus:outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                      <input
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+1234567890"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] focus:border-primary focus:outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input
                      name="password"
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      required
                      className="w-full pl-11 pr-12 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] focus:border-primary focus:outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-primary transition-colors"
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Account Type</label>
                  <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                    <select
                      name="registration_type"
                      value={form.registration_type}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] focus:border-primary focus:outline-none text-sm text-[var(--text-primary)] appearance-none transition-colors"
                    >
                      <option value="new_client" className="bg-[var(--bg-color)]">New Client Organization</option>
                      <option value="sub_user" className="bg-[var(--bg-color)]">Join Existing Client Team</option>
                      <option value="installer" className="bg-[var(--bg-color)]">Installer</option>
                    </select>
                  </div>
                </div>

                <AnimatePresence>
                  {form.registration_type !== 'new_client' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2 text-warning">
                        Primary Client Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warning" />
                        <input
                          name="parent_email"
                          type="email"
                          value={form.parent_email}
                          onChange={handleChange}
                          placeholder="client@example.com"
                          required
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-warning/5 border border-warning/30 focus:border-warning focus:outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-colors"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full py-3.5 rounded-xl bg-primary text-white font-bold tracking-wide shadow-[0_0_20px_rgba(0,229,255,0.2)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all flex justify-center items-center gap-2 mt-6"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Continue'}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-[var(--text-secondary)] text-sm">
                  Already have an account?{' '}
                  <button type="button" onClick={onGoToLogin} className="text-primary hover:text-white transition-colors font-semibold">
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full max-w-md mx-4"
          >
            <div className="glass-panel rounded-2xl border glowing-border p-8 shadow-2xl relative overflow-hidden">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-wide text-glow mb-2">Verify Email</h2>
                <p className="text-sm text-[var(--text-secondary)]">We've sent a 6-digit code to <br/><span className="text-white font-bold">{form.email}</span></p>
              </div>

              {otpError && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3 text-error text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{otpError}</p>
                </motion.div>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                    One-Time Password
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full bg-black/20 dark:bg-white/5 border border-[var(--panel-border)] rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-primary transition-all font-mono"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  whileHover={{ scale: (loading || otp.length !== 6) ? 1 : 1.02 }}
                  whileTap={{ scale: (loading || otp.length !== 6) ? 1 : 0.98 }}
                  className="w-full py-3.5 rounded-xl bg-primary text-white font-bold tracking-wide shadow-[0_0_20px_rgba(0,229,255,0.2)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify & Register'}
                </motion.button>

                <div className="text-center">
                  <button type="button" onClick={() => setStep(1)} className="text-[var(--text-secondary)] hover:text-white transition-colors text-sm">
                    Back to edit details
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
