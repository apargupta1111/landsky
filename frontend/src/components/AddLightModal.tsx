import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, MapPin, Wifi, Tag, Hash, AlertCircle, CheckCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { Device } from '../store/useAppStore';

interface AddLightModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function Field({
  id, label, icon, placeholder, value, onChange, type = 'text', required = true,
}: {
  id: string; label: string; icon: React.ReactNode;
  placeholder: string; value: string;
  onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">{icon}</span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          step={type === 'number' ? 'any' : undefined}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] focus:border-primary focus:outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-colors"
        />
      </div>
    </div>
  );
}

export function AddLightModal({ isOpen, onClose }: AddLightModalProps) {
  const addDevice = useAppStore((s) => s.addDevice);
  const devices   = useAppStore((s) => s.devices);

  const [name,        setName]        = useState('');
  const [address,     setAddress]     = useState('');
  const [lat,         setLat]         = useState('');
  const [lng,         setLng]         = useState('');
  const [ttsDeviceId, setTtsDeviceId] = useState('');
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);

  const reset = () => {
    setName(''); setAddress(''); setLat(''); setLng('');
    setTtsDeviceId(''); setError(''); setSuccess(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setError('Latitude must be a number between -90 and 90.'); return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setError('Longitude must be a number between -180 and 180.'); return;
    }

    // Auto-generate ID from TTS device ID or name
    const rawId = (ttsDeviceId.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'));
    const id    = rawId.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    if (devices.find((d) => d.id === id)) {
      setError(`A device with ID "${id}" already exists.`); return;
    }

    const device: Device = {
      id,
      name:        name.trim(),
      address:     address.trim(),
      lat:         latNum,
      lng:         lngNum,
      ttsDeviceId: ttsDeviceId.trim() || id,
      addedAt:     new Date().toISOString(),
    };

    addDevice(device);
    setSuccess(true);
    setTimeout(() => { handleClose(); }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel w-full max-w-lg rounded-2xl border glowing-border shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--panel-border)] bg-[var(--bg-color)]/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-base leading-tight">Add New Light</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Register a new streetlight device</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-error/10 hover:text-error text-[var(--text-secondary)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="al-name"    label="Display Name"    icon={<Tag className="w-4 h-4"/>}   placeholder="e.g. Main Gate Light"   value={name}        onChange={setName} />
                <Field id="al-tts"     label="TTS Device ID"   icon={<Wifi className="w-4 h-4"/>}  placeholder="e.g. streetlight-02"    value={ttsDeviceId} onChange={setTtsDeviceId} required={false} />
              </div>
              <Field id="al-address" label="Physical Address" icon={<MapPin className="w-4 h-4"/>} placeholder="Street, City, State PIN" value={address}     onChange={setAddress} />
              <div className="grid grid-cols-2 gap-4">
                <Field id="al-lat" label="Latitude"  icon={<Hash className="w-4 h-4"/>} placeholder="e.g. 28.4859" value={lat} onChange={setLat} type="number" />
                <Field id="al-lng" label="Longitude" icon={<Hash className="w-4 h-4"/>} placeholder="e.g. 77.5342" value={lng} onChange={setLng} type="number" />
              </div>

              <p className="text-xs text-[var(--text-secondary)] bg-black/5 dark:bg-white/5 rounded-lg px-3 py-2 border border-[var(--panel-border)]">
                💡 Leave <strong>TTS Device ID</strong> blank to auto-generate from the display name. The ID is used to fetch live telemetry from Node-RED.
              </p>

              {/* Error */}
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-error text-sm bg-error/10 border border-error/30 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </motion.div>
              )}

              {/* Success */}
              {success && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-green-500 text-sm bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                  <CheckCircle className="w-4 h-4 shrink-0" />Device added successfully!
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--panel-border)] text-sm font-bold text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={success}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 disabled:opacity-60 transition-all shadow-[0_0_16px_rgba(0,229,255,0.2)] flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add Light
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
