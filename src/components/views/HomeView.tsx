import React from 'react';
import {
  Thermometer,
  Shield,
  Activity,
  Cpu,
  Radio,
} from 'lucide-react';
import { useHomeGuard } from '../../context/HomeGuardContext';
import { TemperatureCard } from '../cards/TemperatureCard';
import { DoorStatusCard } from '../cards/DoorStatusCard';
import { RecentAccessCard } from '../cards/RecentAccessCard';
import { SafetyAlertCard } from '../cards/SafetyAlertCard';

interface HomeViewProps {
  onNavigateToActivity: () => void;
  onOpenMemberModal: () => void;
  onOpenConnectModal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateToActivity,
  onOpenMemberModal,
  onOpenConnectModal,
}) => {
  const {
    telemetry,
    doorStatus,
    currentAlertLevel,
    connection,
    transportType,
    accessEvents,
  } = useHomeGuard();

  const grantedCount = accessEvents.filter((e) => e.result === 'GRANTED').length;
  const deniedCount = accessEvents.filter((e) => e.result === 'DENIED').length;

  return (
    <div className="space-y-6">
      {/* Top System Health Overview Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Temperature */}
        <div className="card-surface p-4 flex items-center space-x-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              currentAlertLevel === 'CRITICAL'
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : currentAlertLevel === 'WARNING'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
            }`}
          >
            <Thermometer className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium block">
              Core Temp
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-100">
                {telemetry.temperature.toFixed(1)}°C
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                  currentAlertLevel === 'CRITICAL'
                    ? 'bg-red-950/60 text-red-300'
                    : currentAlertLevel === 'WARNING'
                    ? 'bg-amber-950/60 text-amber-300'
                    : 'bg-teal-950/60 text-teal-300'
                }`}
              >
                {currentAlertLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Door Perimeter */}
        <div className="card-surface p-4 flex items-center space-x-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              doorStatus === 'UNLOCKED'
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                : 'bg-surface-card text-amber-400 border border-surface-border'
            }`}
          >
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium block">
              Perimeter Door
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  doorStatus === 'UNLOCKED' ? 'text-teal-300' : 'text-slate-100'
                }`}
              >
                {doorStatus}
              </span>
              {telemetry.servoAngle !== undefined && (
                <span className="text-xs text-slate-400 font-mono">
                  ({telemetry.servoAngle}°)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 3: Access Today */}
        <div className="card-surface p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium block">
              RFID Scans
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-100">
                {accessEvents.length}
              </span>
              <div className="flex items-center space-x-1 text-[11px] font-mono">
                <span className="text-teal-400">{grantedCount}✓</span>
                <span className="text-slate-500">/</span>
                <span className="text-red-400">{deniedCount}✗</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 4: Communication Link */}
        <div
          onClick={onOpenConnectModal}
          className="card-surface p-4 flex items-center space-x-3.5 cursor-pointer hover:border-teal-500/40 transition-colors group"
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              connection.state === 'CONNECTED'
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                : 'bg-surface-card text-slate-400 border border-surface-border'
            }`}
          >
            <Radio className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium block group-hover:text-teal-300 transition-colors">
              Link Transport
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-sm font-semibold truncate text-slate-100 font-mono">
                {transportType === 'DEMO'
                  ? 'Demo Simulation'
                  : transportType === 'BLE'
                  ? 'Web BLE GATT'
                  : 'Serial UART'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Column Desktop Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Temperature and Safety Alerts */}
        <div className="space-y-6">
          <TemperatureCard />
          <SafetyAlertCard />
        </div>

        {/* Right Column: Door Status & Recent Access */}
        <div className="space-y-6">
          <DoorStatusCard />
          <RecentAccessCard
            onNavigateToActivity={onNavigateToActivity}
            onOpenMemberModal={onOpenMemberModal}
          />
        </div>
      </div>

      {/* Hardware Qualifier System Architecture Strip */}
      <div className="card-surface p-4 border border-surface-border rounded-xl bg-charcoal-850/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="font-semibold text-slate-200">
              Target Architecture: STM32F103C8T6 ARM Cortex-M3 (72MHz)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 font-mono text-[11px]">
            <span>USART1: HC-05/BLE @ 115200</span>
            <span>SPI1: RC522 RFID</span>
            <span>TIM2_CH1: SG90 PWM (PA0)</span>
            <span>1-Wire/ADC: Temp (PA1)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
