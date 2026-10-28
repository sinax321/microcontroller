import React from 'react';
import {
  Shield,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  AlertTriangle,
  Radio,
  Clock,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { useHomeGuard } from '../context/HomeGuardContext';
import { ConnectionState, TransportType } from '../types';

interface HeaderProps {
  onOpenConnectModal: () => void;
  onOpenSimModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenConnectModal, onOpenSimModal }) => {
  const { connection, transportType, disconnect, connect } = useHomeGuard();

  const getStatusBadge = (state: ConnectionState, isStale: boolean) => {
    if (isStale) {
      return {
        label: 'STALE DATA',
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400 animate-pulse',
        icon: AlertTriangle,
      };
    }
    switch (state) {
      case 'CONNECTED':
        return {
          label: 'CONNECTED',
          color: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
          dot: 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]',
          icon: BluetoothConnected,
        };
      case 'CONNECTING':
        return {
          label: 'PAIRING...',
          color: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
          dot: 'bg-blue-400 animate-ping',
          icon: Radio,
        };
      case 'ERROR':
        return {
          label: 'LINK FAULT',
          color: 'bg-red-500/10 text-red-400 border-red-500/30',
          dot: 'bg-red-400',
          icon: BluetoothOff,
        };
      case 'DISCONNECTED':
      default:
        return {
          label: 'DISCONNECTED',
          color: 'bg-slate-700/30 text-slate-400 border-slate-700',
          dot: 'bg-slate-500',
          icon: BluetoothOff,
        };
    }
  };

  const badge = getStatusBadge(connection.state, connection.isStale);
  const StatusIcon = badge.icon;

  const getTransportLabel = (type: TransportType) => {
    switch (type) {
      case 'DEMO':
        return 'Demo Mode (Simulated)';
      case 'BLE':
        return 'Web Bluetooth (GATT)';
      case 'SERIAL':
        return 'Web Serial (UART)';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-charcoal-900/90 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Application Name */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center text-teal-400 shadow-sm relative group">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />
              <div className="absolute -inset-0.5 rounded-xl bg-teal-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg sm:text-xl tracking-tight text-slate-100">
                  HomeGuard
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase bg-surface-card border border-surface-border text-slate-400">
                  STM32F103
                </span>
              </div>
              <p className="text-xs text-slate-400 tracking-normal hidden sm:block">
                Smart Home Security & Monitoring IoT System
              </p>
            </div>
          </div>

          {/* Connection status and actions */}
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            {/* Quick Demo Controls Button */}
            {transportType === 'DEMO' && (
              <button
                onClick={onOpenSimModal}
                className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-950/60 text-teal-300 border border-teal-800/60 hover:bg-teal-900/40 transition-colors"
                title="Open Simulation Test Bench"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Sim Controls</span>
              </button>
            )}

            {/* Connection Status Pill */}
            <div className="flex items-center space-x-2">
              <div
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${badge.color}`}
              >
                <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                <StatusIcon className="w-3.5 h-3.5" />
                <span className="hidden md:inline font-mono text-[11px] uppercase tracking-wide">
                  {badge.label}
                </span>
              </div>

              {/* Connected Device & Last seen */}
              <div className="hidden lg:flex flex-col text-right">
                <div className="flex items-center justify-end space-x-1 text-xs text-slate-300 font-medium">
                  <Cpu className="w-3 h-3 text-slate-400" />
                  <span className="truncate max-w-[140px]" title={connection.deviceName}>
                    {connection.deviceName}
                  </span>
                </div>
                <div className="flex items-center justify-end space-x-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>
                    {connection.lastSeen
                      ? new Date(connection.lastSeen).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : 'No signal'}
                  </span>
                </div>
              </div>
            </div>

            {/* Connect / Disconnect button */}
            {connection.state === 'CONNECTED' ? (
              <button
                onClick={() => disconnect()}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-card border border-surface-border text-slate-300 hover:text-red-400 hover:border-red-900/50 transition-colors"
              >
                <BluetoothOff className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (transportType === 'DEMO') {
                    connect();
                  } else {
                    onOpenConnectModal();
                  }
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-sm active:scale-95"
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span>Connect</span>
              </button>
            )}

            {/* Transport type indicator trigger */}
            <button
              onClick={onOpenConnectModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-card transition-colors border border-transparent hover:border-surface-border"
              title={`Active Transport: ${getTransportLabel(transportType)}. Click to configure.`}
            >
              <Radio className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
