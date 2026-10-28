import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Thermometer,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Sliders,
  CheckCircle2,
  Lock,
  Unlock,
} from 'lucide-react';
import { useHomeGuard } from '../context/HomeGuardContext';

interface SimulationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConnectModal: () => void;
}

export const SimulationDrawer: React.FC<SimulationDrawerProps> = ({
  isOpen,
  onClose,
  onOpenConnectModal,
}) => {
  const {
    telemetry,
    doorStatus,
    servoAngle,
    settings,
    members,
    simulateCustomTemp,
    simulatePresetTemp,
    simulateRfidScan,
    simulateDisconnect,
    connect,
    connection,
    toggleDoor,
  } = useHomeGuard();

  const [customTemp, setCustomTemp] = useState<number>(telemetry.temperature);
  const [selectedMemberUid, setSelectedMemberUid] = useState<string>(members[0]?.uid || 'E2:7B:44:90');

  if (!isOpen) return null;

  const handleTempSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCustomTemp(val);
    simulateCustomTemp(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-charcoal-850">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
                <span>IoT Qualifier Simulation Bench</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  VIRTUAL STM32
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Test and verify telemetry, thresholds, alerts, and RFID authentication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Temperature Simulation Section */}
          <div className="p-4 rounded-xl bg-charcoal-900 border border-surface-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-medium text-slate-200">
                <Thermometer className="w-4 h-4 text-teal-400" />
                <span>Simulated Sensor Temperature</span>
              </div>
              <span className="text-xl font-bold font-mono text-teal-300">
                {telemetry.temperature.toFixed(1)}°C
              </span>
            </div>

            {/* Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>15°C (Cool)</span>
                <span className="text-amber-400">Warning ({settings.warningThreshold}°C)</span>
                <span className="text-red-400">Critical ({settings.criticalThreshold}°C)</span>
                <span>70°C</span>
              </div>
              <input
                type="range"
                min="15"
                max="70"
                step="0.5"
                value={customTemp}
                onChange={handleTempSlider}
                className="w-full accent-teal-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
            </div>

            {/* Preset shortcuts */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setCustomTemp(27.4);
                  simulatePresetTemp('NORMAL');
                }}
                className="py-2 px-3 rounded-lg text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/40 transition-colors flex flex-col items-center justify-center space-y-1"
              >
                <span>Normal State</span>
                <span className="font-mono text-[11px] text-emerald-400/80">27.4°C</span>
              </button>

              <button
                onClick={() => {
                  setCustomTemp(42.5);
                  simulatePresetTemp('WARNING');
                }}
                className="py-2 px-3 rounded-lg text-xs font-medium bg-amber-950/40 text-amber-300 border border-amber-800/40 hover:bg-amber-900/40 transition-colors flex flex-col items-center justify-center space-y-1"
              >
                <span>Warning State</span>
                <span className="font-mono text-[11px] text-amber-400/80">42.5°C (&ge;40°)</span>
              </button>

              <button
                onClick={() => {
                  setCustomTemp(53.2);
                  simulatePresetTemp('CRITICAL');
                }}
                className="py-2 px-3 rounded-lg text-xs font-medium bg-red-950/40 text-red-300 border border-red-800/40 hover:bg-red-900/40 transition-colors flex flex-col items-center justify-center space-y-1"
              >
                <span>Critical Danger</span>
                <span className="font-mono text-[11px] text-red-400/80">53.2°C (&ge;50°)</span>
              </button>
            </div>
          </div>

          {/* RFID Access Simulation */}
          <div className="p-4 rounded-xl bg-charcoal-900 border border-surface-border space-y-4">
            <div className="flex items-center space-x-2 text-sm font-medium text-slate-200">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Simulate RFID Card Reader Event (RC522)</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400">Select Registered Member to Scan:</label>
              <select
                value={selectedMemberUid}
                onChange={(e) => setSelectedMemberUid(e.target.value)}
                className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.uid}>
                    {m.name} ({m.role}) — UID: {m.uid} {m.isAllowed ? '✓' : '✗'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => simulateRfidScan(selectedMemberUid, 'GRANTED')}
                className="py-2 px-3 rounded-lg text-xs font-medium bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Scan Selected Card</span>
              </button>

              <button
                onClick={() => simulateRfidScan('9F:A4:12:00', 'DENIED')}
                className="py-2 px-3 rounded-lg text-xs font-medium bg-red-950/50 text-red-300 border border-red-800/50 hover:bg-red-900/50 transition-colors flex items-center justify-center space-x-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Scan Unknown Card (Denied)</span>
              </button>
            </div>
          </div>

          {/* Door Servo State & Commands */}
          <div className="p-4 rounded-xl bg-charcoal-900 border border-surface-border space-y-3">
            <div className="flex items-center justify-between text-sm font-medium text-slate-200">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-teal-400" />
                <span>Virtual Servo Lock Mechanism (SG90)</span>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-card border border-surface-border text-slate-300">
                Reported Angle: {servoAngle !== undefined ? `${servoAngle}°` : 'None'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Current reported door status:</span>
              <span
                className={`font-semibold uppercase tracking-wider ${
                  doorStatus === 'LOCKED' ? 'text-amber-400' : 'text-teal-400'
                }`}
              >
                {doorStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => toggleDoor('UNLOCK')}
                disabled={doorStatus === 'UNLOCKED'}
                className="py-2 px-3 rounded-lg text-xs font-medium bg-surface-card border border-surface-border hover:border-teal-500/50 text-slate-200 disabled:opacity-40 transition-colors flex items-center justify-center space-x-1.5"
              >
                <Unlock className="w-3.5 h-3.5 text-teal-400" />
                <span>Send Unlock Command</span>
              </button>

              <button
                onClick={() => toggleDoor('LOCK')}
                disabled={doorStatus === 'LOCKED'}
                className="py-2 px-3 rounded-lg text-xs font-medium bg-surface-card border border-surface-border hover:border-amber-500/50 text-slate-200 disabled:opacity-40 transition-colors flex items-center justify-center space-x-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Send Lock Command</span>
              </button>
            </div>
          </div>

          {/* Bluetooth Connection Fault Simulation */}
          <div className="p-4 rounded-xl bg-charcoal-900 border border-surface-border flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-200">Simulate Bluetooth Connection Drop</p>
              <p className="text-[11px] text-slate-400">
                Tests stale data detector & automatic reconnection banners
              </p>
            </div>
            {connection.state === 'CONNECTED' ? (
              <button
                onClick={() => simulateDisconnect()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-950/40 text-red-300 border border-red-800/40 hover:bg-red-900/40 transition-colors"
              >
                Drop Signal
              </button>
            ) : (
              <button
                onClick={() => connect()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500 text-slate-950 hover:bg-teal-400 transition-colors font-semibold"
              >
                Restore Link
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-surface-border bg-charcoal-850 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenConnectModal();
            }}
            className="text-xs text-teal-400 hover:text-teal-300 flex items-center space-x-1 font-medium"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Switch to Real STM32 Hardware Mode</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-surface-card border border-surface-border text-slate-300 hover:text-slate-100 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
