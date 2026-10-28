import React, { useState } from 'react';
import {
  Users,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  Trash2,
  CreditCard,
  Check,
} from 'lucide-react';
import { useHomeGuard } from '../../context/HomeGuardContext';

export const ActivityView: React.FC = () => {
  const {
    accessEvents,
    alerts,
    clearAccessHistory,
    acknowledgeAlert,
    acknowledgeAllAlerts,
  } = useHomeGuard();

  const [activeTab, setActiveTab] = useState<'ACCESS' | 'ALERTS'>('ACCESS');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState<'ALL' | 'GRANTED' | 'DENIED'>('ALL');
  const [filterAlertLevel, setFilterAlertLevel] = useState<'ALL' | 'WARNING' | 'CRITICAL'>('ALL');

  // Filter access events
  const filteredEvents = accessEvents.filter((evt) => {
    const matchesSearch =
      evt.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.memberId && evt.memberId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesResult =
      filterResult === 'ALL' || evt.result === filterResult;

    return matchesSearch && matchesResult;
  });

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = alert.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel =
      filterAlertLevel === 'ALL' || alert.level === filterAlertLevel;
    return matchesSearch && matchesLevel;
  });

  // Export logs to CSV
  const exportToCSV = () => {
    if (activeTab === 'ACCESS') {
      const headers = ['Timestamp', 'Member ID', 'Member Name', 'UID', 'Result', 'Simulated'];
      const rows = filteredEvents.map((e) => [
        `"${e.timestamp}"`,
        `"${e.memberId || ''}"`,
        `"${e.memberName}"`,
        `"${e.uid}"`,
        `"${e.result}"`,
        `"${e.isSimulated ? 'YES' : 'NO'}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `homeguard-rfid-activity-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Timestamp', 'Level', 'Temperature (°C)', 'Threshold (°C)', 'Status', 'Message'];
      const rows = filteredAlerts.map((a) => [
        `"${a.timestamp}"`,
        `"${a.level}"`,
        `"${a.temperature}"`,
        `"${a.threshold}"`,
        `"${a.acknowledged ? 'ACKNOWLEDGED' : 'ACTIVE'}"`,
        `"${a.message.replace(/"/g, '""')}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `homeguard-safety-alerts-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header with Sub-tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
            Activity & Security Audits
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Chronological audit log for RFID door authentications and thermal safety incidents
          </p>
        </div>

        {/* Tab switchers: Access Events vs Safety Alerts */}
        <div className="flex items-center space-x-2 bg-surface-card p-1 rounded-xl border border-surface-border">
          <button
            onClick={() => setActiveTab('ACCESS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'ACCESS'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>RFID Access History ({accessEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ALERTS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'ALERTS'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Temperature Alerts ({alerts.length})</span>
          </button>
        </div>
      </div>

      {/* Action Toolbar: Search, Filters, Export, Clear */}
      <div className="card-surface p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'ACCESS'
                ? 'Search by member name, UID (e.g. E2:7B...), or ID...'
                : 'Search safety incident details...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-charcoal-900 border border-surface-border rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {activeTab === 'ACCESS' ? (
            <div className="flex items-center space-x-1.5 text-xs bg-charcoal-900 border border-surface-border rounded-xl p-1">
              <button
                onClick={() => setFilterResult('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterResult === 'ALL'
                    ? 'bg-surface-card text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterResult('GRANTED')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterResult === 'GRANTED'
                    ? 'bg-teal-500/20 text-teal-300'
                    : 'text-slate-400 hover:text-teal-400'
                }`}
              >
                Granted
              </button>
              <button
                onClick={() => setFilterResult('DENIED')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterResult === 'DENIED'
                    ? 'bg-red-500/20 text-red-300'
                    : 'text-slate-400 hover:text-red-400'
                }`}
              >
                Denied
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-xs bg-charcoal-900 border border-surface-border rounded-xl p-1">
              <button
                onClick={() => setFilterAlertLevel('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterAlertLevel === 'ALL'
                    ? 'bg-surface-card text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Levels
              </button>
              <button
                onClick={() => setFilterAlertLevel('WARNING')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterAlertLevel === 'WARNING'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-slate-400 hover:text-amber-400'
                }`}
              >
                Warning
              </button>
              <button
                onClick={() => setFilterAlertLevel('CRITICAL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterAlertLevel === 'CRITICAL'
                    ? 'bg-red-500/20 text-red-300'
                    : 'text-slate-400 hover:text-red-400'
                }`}
              >
                Critical
              </button>
            </div>
          )}

          {/* Export CSV Button */}
          <button
            onClick={exportToCSV}
            className="px-3 py-2 bg-surface-card hover:bg-surface-cardHover border border-surface-border rounded-xl text-xs font-medium text-slate-200 flex items-center space-x-1.5 transition-colors"
            title="Download CSV report for project submission"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export CSV</span>
          </button>

          {/* Clear or Ack Actions */}
          {activeTab === 'ACCESS' ? (
            <button
              onClick={() => {
                if (window.confirm('Clear all logged access events for this session?')) {
                  clearAccessHistory();
                }
              }}
              className="p-2 bg-surface-card hover:bg-red-950/40 hover:text-red-300 border border-surface-border hover:border-red-900/50 rounded-xl text-slate-400 transition-colors"
              title="Clear access log"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => acknowledgeAllAlerts()}
              className="px-3 py-2 bg-surface-card hover:bg-surface-cardHover border border-surface-border rounded-xl text-xs font-medium text-teal-400 flex items-center space-x-1.5 transition-colors"
              title="Acknowledge all pending alerts"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Ack All</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table or List */}
      <div className="card-surface overflow-hidden">
        {activeTab === 'ACCESS' ? (
          /* Access Event Table */
          filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
              <CreditCard className="w-8 h-8 text-slate-500 stroke-[1.5]" />
              <p>No matching RFID access events found.</p>
              <p className="text-[11px] text-slate-400">
                Trigger an RFID scan in Demo Mode or swipe a card on the RC522 scanner.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-charcoal-850 border-b border-surface-border text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Member ID</th>
                    <th className="py-3 px-4">RFID UID Hex</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Origin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-slate-300 font-normal">
                  {filteredEvents.map((evt) => {
                    const isGranted = evt.result === 'GRANTED';
                    return (
                      <tr
                        key={evt.id}
                        className="hover:bg-surface-cardHover/50 transition-colors"
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                              isGranted
                                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                                : 'bg-red-500/15 text-red-300 border border-red-500/30'
                            }`}
                          >
                            {isGranted ? (
                              <CheckCircle2 className="w-3 h-3 text-teal-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-400" />
                            )}
                            <span>{evt.result}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-100 whitespace-nowrap">
                          {evt.memberName}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                          {evt.memberId || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                          {evt.uid}
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(evt.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {evt.isSimulated ? (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
                              SIMULATED
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              HARDWARE
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Alerts Table */
          filteredAlerts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-teal-500/60 stroke-[1.5]" />
              <p>No safety alerts matching your filter.</p>
              <p className="text-[11px] text-slate-400">
                Adjust temperature thresholds or test simulated alert conditions in Demo Mode.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-charcoal-850 border-b border-surface-border text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Trigger Detail</th>
                    <th className="py-3 px-4">Reading</th>
                    <th className="py-3 px-4">Threshold</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-slate-300">
                  {filteredAlerts.map((alert) => {
                    const isCrit = alert.level === 'CRITICAL';
                    return (
                      <tr
                        key={alert.id}
                        className={`hover:bg-surface-cardHover/50 transition-colors ${
                          !alert.acknowledged
                            ? isCrit
                              ? 'bg-red-950/20'
                              : 'bg-amber-950/15'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                              isCrit
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {isCrit ? (
                              <Flame className="w-3 h-3 text-red-400" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                            )}
                            <span>{alert.level}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-200">
                          {alert.message}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                          {alert.temperature > 0 ? `${alert.temperature.toFixed(1)}°C` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                          {alert.threshold > 0 ? `${alert.threshold}°C` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(alert.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {!alert.acknowledged ? (
                            <button
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-card border border-surface-border hover:border-teal-500/50 text-slate-200 transition-colors"
                            >
                              Acknowledge
                            </button>
                          ) : (
                            <span className="text-[11px] font-mono text-teal-400/80">
                              ✓ Acknowledged
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Note on occupancy */}
      <div className="card-surface p-4 text-xs text-slate-400 space-y-1">
        <p className="font-medium text-slate-300">Access Event Audit Notice:</p>
        <p>
          Per qualifier guidelines, RFID authentication records indicate when an authorized credential was recognized by the MFRC522 reader. They do not constitute an occupancy presence sensor.
        </p>
      </div>
    </div>
  );
};
