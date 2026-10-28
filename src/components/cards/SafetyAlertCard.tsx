import React from 'react';
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  ShieldCheck,
  Clock,
  WifiOff,
  Info,
} from 'lucide-react';
import { useHomeGuard } from '../../context/HomeGuardContext';
import { TemperatureAlert } from '../../types';

export const SafetyAlertCard: React.FC = () => {
  const {
    telemetry,
    settings,
    alerts,
    currentAlertLevel,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    connection,
  } = useHomeGuard();

  const isStale = connection.isStale;
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="card-surface p-5 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                currentAlertLevel === 'CRITICAL'
                  ? 'bg-red-500/15 border-red-500/40 text-red-400'
                  : currentAlertLevel === 'WARNING'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-surface-card border-surface-border text-teal-400'
              }`}
            >
              {currentAlertLevel === 'CRITICAL' ? (
                <Flame className="w-5 h-5" />
              ) : currentAlertLevel === 'WARNING' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-slate-200">
                Safety Alerts & Incident Monitor
              </h2>
              <p className="text-xs text-slate-400">Thermal threshold logic & connection health</p>
            </div>
          </div>

          {unacknowledgedAlerts.length > 0 && (
            <button
              onClick={() => acknowledgeAllAlerts()}
              className="text-xs font-medium text-slate-300 hover:text-teal-300 transition-colors px-2.5 py-1 rounded-lg bg-surface-card border border-surface-border hover:border-teal-500/40"
            >
              Acknowledge All ({unacknowledgedAlerts.length})
            </button>
          )}
        </div>

        {/* Active Prominent Banner when in WARNING or CRITICAL or STALE */}
        {isStale && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-start space-x-3 text-amber-200">
            <WifiOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-semibold text-amber-300">Telemetry Stream Interrupted</div>
              <p className="text-amber-200/80">
                Microcontroller has not delivered a telemetry heartbeat for over {settings.staleTimeoutSeconds}s.
                Verify HC-05/BLE power and Bluetooth pairing.
              </p>
            </div>
          </div>
        )}

        {currentAlertLevel === 'CRITICAL' && (
          <div className="mb-4 p-4 rounded-xl bg-red-950/50 border border-red-800/60 shadow-lg shadow-red-950/20 text-red-100 animate-pulse-subtle">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <Flame className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-sm text-red-300 flex items-center space-x-2">
                    <span>CRITICAL THERMAL LEVEL DETECTED</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-red-900/60 text-red-200">
                      {telemetry.temperature.toFixed(1)}°C
                    </span>
                  </div>
                  <p className="text-xs text-red-200/90 leading-relaxed">
                    Reading exceeds critical threshold ({settings.criticalThreshold}°C).
                    Inspect equipment, verify cooling, or confirm sensor calibration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentAlertLevel === 'WARNING' && (
          <div className="mb-4 p-4 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-100">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-xs sm:text-sm text-amber-300 flex items-center space-x-2">
                  <span>Temperature Warning Threshold Reached</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-900/50 text-amber-200">
                    {telemetry.temperature.toFixed(1)}°C
                  </span>
                </div>
                <p className="text-xs text-amber-200/90">
                  Ambient temperature has crossed the {settings.warningThreshold}°C safety limit.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* System Normal state if no active warning/critical */}
        {currentAlertLevel === 'NORMAL' && !isStale && (
          <div className="mb-4 p-3.5 rounded-xl bg-teal-950/20 border border-teal-900/30 flex items-center space-x-3 text-teal-300">
            <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold">Thermal Conditions Normal:</span> Current sensor reading ({telemetry.temperature.toFixed(1)}°C) is comfortably below threshold ({settings.warningThreshold}°C).
            </div>
          </div>
        )}

        {/* Timestamped Alert History */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Recent Incident Log:</span>
            <span className="font-mono text-[11px]">{alerts.length} total events</span>
          </div>

          {alerts.length === 0 ? (
            <div className="py-5 text-center text-slate-400 text-xs">
              No alert incidents recorded in this session.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {alerts.slice(0, 4).map((alert: TemperatureAlert) => {
                const isCrit = alert.level === 'CRITICAL';
                return (
                  <div
                    key={alert.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                      alert.acknowledged
                        ? 'bg-charcoal-850/40 border-surface-border/60 text-slate-400'
                        : isCrit
                        ? 'bg-red-950/30 border-red-900/40 text-red-200'
                        : 'bg-amber-950/25 border-amber-900/35 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      {isCrit ? (
                        <Flame className="w-4 h-4 text-red-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-medium">{alert.message}</div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(alert.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                          {alert.acknowledged && (
                            <span className="text-teal-400 font-mono">(Acknowledged)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!alert.acknowledged ? (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-surface-card border border-surface-border hover:border-teal-500/50 text-slate-200 shrink-0 transition-colors"
                      >
                        Ack
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">Resolved</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Qualifier Compliance Disclaimer per Section 8 */}
      <div className="pt-3 mt-4 border-t border-surface-border text-[11px] text-slate-400 flex items-start space-x-2">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
        <p className="leading-tight">
          Disclaimer: HomeGuard is designed as an educational college IoT qualifier prototype. It is not certified for industrial safety, medical, or life-safety fire/gas alarm applications.
        </p>
      </div>
    </div>
  );
};
