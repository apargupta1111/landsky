import { Activity, Zap, Thermometer, Clock } from 'lucide-react';
import type { TelemetryData } from '../../hooks/useTelemetry';
import { tlv } from '../../hooks/useTelemetry';

interface TelemetryPanelProps {
  telemetry: TelemetryData | null;
}

export function TelemetryPanel({ telemetry }: TelemetryPanelProps) {
  return (
    <div className="space-y-6">
      {/* Output + Input panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-xl border">
          <div className="flex items-center mb-5 text-secondary">
            <Zap className="w-5 h-5 mr-2" />
            <h3 className="font-bold">Output Telemetry (DC)</h3>
          </div>
          <div className="space-y-3">
            <TelRow label="Output Current"   value={tlv(telemetry, 'output_current_mA')} unit="mA"  />
            <TelRow label="Output Voltage"   value={tlv(telemetry, 'output_voltage_V')}  unit="Vdc" />
            <TelRow label="LED Output Power" value={tlv(telemetry, 'led_power_W')}       unit="W"   />
            <TelRow label="Brightness"       value={tlv(telemetry, 'brightness_percent')} unit="%"  />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border">
          <div className="flex items-center mb-5 text-primary">
            <Activity className="w-5 h-5 mr-2" />
            <h3 className="font-bold">Input Telemetry (AC)</h3>
          </div>
          <div className="space-y-3">
            <TelRow label="Input Current"   value={tlv(telemetry, 'input_current_mA')}   unit="mA"  />
            <TelRow label="Input Voltage"   value={tlv(telemetry, 'input_voltage_V')}    unit="Vac" />
            <TelRow label="Input Power"     value={tlv(telemetry, 'input_power_W')}      unit="W"   />
            <TelRow label="Input Frequency" value={tlv(telemetry, 'input_frequency_Hz')} unit="Hz"  />
          </div>
        </div>
      </div>

      {/* Env & Time databoxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <DataBox icon={<Thermometer className="w-4 h-4" />}            title="Internal Temp"  value={tlv(telemetry, 'internal_temp_C')}       unit="°C"  />
        <DataBox icon={<Thermometer className="w-4 h-4 text-secondary" />} title="Power Factor" value={tlv(telemetry, 'power_factor')}         unit=""    />
        <DataBox icon={<Clock className="w-4 h-4" />}                  title="Lamp-On Time"   value={tlv(telemetry, 'lamp_on_time_hours')}    unit="hrs" />
        <DataBox icon={<Activity className="w-4 h-4" />}               title="Operating Time" value={tlv(telemetry, 'operating_time_hours')} unit="hrs" />
      </div>
    </div>
  );
}

// ── Micro-components ───────────────────────────────────────────────────────────

function TelRow({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] hover:border-primary/30 transition-colors">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="font-bold data-font text-lg">{value}</span>
        <span className="text-xs text-[var(--text-secondary)]">{unit}</span>
      </div>
    </div>
  );
}

function DataBox({ icon, title, value, unit }: { icon: React.ReactNode; title: string; value: string; unit: string }) {
  return (
    <div className="p-4 rounded-xl border border-[var(--panel-border)] bg-black/5 dark:bg-white/5">
      <div className="flex items-center text-[var(--text-secondary)] mb-2 gap-1.5">
        {icon}
        <span className="text-xs font-medium truncate">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-bold data-font text-2xl">{value}</span>
        <span className="text-xs text-[var(--text-secondary)]">{unit}</span>
      </div>
    </div>
  );
}
