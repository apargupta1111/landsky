import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function Login() {
  const login = useAppStore((s) => s.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [shake, setShake]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate a tiny network delay for UX
    await new Promise((r) => setTimeout(r, 600));

    const ok = login(username.trim(), password);
    setLoading(false);

    if (!ok) {
      setError('Invalid credentials. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-color)]">
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
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-panel rounded-2xl border glowing-border p-8 md:p-10 shadow-2xl dark:shadow-[0_0_60px_rgba(0,229,255,0.08)]">

          {/* Logo + title */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,229,255,0.15)] p-2 overflow-hidden"
            >
              <img src="/favicon.svg" alt="Landsky Logo" className="w-10 h-10 object-contain" />
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-wide text-glow">LANDSKY</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Smart Street Lighting Platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] focus:border-primary focus:outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] focus:border-primary focus:outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-colors"
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

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-error text-sm bg-error/10 border border-error/30 rounded-xl px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Authenticating…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Footer hint */}
          <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
            Secured · LoRaWAN Smart Lighting Control
          </p>
        </div>
      </motion.div>
    </div>
  );
}
