import React, { useState } from 'react';
import {
  Users,
  Bluetooth,
  Sliders,
  Terminal,
  Cpu,
  Plus,
  Trash2,
  Edit2,
  Send,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useHomeGuard } from '../../context/HomeGuardContext';
import { Member } from '../../types';

interface SettingsViewProps {
  onOpenMemberModal: (member?: Member) => void;
  onOpenConnectModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenMemberModal,
  onOpenConnectModal,
}) => {
  const {
    settings,
    updateSettings,
    members,
    deleteMember,
    transportType,
    switchTransport,
    connection,
    rawLogs,
    sendCustomCommand,
  } = useHomeGuard();

  const [activeSubTab, setActiveSubTab] = useState<'DEVICE' | 'MEMBERS' | 'THRESHOLDS' | 'CONSOLE' | 'PINOUT'>('DEVICE');
  const [commandInput, setCommandInput] = useState('{"command":"UNLOCK"}');
  const [isSending, setIsSending] = useState(false);

  const handleSendCommand = async () => {
    if (!commandInput.trim()) return;
    setIsSending(true);
    await sendCustomCommand(commandInput);
    setIsSending(false);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
          System Configuration & Diagnostics
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Hardware transport, RFID credential management, safety thresholds, and STM32 serial bus console
        </p>
      </div>

      {/* Settings Sub-navigation Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveSubTab('DEVICE')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 shrink-0 transition-all ${
            activeSubTab === 'DEVICE'
              ? 'bg-teal-500 text-slate-950 shadow-sm'
              : 'bg-surface-card text-slate-400 hover:text-slate-200 border border-surface-border'
          }`}
        >
          <Bluetooth className="w-3.5 h-3.5" />
          <span>Device Connection</span>
        </button>

        <button
          onClick={() => setActiveSubTab('MEMBERS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 shrink-0 transition-all ${
            activeSubTab === 'MEMBERS'
              ? 'bg-teal-500 text-slate-950 shadow-sm'
              : 'bg-surface-card text-slate-400 hover:text-slate-200 border border-surface-border'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Member Directory ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('THRESHOLDS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 shrink-0 transition-all ${
            activeSubTab === 'THRESHOLDS'
              ? 'bg-teal-500 text-slate-950 shadow-sm'
              : 'bg-surface-card text-slate-400 hover:text-slate-200 border border-surface-border'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Safety Thresholds</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CONSOLE')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 shrink-0 transition-all ${
            activeSubTab === 'CONSOLE'
              ? 'bg-teal-500 text-slate-950 shadow-sm'
              : 'bg-surface-card text-slate-400 hover:text-slate-200 border border-surface-border'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Raw Protocol Console</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PINOUT')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 shrink-0 transition-all ${
            activeSubTab === 'PINOUT'
              ? 'bg-teal-500 text-slate-950 shadow-sm'
              : 'bg-surface-card text-slate-400 hover:text-slate-200 border border-surface-border'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Hardware Pinout Guide</span>
        </button>
      </div>

      {/* Tab 1: Device Connection */}
      {activeSubTab === 'DEVICE' && (
        <div className="space-y-6">
          <div className="card-surface p-5 sm:p-6 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Transport Layer Selection
              </h2>
              <p className="text-xs text-slate-400">
                HomeGuard isolates the communication layer so you can toggle between simulation, Web Bluetooth BLE, or Web Serial UART.
              </p>
            </div>

            {/* Transport Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Demo */}
              <div
                onClick={() => switchTransport('DEMO')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  transportType === 'DEMO'
                    ? 'bg-teal-950/30 border-teal-500 text-slate-100 shadow-[0_0_16px_rgba(20,184,166,0.15)]'
                    : 'bg-charcoal-850/60 border-surface-border hover:border-slate-600 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">Demo Simulation</span>
                  {transportType === 'DEMO' && (
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Virtual STM32 hardware with simulated temperature fluctuations, RFID scans, and virtual servo actuator.
                </p>
              </div>

              {/* Option 2: Web Bluetooth BLE */}
              <div
                onClick={() => switchTransport('BLE')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  transportType === 'BLE'
                    ? 'bg-teal-950/30 border-teal-500 text-slate-100 shadow-[0_0_16px_rgba(20,184,166,0.15)]'
                    : 'bg-charcoal-850/60 border-surface-border hover:border-slate-600 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">Web Bluetooth (BLE)</span>
                  {transportType === 'BLE' && (
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Direct GATT UART connection to HM-10, nRF52, or ESP32 BLE bridge. Requires Chrome or Edge on macOS/Android.
                </p>
              </div>

              {/* Option 3: Web Serial UART */}
              <div
                onClick={() => switchTransport('SERIAL')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  transportType === 'SERIAL'
                    ? 'bg-teal-950/30 border-teal-500 text-slate-100 shadow-[0_0_16px_rgba(20,184,166,0.15)]'
                    : 'bg-charcoal-850/60 border-surface-border hover:border-slate-600 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">Web Serial (USB/COM)</span>
                  {transportType === 'SERIAL' && (
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Direct connection via USB-UART adapter (CP2102/CH340) or HC-05 paired over Bluetooth Serial COM port.
                </p>
              </div>
            </div>

            {/* Transport details & parameters */}
            {transportType === 'BLE' && (
              <div className="p-4 rounded-xl bg-charcoal-900 border border-surface-border space-y-4">
                <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-teal-400">
                  BLE GATT Service Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Service UUID</label>
                    <input
                      type="text"
                      value={settings.bleServiceUuid}
                      onChange={(e) => updateSettings({ bleServiceUuid: e.target.value })}
                      className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">TX Characteristic (Notify)</label>
                    <input
                      type="text"
                      value={settings.bleTxCharUuid}
                      onChange={(e) => updateSettings({ bleTxCharUuid: e.target.value })}
                      className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {transportType === 'SERIAL' && (
              <div className="p-4 rounded-xl bg-charcoal-900 border border-surface-border space-y-4">
                <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-teal-400">
                  Serial Port Parameters
                </h3>
                <div className="w-full md:w-64 text-xs">
                  <label className="block text-slate-400 mb-1">UART Baud Rate</label>
                  <select
                    value={settings.baudRate}
                    onChange={(e) => updateSettings({ baudRate: Number(e.target.value) })}
                    className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-teal-500"
                  >
                    <option value={9600}>9600 baud (Default HC-05)</option>
                    <option value={19200}>19200 baud</option>
                    <option value={38400}>38400 baud (HC-05 AT mode)</option>
                    <option value={57600}>57600 baud</option>
                    <option value={115200}>115200 baud (Recommended High Speed)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Connection Status Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-charcoal-850 border border-surface-border gap-4">
              <div>
                <span className="text-xs text-slate-400 block">Current Status:</span>
                <span className="text-sm font-semibold text-slate-100 flex items-center space-x-2 mt-0.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      connection.state === 'CONNECTED' ? 'bg-teal-400' : 'bg-slate-500'
                    }`}
                  />
                  <span>{connection.state}</span>
                  <span className="text-slate-400 font-normal">({connection.deviceName})</span>
                </span>
                <p className="text-xs text-slate-400 mt-1">{connection.detail}</p>
              </div>

              <button
                onClick={onOpenConnectModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow-sm self-start sm:self-auto"
              >
                Open Connection Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Member Directory */}
      {activeSubTab === 'MEMBERS' && (
        <div className="card-surface p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Registered RFID Credential Directory
              </h2>
              <p className="text-xs text-slate-400">
                Map physical RFID Card UIDs from the RC522 reader to human-readable names and permission roles.
              </p>
            </div>

            <button
              onClick={() => onOpenMemberModal()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal-850 border-b border-surface-border text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Role / Notes</th>
                  <th className="py-3 px-4">RFID UID Hex</th>
                  <th className="py-3 px-4">Access Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50 text-slate-300">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-surface-cardHover/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-100">
                      <div className="flex items-center space-x-2">
                        <span>{member.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-card border border-surface-border text-slate-400">
                          {member.id}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div>{member.role}</div>
                      {member.notes && <div className="text-[11px] text-slate-400 italic">{member.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-teal-300">
                      {member.uid}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          member.isAllowed
                            ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                            : 'bg-red-500/15 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {member.isAllowed ? <ShieldCheck className="w-3 h-3 text-teal-400" /> : <ShieldAlert className="w-3 h-3 text-red-400" />}
                        <span>{member.isAllowed ? 'Authorized' : 'Revoked'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => onOpenMemberModal(member)}
                        className="p-1.5 rounded-lg bg-surface-card hover:bg-surface-cardHover text-slate-300 hover:text-teal-300 border border-surface-border transition-colors"
                        title="Edit member details & UID"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete member ${member.name}?`)) {
                            deleteMember(member.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-surface-card hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-surface-border transition-colors"
                        title="Delete member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Safety Thresholds & Alarm Preferences */}
      {activeSubTab === 'THRESHOLDS' && (
        <div className="space-y-6">
          <div className="card-surface p-5 sm:p-6 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Temperature Safety Limits
              </h2>
              <p className="text-xs text-slate-400">
                Configure ambient temperature boundaries for automated visual and audible alerts.
              </p>
            </div>

            {/* Warning Threshold Slider */}
            <div className="p-4 rounded-xl bg-charcoal-900 border border-surface-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-400">Warning Threshold</span>
                <span className="font-mono text-sm font-bold text-amber-300">
                  {settings.warningThreshold}°C
                </span>
              </div>
              <input
                type="range"
                min="25"
                max="55"
                step="1"
                value={settings.warningThreshold}
                onChange={(e) => updateSettings({ warningThreshold: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Default: 40°C. Ambient readings above this level transition system state to WARNING.
              </p>
            </div>

            {/* Critical Threshold Slider */}
            <div className="p-4 rounded-xl bg-charcoal-900 border border-surface-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-red-400">Critical Danger Threshold</span>
                <span className="font-mono text-sm font-bold text-red-300">
                  {settings.criticalThreshold}°C
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="75"
                step="1"
                value={settings.criticalThreshold}
                onChange={(e) => updateSettings({ criticalThreshold: parseFloat(e.target.value) })}
                className="w-full accent-red-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Default: 50°C. Readings at or above this trigger CRITICAL alerts and high-frequency sound alarm.
              </p>
            </div>

            {/* Stale Connection Timeout */}
            <div className="p-4 rounded-xl bg-charcoal-900 border border-surface-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Stale Telemetry Timeout</span>
                <span className="font-mono text-sm font-bold text-slate-200">
                  {settings.staleTimeoutSeconds} seconds
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={settings.staleTimeoutSeconds}
                onChange={(e) => updateSettings({ staleTimeoutSeconds: parseInt(e.target.value) })}
                className="w-full accent-teal-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                If no telemetry packets arrive from STM32 within this interval, telemetry is marked stale.
              </p>
            </div>

            {/* Audio & Haptic Feedback Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-charcoal-900 border border-surface-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Synthesized Audio Alerts
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Web Audio API synthesized chimes & warning beeps
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                  className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl bg-charcoal-900 border border-surface-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Haptic Vibration
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Vibrates on supported Android & mobile devices
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.vibrationEnabled}
                  onChange={(e) => updateSettings({ vibrationEnabled: e.target.checked })}
                  className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Raw Microcontroller Console */}
      {activeSubTab === 'CONSOLE' && (
        <div className="card-surface p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-teal-400" />
                <span>Microcontroller Serial Bus Terminal</span>
              </h2>
              <p className="text-xs text-slate-400">
                Live raw stream of newline-delimited JSON packets transmitted and received over UART.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCommandInput('{"command":"UNLOCK"}')}
                className="px-2.5 py-1 rounded bg-surface-card border border-surface-border text-[11px] text-slate-300 hover:text-teal-300 font-mono"
              >
                UNLOCK
              </button>
              <button
                onClick={() => setCommandInput('{"command":"LOCK"}')}
                className="px-2.5 py-1 rounded bg-surface-card border border-surface-border text-[11px] text-slate-300 hover:text-amber-300 font-mono"
              >
                LOCK
              </button>
              <button
                onClick={() => setCommandInput('{"command":"PING"}')}
                className="px-2.5 py-1 rounded bg-surface-card border border-surface-border text-[11px] text-slate-300 hover:text-blue-300 font-mono"
              >
                PING
              </button>
            </div>
          </div>

          {/* Terminal output window */}
          <div className="bg-charcoal-950 border border-surface-border rounded-xl p-3 h-72 overflow-y-auto font-mono text-[11px] space-y-1 scrollbar-thin">
            {rawLogs.length === 0 ? (
              <div className="text-slate-500 italic py-8 text-center">
                Awaiting serial/BLE traffic... Packets will appear here in real-time.
              </div>
            ) : (
              rawLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start space-x-2 py-0.5 leading-relaxed ${
                    log.direction === 'IN' ? 'text-teal-300' : 'text-amber-300'
                  }`}
                >
                  <span className="text-slate-400 shrink-0">[{log.time}]</span>
                  <span
                    className={`shrink-0 font-bold ${
                      log.direction === 'IN' ? 'text-teal-400' : 'text-amber-400'
                    }`}
                  >
                    {log.direction === 'IN' ? '<< RX' : '>> TX'}
                  </span>
                  <span className="break-all">{log.text}</span>
                </div>
              ))
            )}
          </div>

          {/* Command injection bar */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder='Enter JSON command e.g. {"command":"UNLOCK"}'
              className="flex-1 bg-charcoal-900 border border-surface-border rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendCommand();
              }}
            />
            <button
              onClick={handleSendCommand}
              disabled={isSending}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Hardware Pinout Guide */}
      {activeSubTab === 'PINOUT' && (
        <div className="card-surface p-5 sm:p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              STM32F103C8T6 Hardware Pinout Reference
            </h2>
            <p className="text-xs text-slate-400">
              Schematic interconnects for the qualifier project hardware components.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Bluetooth Module */}
            <div className="p-4 rounded-xl bg-charcoal-900 border border-surface-border space-y-2">
              <div className="font-semibold text-teal-400 flex items-center space-x-2">
                <Bluetooth className="w-4 h-4" />
                <span>Bluetooth Module (HC-05 / HM-10)</span>
              </div>
              <ul className="space-y-1 text-slate-300">
                <li>VCC &rarr; 5V (HC-05) or 3.3V (HM-10)</li>
                <li>GND &rarr; GND</li>
                <li>TXD &rarr; STM32 PA10 (USART1_RX)</li>
                <li>RXD &rarr; STM32 PA9 (USART1_TX via 1k/2k divider)</li>
                <li>Baud Rate: 115,200 or 9,600 bps</li>
              </ul>
            </div>

            {/* RFID Reader */}
            <div className="p-4 rounded-xl bg-charcoal-900 border border-surface-border space-y-2">
              <div className="font-semibold text-teal-400 flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>RFID Reader (MFRC522 SPI1)</span>
              </div>
              <ul className="space-y-1 text-slate-300">
                <li>VCC &rarr; 3.3V (Strictly 3.3V!)</li>
                <li>RST &rarr; STM32 PB0</li>
                <li>GND &rarr; GND</li>
                <li>MISO &rarr; STM32 PA6 (SPI1_MISO)</li>
                <li>MOSI &rarr; STM32 PA7 (SPI1_MOSI)</li>
                <li>SCK  &rarr; STM32 PA5 (SPI1_SCK)</li>
                <li>SDA (SS) &rarr; STM32 PA4 (NSS)</li>
              </ul>
            </div>

            {/* Servo Actuator */}
            <div className="p-4 rounded-xl bg-charcoal-900 border border-surface-border space-y-2">
              <div className="font-semibold text-teal-400 flex items-center space-x-2">
                <Sliders className="w-4 h-4" />
                <span>Servo Motor (TowerPro SG90)</span>
              </div>
              <ul className="space-y-1 text-slate-300">
                <li>Red (VCC) &rarr; External 5V supply</li>
                <li>Brown (GND) &rarr; Common GND</li>
                <li>Orange (PWM) &rarr; STM32 PA0 (TIM2_CH1)</li>
                <li>Frequency: 50Hz (20ms period)</li>
                <li>0° (Locked): 1.0ms pulse</li>
                <li>90° (Unlocked): 2.0ms pulse</li>
              </ul>
            </div>

            {/* Temperature Sensor */}
            <div className="p-4 rounded-xl bg-charcoal-900 border border-surface-border space-y-2">
              <div className="font-semibold text-teal-400 flex items-center space-x-2">
                <Sliders className="w-4 h-4" />
                <span>Temperature Sensor (DS18B20 / LM35)</span>
              </div>
              <ul className="space-y-1 text-slate-300">
                <li>VCC &rarr; 3.3V or 5V</li>
                <li>GND &rarr; GND</li>
                <li>DQ / Out &rarr; STM32 PA1 (ADC1_IN1 or GPIO)</li>
                <li>Pull-up: 4.7k&Omega; resistor to 3.3V for DS18B20</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
