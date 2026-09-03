import { useState } from 'react';
import {
  Sun, User, Lock, Trash2,
  Save, AlertTriangle, CheckCircle, Bell, Shield,
  Clock, Send
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AddLightModal } from '../components/AddLightModal';

const SERVER_IP = import.meta.env.VITE_SERVER_IP || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5001` : 'http://localhost:5001');
import { fetchWithAuth } from '../utils/api';


function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-xl border p-5 md:p-6 glowing-border">
      <div className="flex items-center gap-2 mb-5 text-primary">
        {icon}
        <h3 className="font-bold text-base">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--panel-border)] last:border-0">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {sub && <div className="text-xs text-[var(--text-secondary)] mt-0.5">{sub}</div>}
      </div>
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-black/20 dark:bg-white/20'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-[var(--panel-border)] last:border-0 text-sm">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="font-mono font-bold text-xs bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg border border-[var(--panel-border)]">{value}</span>
    </div>
  );
}

export function Settings() {
  const { isDarkMode, toggleTheme, username, logout, clearTelemetryHistory } = useAppStore();
  const [addLightOpen, setAddLightOpen]   = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh,   setAutoRefresh]   = useState(true);
  const [saved,         setSaved]         = useState(false);
  const [confirmReset,  setConfirmReset]  = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{type: 'error' | 'success', msg: string} | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile update state
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState(username || '');
  const [profileStatus, setProfileStatus] = useState<{type: 'error' | 'success', msg: string} | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ type: 'error', msg: 'Please fill in all password fields' });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', msg: 'New passwords do not match' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetchWithAuth(`${SERVER_IP}/api/users/me/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      
      setPasswordStatus({ type: 'success', msg: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordStatus({ type: 'error', msg: err.message });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus(null);
    
    if (!newUsername && !newEmail) {
      setProfileStatus({ type: 'error', msg: 'Please provide a username or email to update' });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const body: any = {};
      if (newUsername) body.username = newUsername;
      if (newEmail) body.email = newEmail;

      const res = await fetchWithAuth(`${SERVER_IP}/api/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      
      setProfileStatus({ type: 'success', msg: 'Profile updated successfully! (Note: You may need to log out and log back in to see all changes)' });
    } catch (err: any) {
      setProfileStatus({ type: 'error', msg: err.message });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleHistoryClear = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    clearTelemetryHistory();
    setConfirmReset(false);
  };

  const [delayValue, setDelayValue] = useState<number>(20);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleBroadcastDelay = async () => {
    if (delayValue < 20) {
      alert("Minimum delay allowed is 20 seconds.");
      return;
    }

    if (!window.confirm(`Are you sure you want to broadcast a ${delayValue} second delay to ALL lights?`)) {
      return;
    }

    setIsBroadcasting(true);
    try {
      const res = await fetchWithAuth(`${SERVER_IP}/smartlight/set-delay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delaySeconds: delayValue })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to broadcast delay');
      
      alert(data.message || 'Broadcast initiated successfully!');
    } catch (err: any) {
      alert(`Error broadcasting delay: ${err.message}`);
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Manage your account, devices, and platform preferences</p>
      </div>

      {/* ── Appearance ─────────────────────────────────────────────────────── */}
      <SectionCard title="Appearance" icon={<Sun className="w-5 h-5" />}>
        <ToggleRow
          label="Dark Mode"
          sub="Switch between dark and light interface themes"
          value={isDarkMode}
          onChange={toggleTheme}
        />
       
        <ToggleRow
          label="Alert Notifications"
          sub="Show alert badges in the topbar"
          value={notifications}
          onChange={() => setNotifications((v) => !v)}
        />
      </SectionCard>

      {/* ── Account ────────────────────────────────────────────────────────── */}
      <SectionCard title="Account" icon={<User className="w-5 h-5" />}>
        <div className="flex items-center gap-4 p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--panel-border)] mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center font-bold text-primary text-lg">
            {username?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
          <div>
            <div className="font-bold">{username || 'admin123'}</div>
            <div className="text-xs text-[var(--text-secondary)]">System Administrator</div>
          </div>
          <span className="ml-auto px-2 py-1 text-xs font-bold bg-primary/10 text-primary border border-primary/30 rounded-full flex items-center gap-1">
            <Shield className="w-3 h-3" /> Admin
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <InfoRow label="Role"          value="System Administrator" />
          <InfoRow label="Access Level"  value="Full Access" />
          <InfoRow label="Session"       value="Active" />
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl border border-error/30 text-error bg-error/5 hover:bg-error/10 text-sm font-bold transition-colors flex items-center gap-2"
          >
            <Lock className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--panel-border)]">
          <h4 className="text-sm font-bold mb-4">Update Profile details</h4>
          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                New Username
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                New Email
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {profileStatus && (
              <div className={`text-sm p-3 rounded-lg ${profileStatus.type === 'error' ? 'bg-error/10 text-error' : 'bg-green-500/10 text-green-500'}`}>
                {profileStatus.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isUpdatingProfile ? 'Updating...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </SectionCard>

      {/* ── Security ────────────────────────────────────────────────────────── */}
      <SectionCard title="Security" icon={<Lock className="w-5 h-5" />}>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {passwordStatus && (
            <div className={`text-sm p-3 rounded-lg ${passwordStatus.type === 'error' ? 'bg-error/10 text-error' : 'bg-green-500/10 text-green-500'}`}>
              {passwordStatus.msg}
            </div>
          )}

          <button
            type="submit"
            disabled={isChangingPassword}
            className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </SectionCard>

      {/* ── Devices ────────────────────────────────────────────────────────── */}
     

      {/* ── Global Controls ────────────────────────────────────────────────── */}
      <SectionCard title="Global Light Settings" icon={<Clock className="w-5 h-5" />}>
        <div className="flex flex-col gap-4">
          <div className="text-sm text-[var(--text-secondary)]">
            Set a transmission delay parameter for all lights in the network. 
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                Delay (Seconds)
              </label>
              <input
                type="number"
                min={20}
                value={delayValue}
                onChange={(e) => setDelayValue(Number(e.target.value))}
                className="w-full bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors font-mono"
              />
              <p className="text-[10px] text-[var(--text-secondary)] mt-1">Minimum value: 20s (Converted to {delayValue * 1000}ms for transmission)</p>
            </div>
            <div className="pt-5">
              <button
                onClick={handleBroadcastDelay}
                disabled={isBroadcasting || delayValue < 20}
                className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBroadcasting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Broadcasting...</>
                ) : (
                  <><Send className="w-4 h-4" /> Broadcast to All</>
                )}
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Data & Privacy ─────────────────────────────────────────────────── */}
  

      {/* ── Save bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 glass-panel rounded-xl border glowing-border">
        <p className="text-sm text-[var(--text-secondary)]">
          Theme and device preferences are saved automatically.
        </p>
        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 transition-all flex items-center gap-2 shadow-[0_0_16px_rgba(0,229,255,0.2)]"
        >
          {saved
            ? <><CheckCircle className="w-4 h-4" /> Saved!</>
            : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      <AddLightModal isOpen={addLightOpen} onClose={() => setAddLightOpen(false)} />
    </div>
  );
}
