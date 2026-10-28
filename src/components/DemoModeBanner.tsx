import React from 'react';
import { Sparkles, Thermometer, Radio, ShieldCheck, ShieldAlert, WifiOff, RefreshCw } from 'lucide-react';
import { useHomeGuard } from '../context/HomeGuardContext';

interface DemoModeBannerProps {
  onOpenConnectModal: () => void;
  onOpenSimModal: () => void;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({
  onOpenConnectModal,
  onOpenSimModal,
}) => {
  const {
    transportType,
    connection,
    simulatePresetTemp,
    simulateRfidScan,
    simulateDisconnect,
    connect,
  } = useHomeGuard();

  if (transportType !== 'DEMO') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-teal-950/40 via-surface-card to-charcoal-900 border-b border-teal-900/40 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        {/* Badge & Mode Disclaimer */}
        <div className="flex items-center space-x-2.5">
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>DEMO MODE ACTIVE</span>
          </span>
          <span className="text-xs text-slate-300 hidden sm:inline">
            Virtual STM32 hardware simulation active. Test safety alerts & RFID scans below:
          </span>
        </div>

        {/* Quick Test Bench Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {/* Normal Temp button */}
          <button
            onClick={() => simulatePresetTemp('NORMAL')}
            className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/40 transition-colors flex items-center space-x-1"
            title="Set temperature to normal room temp (27.4°C)"
          >
            <Thermometer className="w-3 h-3 text-emerald-400" />
            <span>27°C (Normal)</span>
          </button>

          {/* Warning Temp button */}
          <button
            onClick={() => simulatePresetTemp('WARNING')}
            className="px-2.5 py-1 rounded text-xs font-medium bg-amber-950/40 text-amber-300 border border-amber-800/40 hover:bg-amber-900/40 transition-colors flex items-center space-x-1"
            title="Set temperature to warning threshold (42.5°C)"
          >
            <Thermometer className="w-3 h-3 text-amber-400" />
            <span>42°C (Warning)</span>
          </button>

          {/* Critical Temp button */}
          <button
            onClick={() => simulatePresetTemp('CRITICAL')}
            className="px-2.5 py-1 rounded text-xs font-medium bg-red-950/40 text-red-300 border border-red-800/40 hover:bg-red-900/40 transition-colors flex items-center space-x-1"
            title="Set temperature to critical danger threshold (53.2°C)"
          >
            <Thermometer className="w-3 h-3 text-red-400" />
            <span>53°C (Critical)</span>
          </button>

          {/* Simulate RFID Tap Granted */}
          <button
            onClick={() => simulateRfidScan('E2:7B:44:90', 'GRANTED')}
            className="px-2.5 py-1 rounded text-xs font-medium bg-slate-800/80 text-slate-200 border border-slate-700 hover:border-teal-500/50 transition-colors flex items-center space-x-1"
            title="Simulate scanning authorized Member 1 RFID card"
          >
            <ShieldCheck className="w-3 h-3 text-teal-400" />
            <span>Tap Card (Granted)</span>
          </button>

          {/* Simulate RFID Tap Denied */}
          <button
            onClick={() => simulateRfidScan('99:FF:00:AA', 'DENIED')}
            className="px-2.5 py-1 rounded text-xs font-medium bg-slate-800/80 text-slate-200 border border-slate-700 hover:border-red-500/50 transition-colors flex items-center space-x-1"
            title="Simulate scanning unknown RFID token"
          >
            <ShieldAlert className="w-3 h-3 text-red-400" />
            <span>Unknown Card (Denied)</span>
          </button>

          {/* Simulate Disconnect / Reconnect */}
          {connection.state === 'CONNECTED' ? (
            <button
              onClick={() => simulateDisconnect()}
              className="px-2 py-1 rounded text-xs text-slate-400 hover:text-amber-300 transition-colors flex items-center space-x-1 border border-transparent hover:border-amber-900/40"
              title="Simulate Bluetooth link drop"
            >
              <WifiOff className="w-3 h-3" />
              <span className="hidden lg:inline">Drop Link</span>
            </button>
          ) : (
            <button
              onClick={() => connect()}
              className="px-2 py-1 rounded text-xs text-teal-300 hover:text-teal-200 transition-colors flex items-center space-x-1 border border-teal-800/50 bg-teal-950/30"
              title="Reconnect simulated device"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reconnect</span>
            </button>
          )}

          {/* Switch to real hardware */}
          <button
            onClick={onOpenConnectModal}
            className="text-xs text-teal-400 hover:text-teal-300 underline font-medium flex items-center space-x-1"
            title="Switch from simulation to physical STM32 Bluetooth device"
          >
            <Radio className="w-3 h-3" />
            <span>Hardware Mode</span>
          </button>

          {/* Full Simulation Bench trigger */}
          <button
            onClick={onOpenSimModal}
            className="ml-auto text-xs text-slate-300 hover:text-slate-100 font-medium px-2 py-0.5 rounded bg-surface-card border border-surface-border flex items-center space-x-1"
            title="Open comprehensive simulation controls"
          >
            <Sparkles className="w-3 h-3 text-teal-400" />
            <span>Sim Bench</span>
          </button>
        </div>
      </div>
    </div>
  );
};
