import { motion } from 'framer-motion';
import { CalendarClock, Clock, CheckCircle, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import type { useSchedule } from '../../hooks/useSchedule';
import { DAY_LABELS } from './types';

type ScheduleHook = ReturnType<typeof useSchedule>;

interface ScheduleTabProps {
  sched: ScheduleHook;
}

export function ScheduleTab({ sched }: ScheduleTabProps) {
  const { lightSchedules, onTime, setOnTime, offTime, setOffTime,
          repeat, setRepeat, days, toggleDay, saved, add, toggle, remove } = sched;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── New Schedule Form ─────────────────────────────────── */}
      <div className="glass-panel rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-5 text-primary">
          <CalendarClock className="w-5 h-5" />
          <h3 className="font-bold text-lg">New Schedule</h3>
        </div>

        <div className="space-y-5">
          {/* Time pickers */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Switch ON at',  val: onTime,  set: setOnTime  },
              { label: 'Switch OFF at', val: offTime, set: setOffTime },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">{label}</label>
                <input
                  type="time" value={val}
                  onChange={(e) => set(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] focus:border-primary outline-none text-sm text-[var(--text-primary)] transition-colors"
                />
              </div>
            ))}
          </div>

          {/* Repeat type */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Repeat</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'custom'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRepeat(r)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all capitalize ${
                    repeat === r
                      ? 'bg-primary/20 text-primary border-primary/50'
                      : 'bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] border-[var(--panel-border)] hover:border-primary/30'
                  }`}
                >{r}</button>
              ))}
            </div>
          </div>

          {/* Day picker — custom only */}
          {repeat === 'custom' && (
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Days</label>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-full text-xs font-bold border transition-all ${
                      days.includes(i)
                        ? 'bg-primary text-white border-primary shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                        : 'bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] border-[var(--panel-border)] hover:border-primary/30'
                    }`}
                  >{d}</button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
    
          </p>

          <button
            onClick={add}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 shadow-[0_0_20px_rgba(0,229,255,0.2)] transition-all"
          >
            {saved
              ? <><CheckCircle className="w-4 h-4" /> Schedule Saved!</>
              : <><Plus className="w-4 h-4" /> Add Schedule</>}
          </button>
        </div>
      </div>

      {/* ── Existing Schedules ─────────────────────────────────── */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest">
          Active Schedules ({lightSchedules.length})
        </h4>

        {lightSchedules.length === 0 ? (
          <div className="glass-panel rounded-xl border border-dashed border-[var(--panel-border)] p-8 text-center text-[var(--text-secondary)] text-sm">
            <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No schedules yet. Add one above.
          </div>
        ) : (
          lightSchedules.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-panel rounded-xl border p-4 flex items-center gap-4 transition-all ${
                s.isActive ? 'border-primary/30' : 'border-[var(--panel-border)] opacity-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-base font-bold data-font text-primary">{s.onTime}</span>
                  <span className="text-xs text-[var(--text-secondary)]">ON →</span>
                  <span className="text-base font-bold data-font text-error">{s.offTime}</span>
                  <span className="text-xs text-[var(--text-secondary)]">OFF</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)] capitalize bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full border border-[var(--panel-border)]">
                    {s.repeat}
                  </span>
                  {s.repeat === 'custom' && s.days.map((d) => (
                    <span key={d} className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{DAY_LABELS[d]}</span>
                  ))}
                </div>
              </div>

              <button onClick={() => toggle(s.id)} className="text-[var(--text-secondary)] hover:text-primary transition-colors" title={s.isActive ? 'Pause' : 'Activate'}>
                {s.isActive ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7" />}
              </button>

              <button onClick={() => remove(s.id)} className="p-1.5 rounded-lg hover:bg-error/10 hover:text-error text-[var(--text-secondary)] transition-colors" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))
        )}

      </div>
    </div>
  );
}
