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

    const role = form.registration_type === 'installer' ? 'installer' : 'user';
    const parent_email = form.registration_type === 'new_client' ? '' : form.parent_email;

    const ok = await register({ ...form, role, parent_email });
    setLoading(false);

    if (ok) {
      setSuccess(true);
    } else {
      setError('Registration failed. Email may already be in use, or invalid data.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
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
      {/* ── Background glows ── */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-secondary/10 dark:bg-secondary/15 rounded-full blur-[150px] pointer-events-none" />

      {/* ── Animated grid lines ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(var(--accent-primary) 1px, transparent 1px), linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Card ── */}
      <motion.div
        animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg mx-4"
      >
        <div className="glass-panel rounded-2xl border glowing-border p-8 shadow-2xl dark:shadow-[0_0_60px_rgba(0,229,255,0.08)]">

          {/* Title */}
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-2xl font-bold tracking-wide text-glow">CREATE ACCOUNT</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Join the Smart Street Lighting Platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

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

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-error text-sm bg-error/10 border border-error/30 rounded-xl px-4 py-3 mt-4"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-6 rounded-xl bg-primary text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Creating Account…
                </>
              ) : 'Sign Up'}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Already have an account?{' '}
            <button onClick={onGoToLogin} type="button" className="text-primary font-bold hover:underline">
              Sign In
            </button>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}
