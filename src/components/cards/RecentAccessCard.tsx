import React from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { useHomeGuard } from '../../context/HomeGuardContext';
import { AccessEvent } from '../../types';

interface RecentAccessCardProps {
  onNavigateToActivity: () => void;
  onOpenMemberModal: () => void;
}

export const RecentAccessCard: React.FC<RecentAccessCardProps> = ({
  onNavigateToActivity,
  onOpenMemberModal,
}) => {
  const { accessEvents, members } = useHomeGuard();

  // Show up to 5 most recent access events
  const recentEvents = accessEvents.slice(0, 5);

  return (
    <div className="card-surface p-5 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center text-teal-400">
              <Users className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-slate-200">
                Recent Access
              </h2>
              <p className="text-xs text-slate-400">Perimeter RFID scanner (MFRC522 SPI)</p>
            </div>
          </div>

          <button
            onClick={onOpenMemberModal}
            className="text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors flex items-center space-x-1"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Manage Members</span>
          </button>
        </div>

        {/* Disclaimer per requirement: Do not claim someone is inside merely because card scanned */}
        <div className="mb-4 px-3 py-1.5 rounded-lg bg-surface-card/60 border border-surface-border text-[11px] text-slate-400">
          Logs record credential badge reads at the door reader. Events reflect scan history, not verified internal room occupancy.
        </div>

        {/* List of recent events */}
        {recentEvents.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
            <CreditCard className="w-8 h-8 text-slate-500 stroke-[1.5]" />
            <p>No RFID access events recorded in current session.</p>
            <p className="text-[11px] text-slate-400">
              Tap a card in Demo Mode or scan an RFID tag on the MFRC522 sensor.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentEvents.map((evt: AccessEvent) => {
              const isGranted = evt.result === 'GRANTED';
              return (
                <div
                  key={evt.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                    isGranted
                      ? 'bg-charcoal-850/60 border-surface-border hover:border-teal-500/30'
                      : 'bg-red-950/20 border-red-900/30 hover:border-red-800/40'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isGranted
                          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {isGranted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {evt.memberName}
                        </span>
                        {evt.memberId && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-card border border-surface-border text-slate-400">
                            {evt.memberId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <span className="font-mono">UID: {evt.uid}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <span
                      className={`text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full ${
                        isGranted
                          ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {evt.result}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1 mt-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        {new Date(evt.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 mt-4 border-t border-surface-border flex items-center justify-between text-xs">
        <span className="text-slate-400">
          Registered Members: <strong className="text-slate-200">{members.length}</strong>
        </span>

        <button
          onClick={onNavigateToActivity}
          className="text-teal-400 hover:text-teal-300 font-medium flex items-center space-x-1 transition-colors"
        >
          <span>Full History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
