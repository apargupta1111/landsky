import { useState } from 'react';
import { Power, Settings2, AlertTriangle } from 'lucide-react';

interface ControlsTabProps {
  ctrl: {
    status: 'idle' | 'sending' | 'success' | 'error';
    setDimmingLevel: (level: number) => Promise<void>;
    powerOn: () => Promise<void>;
    powerOff: () => Promise<void>;
    resetDriver: () => Promise<void>;
  };
}

export function ControlsTab({ctrl }: ControlsTabProps) {
  const [dimLevel,      setDimLevel]      = useState(100);
  const [pendingReset,  setPendingReset]  = useState(false);

  const handleReset = async () => {
    if (!pendingReset) { setPendingReset(true); return; }
    await ctrl.resetDriver();
    setPendingReset(false);
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
