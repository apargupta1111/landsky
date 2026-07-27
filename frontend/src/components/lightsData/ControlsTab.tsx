import { useState, useEffect } from 'react';
import { Power, Settings2, AlertTriangle, Sun, Snowflake, RefreshCw } from 'lucide-react';
import { useColorState } from '../../hooks/useColorState';
import type { TelemetryData } from '../../services/backendTelemetry';
import { tlv } from '../../hooks/useTelemetry';

interface ControlsTabProps {
  deviceId?: string | null;
  telemetry?: TelemetryData | null;
  ctrl: {
    status: 'idle' | 'sending' | 'success' | 'error';
    setDimmingLevel: (level: number) => Promise<void>;
    powerOn: () => Promise<void>;
    powerOff: () => Promise<void>;
    resetDriver: () => Promise<void>;
    setWarmLight: () => Promise<void>;
    setWhiteLight: () => Promise<void>;
  };
}

export function ControlsTab({ ctrl, deviceId, telemetry }: ControlsTabProps) {
  const [dimLevel,      setDimLevel]      = useState(100);
  const [pendingReset,  setPendingReset]  = useState(false);
  const { colorMode, setColorMode, isLoading: isLoadingColor } = useColorState(deviceId);

  // Sync brightness slider with telemetry data
  useEffect(() => {
    const val = tlv(telemetry, 'brightness_percent', '');
    if (val !== '') {
      setDimLevel(Number(val));
    } else {
      setDimLevel(100);
    }
  }, [telemetry]);

  const handleReset = async () => {
    if (!pendingReset) { setPendingReset(true); return; }
    await ctrl.resetDriver();
    setPendingReset(false);
  };

  const handleColorSwitch = async (mode: 'warm' | 'white') => {
    if (mode === 'warm') {
      await ctrl.setWarmLight();
    } else {
      await ctrl.setWhiteLight();
    }
    setColorMode(mode);
  };

  const disabled = ctrl.status === 'sending';

  return (
    <div className="glass-panel p-6 rounded-xl border">
      <div className="flex items-center mb-6 text-primary">
        <Settings2 className="w-5 h-5 mr-2" />
        <h3 className="font-bold text-lg">Active Controls</h3>
      </div>

      <div className="space-y-7">
        {/* Digital Dimming */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--text-secondary)]">Digital Dimming Level</span>
            <span className="data-font font-bold">
              {dimLevel} <span className="text-[var(--text-secondary)] text-xs">/ 100</span>
            </span>
          </div>
          <input
            type="range" min="0" max="100" value={dimLevel}
            onChange={(e) => setDimLevel(Number(e.target.value))}
            className="w-full h-2 rounded-lg cursor-pointer accent-primary"
          />
          <div className="flex justify-between mt-2">
            <div className="text-xs text-[var(--text-secondary)]">{dimLevel}% brightness</div>
            <button
              onClick={() => ctrl.setDimmingLevel(dimLevel)}
              disabled={disabled}
              className="px-3 py-1 text-xs bg-primary/20 text-primary border border-primary/50 rounded-lg hover:bg-primary/30 disabled:opacity-40 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Quick Power */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--panel-border)]">
          <button
            onClick={() => ctrl.powerOn()}
            disabled={disabled}
            className="py-2.5 rounded-lg bg-primary/20 text-primary border border-primary/50 text-sm font-bold hover:bg-primary/30 disabled:opacity-40 transition-colors"
          >
            Power ON
          </button>
          <button
            onClick={() => ctrl.powerOff()}
            disabled={disabled}
            className="py-2.5 rounded-lg bg-error/10 text-error border border-error/30 text-sm font-bold hover:bg-error/20 disabled:opacity-40 transition-colors"
          >
            Power OFF
          </button>
        </div>

        {/* Light Color Temperature */}
        <div className="pt-2 border-t border-[var(--panel-border)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-secondary)] text-sm font-medium">
                Light Color
              </span>
              {isLoadingColor && <RefreshCw className="w-3 h-3 animate-spin text-[var(--text-secondary)]" />}
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all duration-300 ${
                colorMode === 'warm'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-sky-400/20 text-sky-300 border border-sky-400/40'
              }`}
            >
              {colorMode === 'warm' ? (
                <Sun className="w-2.5 h-2.5" />
              ) : (
                <Snowflake className="w-2.5 h-2.5" />
              )}
              {colorMode === 'warm' ? 'Warm' : 'White'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleColorSwitch('warm')}
              disabled={disabled}
              className={`group py-2.5 rounded-lg text-sm font-bold transition-all duration-300 disabled:opacity-40 ${
                colorMode === 'warm'
                  ? 'bg-amber-500/25 text-amber-300 border-2 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                  : 'bg-amber-500/10 text-amber-400/70 border border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-300'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Sun className={`w-3.5 h-3.5 transition-transform duration-300 ${colorMode === 'warm' ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span>Warm</span>
              </div>
              <div className="text-[9px] opacity-50 mt-0.5">3000K</div>
            </button>

            <button
              onClick={() => handleColorSwitch('white')}
              disabled={disabled}
              className={`group py-2.5 rounded-lg text-sm font-bold transition-all duration-300 disabled:opacity-40 ${
                colorMode === 'white'
                  ? 'bg-sky-400/25 text-sky-200 border-2 border-sky-400/60 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                  : 'bg-sky-400/10 text-sky-400/70 border border-sky-400/20 hover:bg-sky-400/20 hover:text-sky-300'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Snowflake className={`w-3.5 h-3.5 transition-transform duration-300 ${colorMode === 'white' ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span>White</span>
              </div>
              <div className="text-[9px] opacity-50 mt-0.5">6500K</div>
            </button>
          </div>
        </div>

        {/* Reset Driver */}
        <button
          onClick={handleReset}
          disabled={disabled}
          className={`w-full py-2.5 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${
            pendingReset
              ? 'bg-error/20 text-error border-error/50'
              : 'bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] border-[var(--panel-border)] hover:border-error/50 hover:text-error'
          }`}
        >
          <Power className="w-4 h-4" />
          {pendingReset ? 'Click again to confirm RESET' : 'Reset Driver'}
        </button>

        {pendingReset && (
          <p className="text-xs text-warning flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            This will restart the driver firmware. Light will briefly go off.
          </p>
        )}
      </div>
    </div>
  );
}
