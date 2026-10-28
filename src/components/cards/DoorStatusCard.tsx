import React from 'react';
import {
  Lock,
  Unlock,
  RotateCw,
  Sliders,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { useHomeGuard } from '../../context/HomeGuardContext';

export const DoorStatusCard: React.FC = () => {
  const {
    doorStatus,
    servoAngle,
    doorActionPending,
    toggleDoor,
    lastRfidEvent,
    transportType,
  } = useHomeGuard();

  const isLocked = doorStatus === 'LOCKED';
  const isUnlocked = doorStatus === 'UNLOCKED';

  return (
    <div className="card-surface p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300">
      {/* Background glow when unlocked */}
      {isUnlocked && (
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                isUnlocked
                  ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                  : 'bg-surface-card border-surface-border text-amber-400'
              }`}
            >
              {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-slate-200">
                Door Security & Servo Status
              </h2>
              <p className="text-xs text-slate-400">Locking actuator (SG90 PWM TIM2_CH1)</p>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono tracking-wider border transition-all ${
              isUnlocked
                ? 'bg-teal-500/15 text-teal-300 border-teal-500/40 badge-glow-teal'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isUnlocked ? 'bg-teal-400' : 'bg-amber-400'
              }`}
            />
            <span>{doorStatus}</span>
          </div>
        </div>

        {/* Center Graphic & State */}
        <div className="my-6 flex flex-col sm:flex-row items-center justify-between gap-6 p-4 rounded-xl bg-charcoal-850/80 border border-surface-border">
          {/* Visual Lock Representation */}
          <div className="flex items-center space-x-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                isUnlocked
                  ? 'bg-teal-950/60 border-2 border-teal-500/50 text-teal-300 shadow-[0_0_24px_rgba(20,184,166,0.25)]'
                  : 'bg-slate-900 border-2 border-slate-700 text-amber-400'
              }`}
            >
              {isUnlocked ? (
                <Unlock className="w-8 h-8 animate-bounce-subtle" />
              ) : (
                <Lock className="w-8 h-8" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-slate-100">
                  {isUnlocked ? 'Perimeter Unlocked' : 'Perimeter Secured'}
                </span>
                {transportType === 'DEMO' && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                    SIM
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isUnlocked
                  ? 'Access permitted. Servo disengaged from strike.'
                  : 'Deadbolt engaged. Hardware confirmation active.'}
              </p>
            </div>
          </div>

          {/* Actuator Position Info (Only displayed if reported by STM32!) */}
          <div className="flex flex-col items-end sm:border-l sm:border-surface-border sm:pl-6 w-full sm:w-auto">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
              <Sliders className="w-3.5 h-3.5 text-teal-400" />
              <span>Reported Servo Position</span>
            </div>

            {servoAngle !== undefined ? (
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold font-mono text-teal-300">{servoAngle}°</span>
                <span className="text-xs text-slate-400">
                  {servoAngle >= 80 ? '(Open)' : '(Closed)'}
                </span>
              </div>
            ) : (
              <span className="text-xs font-mono text-slate-400 italic">
                Awaiting telemetry...
              </span>
            )}

            <div className="mt-1 text-[11px] text-slate-400 font-mono">
              PWM duty: {servoAngle !== undefined ? `${(1.0 + (servoAngle / 180)).toFixed(2)}ms` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Action button with Hardware Pending Feedback */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Remote Override Control</span>
            {doorActionPending && (
              <div className="flex items-center space-x-1.5 text-xs text-teal-300 font-mono">
                <RotateCw className="w-3 h-3 animate-spin text-teal-400" />
                <span>Waiting for hardware confirmation...</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => toggleDoor('UNLOCK')}
              disabled={isUnlocked || doorActionPending}
              className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                isUnlocked
                  ? 'bg-surface-card border border-surface-border text-slate-400 cursor-not-allowed opacity-50'
                  : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-sm active:scale-95'
              }`}
            >
              <Unlock className="w-4 h-4" />
              <span>{doorActionPending && !isUnlocked ? 'Confirming...' : 'Unlock Door'}</span>
            </button>

            <button
              onClick={() => toggleDoor('LOCK')}
              disabled={isLocked || doorActionPending}
              className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                isLocked
                  ? 'bg-surface-card border border-surface-border text-slate-400 cursor-not-allowed opacity-50'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm active:scale-95'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>{doorActionPending && !isLocked ? 'Confirming...' : 'Lock Door'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer: Latest Successful RFID Authentication */}
      <div className="pt-4 mt-4 border-t border-surface-border">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-300 font-medium">Last Successful Access:</span>
          </div>
          {lastRfidEvent && lastRfidEvent.result === 'GRANTED' ? (
            <div className="flex items-center space-x-1.5 text-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-medium text-slate-100">{lastRfidEvent.memberName}</span>
              <span className="text-slate-400 font-mono text-[11px]">
                ({new Date(lastRfidEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            </div>
          ) : (
            <span className="text-slate-400 italic">No RFID authentication logged yet</span>
          )}
        </div>
      </div>
    </div>
  );
};
