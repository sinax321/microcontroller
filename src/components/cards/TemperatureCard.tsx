import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Thermometer,
  AlertTriangle,
  Flame,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useHomeGuard } from '../../context/HomeGuardContext';

export const TemperatureCard: React.FC = () => {
  const { telemetry, tempHistory, settings, currentAlertLevel, connection } = useHomeGuard();

  const isStale = connection.isStale;
  const temp = telemetry.temperature;

  // Compute session stats
  const temps = tempHistory.map((p) => p.temperature);
  const minTemp = temps.length > 0 ? Math.min(...temps).toFixed(1) : temp.toFixed(1);
  const maxTemp = temps.length > 0 ? Math.max(...temps).toFixed(1) : temp.toFixed(1);
  const avgTemp =
    temps.length > 0
      ? (temps.reduce((acc, v) => acc + v, 0) / temps.length).toFixed(1)
      : temp.toFixed(1);

  // Status badge styling
  const getStatusBadge = () => {
    if (isStale) {
      return {
        label: 'DATA STALE',
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        icon: AlertTriangle,
      };
    }
    switch (currentAlertLevel) {
      case 'CRITICAL':
        return {
          label: 'CRITICAL',
          color: 'bg-red-500/10 text-red-400 border-red-500/40 badge-glow-red animate-pulse',
          icon: Flame,
        };
      case 'WARNING':
        return {
          label: 'WARNING',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30 badge-glow-amber',
          icon: AlertTriangle,
        };
      case 'NORMAL':
      default:
        return {
          label: 'NORMAL',
          color: 'bg-teal-500/10 text-teal-300 border-teal-500/30 badge-glow-teal',
          icon: CheckCircle,
        };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  const getStrokeColor = () => {
    if (currentAlertLevel === 'CRITICAL') return '#EF4444';
    if (currentAlertLevel === 'WARNING') return '#F59E0B';
    return '#14B8A6';
  };

  const getGradientId = () => {
    if (currentAlertLevel === 'CRITICAL') return 'tempGradientCrit';
    if (currentAlertLevel === 'WARNING') return 'tempGradientWarn';
    return 'tempGradientNormal';
  };

  return (
    <div className="card-surface p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300">
      {/* Background ambient glow according to level */}
      {currentAlertLevel === 'CRITICAL' && (
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      )}
      {currentAlertLevel === 'WARNING' && (
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center text-teal-400">
              <Thermometer className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-slate-200">
                Live Temperature Telemetry
              </h2>
              <p className="text-xs text-slate-400">Thermal sensor (DS18B20 / LM35)</p>
            </div>
          </div>

          {/* State Badge */}
          <div
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono tracking-wider border transition-all ${statusBadge.color}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusBadge.label}</span>
          </div>
        </div>

        {/* Stale Data Warning Banner */}
        {isStale && (
          <div className="mb-4 px-3.5 py-2 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Telemetry stream paused. Sensor reading has not updated in over{' '}
                {settings.staleTimeoutSeconds}s.
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase text-amber-400/80 shrink-0 ml-2">
              STALE
            </span>
          </div>
        )}

        {/* Big Temperature Display */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between my-2 gap-2">
          <div className="flex items-baseline space-x-2">
            <span
              className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-mono transition-colors ${
                currentAlertLevel === 'CRITICAL'
                  ? 'text-red-400'
                  : currentAlertLevel === 'WARNING'
                  ? 'text-amber-400'
                  : 'text-slate-50'
              }`}
            >
              {temp.toFixed(1)}
            </span>
            <span className="text-2xl sm:text-3xl font-light text-slate-400">°C</span>
          </div>

          {/* Threshold references */}
          <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-400/70" />
              <span>Warn: &ge;{settings.warningThreshold}°C</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-red-400/70" />
              <span>Crit: &ge;{settings.criticalThreshold}°C</span>
            </div>
          </div>
        </div>

        {/* Live Recharts History Area */}
        <div className="h-44 sm:h-48 w-full mt-4 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={tempHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradientNormal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="tempGradientWarn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="tempGradientCrit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="time"
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                stroke="#475569"
                fontSize={10}
                domain={['dataMin - 2', 'dataMax + 4']}
                tickLine={false}
                axisLine={false}
                unit="°"
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#1E293B',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  color: '#F8FAFC',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                }}
                formatter={(val: unknown) => [
                  typeof val === 'number' ? `${val.toFixed(1)} °C` : `${Number(val || 0).toFixed(1)} °C`,
                  'Temperature',
                ]}
                labelFormatter={(label) => `Time: ${label}`}
              />

              {/* Warning threshold reference line */}
              <ReferenceLine
                y={settings.warningThreshold}
                stroke="#F59E0B"
                strokeDasharray="3 3"
                strokeOpacity={0.6}
              />

              {/* Critical threshold reference line */}
              <ReferenceLine
                y={settings.criticalThreshold}
                stroke="#EF4444"
                strokeDasharray="3 3"
                strokeOpacity={0.6}
              />

              <Area
                type="monotone"
                dataKey="temperature"
                stroke={getStrokeColor()}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${getGradientId()})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Card Footer: Session Stats & Timestamp */}
      <div className="pt-4 mt-2 border-t border-surface-border flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
            <span>
              Min: <strong className="text-slate-200 font-mono">{minTemp}°</strong>
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Max: <strong className="text-slate-200 font-mono">{maxTemp}°</strong>
            </span>
          </div>
          <div className="hidden sm:inline">
            Avg: <strong className="text-slate-200 font-mono">{avgTemp}°C</strong>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>
            Reading:{' '}
            {telemetry.timestamp
              ? new Date(telemetry.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};
