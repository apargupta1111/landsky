import { useState } from 'react';
import { Settings2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ttsCommands } from '../services/ttsDownlink';

export function BroadcastControlCard() {
  const devices = useAppStore((s) => s.devices);
  const [dimLevel, setDimLevel] = useState(100);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const executeCommand = async (commandName: 'powerOn' | 'powerOff' | 'setDimming', val?: number) => {
    if (devices.length === 0) return;
    
    setStatus('sending');
    setErrorMsg('');
    
    try {
      let hasError = false;
      let lastError = '';

      // Send command to all registered devices concurrently
      await Promise.all(
        devices.map(async (dev) => {
          let res;
          try {
            if (commandName === 'setDimming' && val !== undefined) {
              res = await ttsCommands.setDimming(dev.ttsDeviceId, val);
            } else if (commandName === 'powerOn') {
              res = await ttsCommands.powerOn(dev.ttsDeviceId);
            } else if (commandName === 'powerOff') {
              res = await ttsCommands.powerOff(dev.ttsDeviceId);
            }
            
            if (res && !res.ok) {
              hasError = true;
              lastError = res.error || 'Unknown error';
            }
          } catch (e: any) {
            hasError = true;
            lastError = e.message;
          }
        })
      );

      if (hasError) {
        setStatus('error');
        setErrorMsg(lastError);
      } else {
        setStatus('success');
      }

      // Reset success/error message after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
      
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const disabled = status === 'sending';

  const ctrlMsgCls = {
    sending: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-green-500/10 text-green-400 border border-green-500/20',
    error:   'bg-error/10 text-error border border-error/20',
    idle:    '',
  }[status];

  return (
    <div className="glass-panel p-5 md:p-6 rounded-xl border col-span-1 sm:col-span-2 xl:col-span-4 relative overflow-hidden flex flex-col justify-center">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Title & Status */}
        <div className="flex-1">
          <div className="flex items-center text-primary mb-2">
            <Settings2 className="w-5 h-5 mr-2" />
            <h3 className="font-bold text-lg">Broadcast Control (All Lights)</h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Send commands to all {devices.length} registered streetlights simultaneously.
          </p>

          {status !== 'idle' && (
            <div className={`inline-flex items-center px-4 py-2 text-xs md:text-sm font-medium gap-2 rounded-lg ${ctrlMsgCls}`}>
              {status === 'sending' && <RefreshCw className="w-4 h-4 animate-spin" />}
              {status === 'success' && <CheckCircle className="w-4 h-4" />}
              {status === 'error'   && <XCircle className="w-4 h-4" />}
              {status === 'sending' ? 'Broadcasting commands via LoRaWAN…'
                : status === 'success' ? 'Commands broadcasted successfully!'
                : `Error: ${errorMsg}`}
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex-1 bg-black/10 dark:bg-black/20 p-4 rounded-xl border border-[var(--panel-border)] min-w-[300px]">
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--text-secondary)]">Target Dimming Level</span>
              <span className="data-font font-bold">
                {dimLevel} <span className="text-[var(--text-secondary)] text-xs">/ 100</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range" min="0" max="100" value={dimLevel}
                onChange={(e) => setDimLevel(Number(e.target.value))}
                className="flex-1 h-2 rounded-lg cursor-pointer accent-primary"
              />
              <button
                onClick={() => executeCommand('setDimming', dimLevel)}
                disabled={disabled || devices.length === 0}
                className="px-4 py-1.5 text-xs font-bold bg-primary/20 text-primary border border-primary/50 rounded-lg hover:bg-primary/30 disabled:opacity-40 transition-colors"
              >
                Apply All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--panel-border)]/50">
            <button
              onClick={() => executeCommand('powerOn')}
              disabled={disabled || devices.length === 0}
              className="py-2 rounded-lg bg-primary/20 text-primary border border-primary/50 text-sm font-bold hover:bg-primary/30 disabled:opacity-40 transition-colors"
            >
              Turn All ON
            </button>
            <button
              onClick={() => executeCommand('powerOff')}
              disabled={disabled || devices.length === 0}
              className="py-2 rounded-lg bg-error/10 text-error border border-error/30 text-sm font-bold hover:bg-error/20 disabled:opacity-40 transition-colors"
            >
              Turn All OFF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
