import React, { useState } from 'react';
import {
  X,
  Bluetooth,
  Radio,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useHomeGuard } from '../../context/HomeGuardContext';
import { WebBleTransport } from '../../services/bluetooth/WebBleTransport';
import { WebSerialTransport } from '../../services/bluetooth/WebSerialTransport';
import { TransportType } from '../../types';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const {
    connection,
    transportType,
    switchTransport,
    connect,
    disconnect,
  } = useHomeGuard();

  const [selectedTransport, setSelectedTransport] = useState<TransportType>(transportType);
  const [connecting, setConnecting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const bleCheck = WebBleTransport.isSupported();
  const serialCheck = WebSerialTransport.isSupported();

  const handleConnectAction = async () => {
    setModalError(null);
    setConnecting(true);

    try {
      if (selectedTransport !== transportType) {
        await switchTransport(selectedTransport);
      }
      await connect();
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setModalError(error.message || 'Connection failed.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-charcoal-850">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Bluetooth className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Hardware Connection Manager
              </h3>
              <p className="text-xs text-slate-400">
                Pair with physical STM32 Bluetooth module or launch simulation
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
        <div className="p-6 space-y-4">
          {modalError && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Transport Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select Communication Transport:
            </label>

            {/* Option 1: Demo */}
            <div
              onClick={() => setSelectedTransport('DEMO')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedTransport === 'DEMO'
                  ? 'bg-teal-950/30 border-teal-500 text-slate-100 shadow-[0_0_12px_rgba(20,184,166,0.15)]'
                  : 'bg-charcoal-850/60 border-surface-border hover:border-slate-600 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span className="font-semibold text-xs sm:text-sm">
                    Demo Mode (Virtual STM32 Simulation)
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30">
                  READY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Zero hardware required. Generate realistic temperature variations, test door lock transitions, and simulate RFID scans.
              </p>
            </div>

            {/* Option 2: Web Bluetooth BLE */}
            <div
              onClick={() => setSelectedTransport('BLE')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedTransport === 'BLE'
                  ? 'bg-teal-950/30 border-teal-500 text-slate-100 shadow-[0_0_12px_rgba(20,184,166,0.15)]'
                  : 'bg-charcoal-850/60 border-surface-border hover:border-slate-600 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Bluetooth className="w-4 h-4 text-teal-400" />
                  <span className="font-semibold text-xs sm:text-sm">
                    Physical Bluetooth BLE (HM-10 / ESP32)
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    bleCheck.supported
                      ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {bleCheck.supported ? 'BROWSER SUPPORTED' : 'NOT DETECTED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Web Bluetooth GATT connection. Works on Google Chrome / Microsoft Edge on macOS, Windows, and Android over HTTPS.
              </p>
              {!bleCheck.supported && (
                <p className="text-[11px] text-amber-400/90 mt-1.5 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{bleCheck.reason}</span>
                </p>
              )}
            </div>

            {/* Option 3: Web Serial UART */}
            <div
              onClick={() => setSelectedTransport('SERIAL')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedTransport === 'SERIAL'
                  ? 'bg-teal-950/30 border-teal-500 text-slate-100 shadow-[0_0_12px_rgba(20,184,166,0.15)]'
                  : 'bg-charcoal-850/60 border-surface-border hover:border-slate-600 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Radio className="w-4 h-4 text-teal-400" />
                  <span className="font-semibold text-xs sm:text-sm">
                    Web Serial Port (USB-UART / Paired HC-05)
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    serialCheck.supported
                      ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                      : 'bg-slate-700/40 text-slate-400 border-slate-700'
                  }`}
                >
                  {serialCheck.supported ? 'SUPPORTED' : 'DESKTOP ONLY'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Connect directly through USB-UART bridge or standard HC-05 Bluetooth SPP COM port on desktop browsers.
              </p>
            </div>
          </div>

          {/* Current State Indicator */}
          <div className="p-3 rounded-xl bg-charcoal-900 border border-surface-border flex items-center justify-between text-xs">
            <span className="text-slate-400">Active Link:</span>
            <span className="font-semibold text-slate-200 flex items-center space-x-1.5 font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  connection.state === 'CONNECTED' ? 'bg-teal-400' : 'bg-slate-500'
                }`}
              />
              <span>{connection.state}</span>
              <span className="text-slate-400">({connection.deviceName})</span>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-border bg-charcoal-850 flex items-center justify-between">
          {connection.state === 'CONNECTED' ? (
            <button
              onClick={async () => {
                await disconnect();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-950/40 text-red-300 border border-red-900/50 hover:bg-red-900/50 transition-colors"
            >
              Disconnect Current Link
            </button>
          ) : (
            <span className="text-xs text-slate-400">Ready to initiate session</span>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConnectAction}
              disabled={connecting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all flex items-center space-x-1.5 shadow-sm active:scale-95 disabled:opacity-50"
            >
              {connecting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{connecting ? 'Connecting...' : 'Connect Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
