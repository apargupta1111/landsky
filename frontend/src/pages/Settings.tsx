import { useState } from 'react';
import {
  Sun, Moon, User, Lock, Server, Trash2, Plus,
  Save, AlertTriangle, CheckCircle, Wifi, Globe, Bell, Shield,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AddLightModal } from '../components/AddLightModal';
import { ENDPOINTS } from '../config/endpoints';

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
  const { isDarkMode, toggleTheme, username, logout, devices, removeDevice, clearTelemetryHistory } = useAppStore();
  const [addLightOpen, setAddLightOpen]   = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh,   setAutoRefresh]   = useState(true);
  const [saved,         setSaved]         = useState(false);
  const [confirmReset,  setConfirmReset]  = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleHistoryClear = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    clearTelemetryHistory();
    setConfirmReset(false);
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
          label="Auto Refresh"
          sub="Poll telemetry every 5 seconds automatically"
          value={autoRefresh}
          onChange={() => setAutoRefresh((v) => !v)}
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
      </SectionCard>

     

      {/* ── Devices ────────────────────────────────────────────────────────── */}
      <SectionCard title="Registered Devices" icon={<Wifi className="w-5 h-5" />}>
        <div className="space-y-3 mb-4">
          {devices.map((dev, i) => (
            <div key={dev.id} className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--panel-border)]">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i === 0 ? 'bg-green-400 animate-pulse' : 'bg-error'}`} />
              <div className="flex-1 min-w-0">
                <div className="font-bold data-font text-sm">{dev.id}</div>
                <div className="text-xs text-[var(--text-secondary)] truncate">{dev.name} · {dev.address}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                  TTS ID: <span className="font-mono">{dev.ttsDeviceId}</span> ·
                  Added: {new Date(dev.addedAt).toLocaleDateString()}
                </div>
              </div>
              {i !== 0 && (
                <button
                  onClick={() => removeDevice(dev.id)}
                  className="p-1.5 rounded-lg hover:bg-error/10 hover:text-error text-[var(--text-secondary)] transition-colors shrink-0"
                  title="Remove device"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {i === 0 && (
                <span className="text-xs text-[var(--text-secondary)] shrink-0 mt-1">Primary</span>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => setAddLightOpen(true)}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> Add New Device
        </button>
      </SectionCard>

      {/* ── Data & Privacy ─────────────────────────────────────────────────── */}
      <SectionCard title="Data & History" icon={<Bell className="w-5 h-5" />}>
        <div className="flex items-center gap-3 p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--panel-border)] mb-4">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <p className="text-sm text-[var(--text-secondary)]">
            Telemetry history is stored locally and used to render analytics charts.
            Clearing it will reset all historical trend data.
          </p>
        </div>
        <button
          onClick={handleHistoryClear}
          className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all flex items-center gap-2 ${
            confirmReset
              ? 'bg-error/20 text-error border-error/50'
              : 'border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-error/50 hover:text-error'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          {confirmReset ? 'Click again to confirm clear' : 'Clear Telemetry History'}
        </button>
      </SectionCard>

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
