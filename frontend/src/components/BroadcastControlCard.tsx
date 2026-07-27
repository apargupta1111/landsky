import { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, Sun, Snowflake } from 'lucide-react';
import { ttsCommands } from '../services/ttsDownlink';

interface EnrichedDevice {
  id: string;
  name: string;
  ttsDeviceId: string;
  status: 'online' | 'warning' | 'error';
  brightness: number;
  power: number;
}

interface Props {
  devices: EnrichedDevice[];
}

export function BroadcastControlCard({ devices }: Props) {
  const [dimLevel, setDimLevel] = useState(100);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [progressMsg, setProgressMsg] = useState('');
  const [colorMode, setColorMode] = useState<'warm' | 'white'>('white');

  const executeCommand = async (
    commandName: 'powerOn' | 'powerOff' | 'setDimming',
    val?: number
  ) => {
    const activeDevices = devices.filter((d) => d.status !== 'error');

    if (activeDevices.length === 0) {
      setStatus('error');
      setErrorMsg('No online lights found to control.');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setStatus('sending');
    setErrorMsg('');
    setProgressMsg('');

    try {
      let hasError = false;
      let lastError = '';

      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      for (let i = 0; i < activeDevices.length; i++) {
        const dev = activeDevices[i];

        setProgressMsg(
          `Broadcasting... (${i + 1}/${activeDevices.length})`
        );

        let res;

        try {
          if (commandName === 'setDimming' && val !== undefined) {
            res = await ttsCommands.setDimming(dev.ttsDeviceId, val);
          } else if (commandName === 'powerOn') {
            res = await ttsCommands.powerOn(dev.ttsDeviceId);
          } else {
            res = await ttsCommands.powerOff(dev.ttsDeviceId);
          }

          if (res && !res.ok) {
            hasError = true;
            lastError = res.error || 'Unknown error';
          }
        } catch (err: any) {
          hasError = true;
          lastError = err.message;
        }

        if (i < activeDevices.length - 1) {
          await delay(1000);
        }
      }

      if (hasError) {
        setStatus('error');
        setErrorMsg(lastError);
      } else {
        setStatus('success');
      }

      setTimeout(() => {
        setStatus('idle');
        setProgressMsg('');
      }, 3000);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);

      setTimeout(() => {
        setStatus('idle');
        setProgressMsg('');
      }, 3000);
    }
  };

  const executeColorCommand = async (mode: 'warm' | 'white') => {
    const activeDevices = devices.filter((d) => d.status !== 'error');

    if (activeDevices.length === 0) {
      setStatus('error');
      setErrorMsg('No online lights found to control.');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setStatus('sending');
    setErrorMsg('');
    setProgressMsg('');

    try {
      let hasError = false;
      let lastError = '';

      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      for (let i = 0; i < activeDevices.length; i++) {
        const dev = activeDevices[i];

        setProgressMsg(
          `Switching to ${mode} light... (${i + 1}/${activeDevices.length})`
        );

        try {
          const res = mode === 'warm'
            ? await ttsCommands.setWarmLight(dev.ttsDeviceId)
            : await ttsCommands.setWhiteLight(dev.ttsDeviceId);

          if (res && !res.ok) {
            hasError = true;
            lastError = res.error || 'Unknown error';
          }
        } catch (err: any) {
          hasError = true;
          lastError = err.message;
        }

        if (i < activeDevices.length - 1) {
          await delay(1000);
        }
      }

      if (hasError) {
        setStatus('error');
        setErrorMsg(lastError);
      } else {
        setColorMode(mode);
        setStatus('success');
      }

      setTimeout(() => {
        setStatus('idle');
        setProgressMsg('');
      }, 3000);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);

      setTimeout(() => {
        setStatus('idle');
        setProgressMsg('');
      }, 3000);
    }
  };

  const disabled = status === 'sending';

  const activeDevicesCount = devices.filter(
    (d) => d.status !== 'error'
  ).length;

  const ctrlMsgCls = {
    sending: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-green-500/10 text-green-400 border border-green-500/20',
    error: 'bg-error/10 text-error border border-error/20',
    idle: '',
  }[status];

  return (
    <div className="glass-panel p-6 rounded-xl border col-span-1 sm:col-span-2 xl:col-span-4">

      {status !== 'idle' && (
        <div
          className={`mb-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${ctrlMsgCls}`}
        >
          {status === 'sending' && (
            <RefreshCw className="w-4 h-4 animate-spin" />
          )}

          {status === 'success' && (
            <CheckCircle className="w-4 h-4" />
          )}

          {status === 'error' && (
            <XCircle className="w-4 h-4" />
          )}

          {status === 'sending'
            ? progressMsg
            : status === 'success'
            ? 'Commands broadcasted successfully!'
            : `Error: ${errorMsg}`}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-start gap-6">

        {/* LEFT SIDE — Dimming & Power */}
        <div className="w-full md:w-[48%]">

          <div className="mb-5">

            <div className="flex justify-between mb-2">
              <span className="text-[var(--text-secondary)]">
                Target Dimming Level
              </span>

              <span className="data-font font-bold">
                {dimLevel}
                <span className="text-xs text-[var(--text-secondary)]">
                  {" "}
                  / 100
                </span>
              </span>
            </div>

            <div className="flex items-center gap-3">

              <input
                type="range"
                min={0}
                max={100}
                value={dimLevel}
                onChange={(e) =>
                  setDimLevel(Number(e.target.value))
                }
                className="flex-1 h-2 rounded-lg accent-primary"
              />

              <button
                onClick={() =>
                  executeCommand('setDimming', dimLevel)
                }
                disabled={disabled || activeDevicesCount === 0}
                className="px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 disabled:opacity-40 transition-colors"
              >
                Apply All
              </button>

            </div>

          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-[var(--panel-border)] pt-4">

            <button
              onClick={() => executeCommand('powerOn')}
              disabled={disabled || activeDevicesCount === 0}
              className="py-3 rounded-lg bg-primary/20 text-primary border border-primary/50 font-bold hover:bg-primary/30 disabled:opacity-40 transition-colors"
            >
              Turn All ON
            </button>

            <button
              onClick={() => executeCommand('powerOff')}
              disabled={disabled || activeDevicesCount === 0}
              className="py-3 rounded-lg bg-error/10 text-error border border-error/30 font-bold hover:bg-error/20 disabled:opacity-40 transition-colors"
            >
              Turn All OFF
            </button>

          </div>

        </div>

        {/* RIGHT SIDE — Light Color Toggle */}
        <div className="w-full md:w-[48%] md:border-l md:border-[var(--panel-border)] md:pl-6">

          <div className="flex items-center justify-between mb-3">
            <span className="text-[var(--text-secondary)] text-sm font-medium">
              Light Color
            </span>

            {/* Current mode indicator pill */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all duration-300 ${
                colorMode === 'warm'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-sky-400/20 text-sky-300 border border-sky-400/40'
              }`}
            >
              {colorMode === 'warm' ? (
                <Sun className="w-3 h-3" />
              ) : (
                <Snowflake className="w-3 h-3" />
              )}
              {colorMode === 'warm' ? 'Warm' : 'White'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">

            <button
              onClick={() => executeColorCommand('warm')}
              disabled={disabled || activeDevicesCount === 0}
              className={`group relative py-3 rounded-lg font-bold transition-all duration-300 disabled:opacity-40 ${
                colorMode === 'warm'
                  ? 'bg-amber-500/25 text-amber-300 border-2 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : 'bg-amber-500/10 text-amber-400/70 border border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Sun className={`w-4 h-4 transition-transform duration-300 ${colorMode === 'warm' ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span>Warm Light</span>
              </div>
            
            </button>

            <button
              onClick={() => executeColorCommand('white')}
              disabled={disabled || activeDevicesCount === 0}
              className={`group relative py-3 rounded-lg font-bold transition-all duration-300 disabled:opacity-40 ${
                colorMode === 'white'
                  ? 'bg-sky-400/25 text-sky-200 border-2 border-sky-400/60 shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                  : 'bg-sky-400/10 text-sky-400/70 border border-sky-400/20 hover:bg-sky-400/20 hover:text-sky-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Snowflake className={`w-4 h-4 transition-transform duration-300 ${colorMode === 'white' ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span>White Light</span>
              </div>
            
            </button>

          </div>

        

        </div>

      </div>
    </div>
  );
}