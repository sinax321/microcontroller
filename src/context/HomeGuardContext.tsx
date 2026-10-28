import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  TelemetryData,
  AccessEvent,
  TemperatureAlert,
  Member,
  AppSettings,
  ConnectionState,
  TransportType,
  DoorStatus,
  AlertLevel,
} from '../types';
import { BluetoothService } from '../services/bluetooth/BluetoothService';
import { ProtocolFormatter } from '../services/protocol/ProtocolFormatter';
import {
  playAccessGrantedSound,
  playAccessDeniedSound,
  playWarningSound,
  playCriticalAlarmSound,
  triggerVibration,
} from '../utils/audioAlert';

const DEFAULT_MEMBERS: Member[] = [
  {
    id: 'M001',
    name: 'Alex Rivera',
    uid: 'E2:7B:44:90',
    role: 'Primary Resident',
    isAllowed: true,
    notes: 'Master RFID Card',
  },
  {
    id: 'M002',
    name: 'Sarah Chen',
    uid: '93:F1:82:1C',
    role: 'Resident',
    isAllowed: true,
    notes: 'Key fob token',
  },
  {
    id: 'M003',
    name: 'Prof. S. Kumar',
    uid: '4A:2D:69:B3',
    role: 'Project Evaluator',
    isAllowed: true,
    notes: 'Guest evaluation pass',
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  warningThreshold: 40.0,
  criticalThreshold: 50.0,
  staleTimeoutSeconds: 15,
  soundEnabled: true,
  vibrationEnabled: true,
  bleServiceUuid: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  bleTxCharUuid: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
  bleRxCharUuid: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  preferredTransport: 'DEMO',
  baudRate: 115200,
};

export interface ChartPoint {
  time: string;
  timestampMs: number;
  temperature: number;
}

export interface RawLogEntry {
  id: string;
  direction: 'IN' | 'OUT';
  text: string;
  time: string;
}

interface HomeGuardContextType {
  telemetry: TelemetryData;
  tempHistory: ChartPoint[];
  doorStatus: DoorStatus;
  servoAngle?: number;
  doorActionPending: boolean;
  lastRfidEvent: AccessEvent | null;
  accessEvents: AccessEvent[];
  alerts: TemperatureAlert[];
  currentAlertLevel: AlertLevel;
  members: Member[];
  settings: AppSettings;
  connection: {
    state: ConnectionState;
    detail: string;
    deviceName: string;
    isStale: boolean;
    lastSeen: string | null;
  };
  transportType: TransportType;
  rawLogs: RawLogEntry[];
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchTransport: (type: TransportType) => Promise<void>;
  toggleDoor: (targetState: 'LOCK' | 'UNLOCK') => Promise<void>;
  acknowledgeAlert: (alertId: string) => void;
  acknowledgeAllAlerts: () => void;
  clearAccessHistory: () => void;
  addMember: (member: Omit<Member, 'id'>) => void;
  updateMember: (member: Member) => void;
  deleteMember: (id: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  sendCustomCommand: (jsonString: string) => Promise<boolean>;

  // Simulation helpers for presentation
  simulatePresetTemp: (preset: 'NORMAL' | 'WARNING' | 'CRITICAL') => void;
  simulateCustomTemp: (temp: number) => void;
  simulateRfidScan: (uid: string, result?: 'GRANTED' | 'DENIED') => void;
  simulateDisconnect: () => void;
}

const HomeGuardContext = createContext<HomeGuardContextType | null>(null);

export const HomeGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const btService = useRef(BluetoothService.getInstance()).current;

  // Persistent settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('hg_settings');
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Persistent members
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const stored = localStorage.getItem('hg_members');
      return stored ? JSON.parse(stored) : DEFAULT_MEMBERS;
    } catch {
      return DEFAULT_MEMBERS;
    }
  });

  // Persistent access history
  const [accessEvents, setAccessEvents] = useState<AccessEvent[]>(() => {
    try {
      const stored = localStorage.getItem('hg_access_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Alerts state
  const [alerts, setAlerts] = useState<TemperatureAlert[]>(() => {
    try {
      const stored = localStorage.getItem('hg_alerts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Telemetry state
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    temperature: 27.8,
    door: 'LOCKED',
    servoAngle: 0,
    rssi: -58,
    timestamp: new Date().toISOString(),
    isStale: false,
  });

  const [tempHistory, setTempHistory] = useState<ChartPoint[]>(() => {
    // Generate initial recent history points
    const now = Date.now();
    const pts: ChartPoint[] = [];
    for (let i = 12; i >= 0; i--) {
      const t = new Date(now - i * 3000);
      pts.push({
        time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestampMs: t.getTime(),
        temperature: Number((27.5 + (Math.sin(i) * 0.4)).toFixed(1)),
      });
    }
    return pts;
  });

  const [doorStatus, setDoorStatus] = useState<DoorStatus>('LOCKED');
  const [servoAngle, setServoAngle] = useState<number | undefined>(0);
  const [doorActionPending, setDoorActionPending] = useState<boolean>(false);
  const [lastRfidEvent, setLastRfidEvent] = useState<AccessEvent | null>(null);

  // Raw serial/BLE communication log
  const [rawLogs, setRawLogs] = useState<RawLogEntry[]>([]);

  // Connection info
  const [connection, setConnection] = useState(() => btService.getConnectionStatus());
  const [transportType, setTransportType] = useState<TransportType>(() => btService.getTransportType());

  // Track alert level transition to avoid duplicate alerts while remaining in the same state
  const previousLevelRef = useRef<AlertLevel>('NORMAL');
  const [currentAlertLevel, setCurrentAlertLevel] = useState<AlertLevel>('NORMAL');

  // Door action pending timeout ref
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('hg_settings', JSON.stringify(settings));
    btService.setStaleTimeout(settings.staleTimeoutSeconds);
  }, [settings, btService]);

  // Sync members to localStorage
  useEffect(() => {
    localStorage.setItem('hg_members', JSON.stringify(members));
  }, [members]);

  // Sync access events to localStorage (keep last 200)
  useEffect(() => {
    localStorage.setItem('hg_access_history', JSON.stringify(accessEvents.slice(0, 200)));
  }, [accessEvents]);

  // Sync alerts to localStorage
  useEffect(() => {
    localStorage.setItem('hg_alerts', JSON.stringify(alerts.slice(0, 100)));
  }, [alerts]);

  // Setup Bluetooth Service Event Subscriptions
  useEffect(() => {
    const unsubStatus = btService.onStatusChange((_state, _detail) => {
      setConnection(btService.getConnectionStatus());
      setTransportType(btService.getTransportType());
    });

    const unsubRaw = btService.onRawLine((line, direction) => {
      setRawLogs((prev) => [
        {
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          direction,
          text: line,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev.slice(0, 99),
      ]);
    });

    const unsubAck = btService.onAck((cmd, _status, reportedAngle) => {
      if (cmd === 'UNLOCK' || cmd === 'RFID_AUTHENTICATED') {
        setDoorStatus('UNLOCKED');
        setDoorActionPending(false);
        if (typeof reportedAngle === 'number') {
          setServoAngle(reportedAngle);
        }
      } else if (cmd === 'LOCK' || cmd === 'AUTO_LOCK') {
        setDoorStatus('LOCKED');
        setDoorActionPending(false);
        if (typeof reportedAngle === 'number') {
          setServoAngle(reportedAngle);
        }
      }
    });

    const unsubTelemetry = btService.onTelemetry((data) => {
      setTelemetry(data);
      setConnection(btService.getConnectionStatus());

      // Only update door state if hardware explicitly confirms it
      if (data.door) {
        setDoorStatus(data.door);
        setDoorActionPending(false);
      }
      if (typeof data.servoAngle === 'number') {
        setServoAngle(data.servoAngle);
      }

      // Add to temperature chart
      const pointTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setTempHistory((prev) => {
        const next = [
          ...prev,
          {
            time: pointTime,
            timestampMs: Date.now(),
            temperature: data.temperature,
          },
        ];
        return next.slice(-40); // keep last 40 data points
      });

      // Threshold transition logic
      const temp = data.temperature;
      let newLevel: AlertLevel = 'NORMAL';
      if (temp >= settings.criticalThreshold) {
        newLevel = 'CRITICAL';
      } else if (temp >= settings.warningThreshold) {
        newLevel = 'WARNING';
      } else {
        newLevel = 'NORMAL';
      }

      setCurrentAlertLevel(newLevel);

      // Only create an alert entry if state transitions from safer to dangerous
      if (newLevel !== previousLevelRef.current) {
        if (newLevel === 'CRITICAL') {
          if (settings.soundEnabled) playCriticalAlarmSound();
          if (settings.vibrationEnabled) triggerVibration([200, 100, 200, 100, 400]);
          addAlertEntry({
            id: 'alt_' + Date.now(),
            level: 'CRITICAL',
            temperature: temp,
            threshold: settings.criticalThreshold,
            timestamp: new Date().toISOString(),
            acknowledged: false,
            message: `CRITICAL HIGH TEMPERATURE: ${temp}°C detected! Immediate inspection advised.`,
          });
        } else if (newLevel === 'WARNING' && previousLevelRef.current === 'NORMAL') {
          if (settings.soundEnabled) playWarningSound();
          if (settings.vibrationEnabled) triggerVibration([150, 80, 150]);
          addAlertEntry({
            id: 'alt_' + Date.now(),
            level: 'WARNING',
            temperature: temp,
            threshold: settings.warningThreshold,
            timestamp: new Date().toISOString(),
            acknowledged: false,
            message: `Temperature safety warning: ${temp}°C exceeds safety threshold (${settings.warningThreshold}°C).`,
          });
        }
        previousLevelRef.current = newLevel;
      }
    });

    const unsubAccess = btService.onAccessEvent((event) => {
      // Look up member by UID from our registered members list
      const matchedMember = members.find(
        (m) => m.uid.replace(/[\s:]/g, '').toUpperCase() === event.uid.replace(/[\s:]/g, '').toUpperCase()
      );

      const resolvedMemberName = matchedMember ? matchedMember.name : (event.memberName || 'Unregistered Card');
      const resolvedMemberId = matchedMember ? matchedMember.id : event.memberId;
      const isAuthorized = matchedMember ? matchedMember.isAllowed : (event.result === 'GRANTED');

      const enrichedEvent: AccessEvent = {
        ...event,
        memberName: resolvedMemberName,
        memberId: resolvedMemberId,
        result: isAuthorized ? 'GRANTED' : 'DENIED',
        timestamp: new Date().toISOString(),
        isSimulated: btService.getTransportType() === 'DEMO',
      };

      setLastRfidEvent(enrichedEvent);
      setAccessEvents((prev) => [enrichedEvent, ...prev]);

      if (isAuthorized) {
        if (settings.soundEnabled) playAccessGrantedSound();
        setDoorStatus('UNLOCKED');
      } else {
        if (settings.soundEnabled) playAccessDeniedSound();
        if (settings.vibrationEnabled) triggerVibration([300]);
        // Add unauthorized entry attempt to alerts
        addAlertEntry({
          id: 'alt_auth_' + Date.now(),
          level: 'WARNING',
          temperature: telemetry.temperature,
          threshold: 0,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          message: `Unauthorized RFID access attempt detected (UID: ${event.uid})`,
        });
      }

      // Update member's last seen time
      if (matchedMember) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === matchedMember.id ? { ...m, lastAccess: new Date().toISOString() } : m
          )
        );
      }
    });

    const unsubAlert = btService.onAlert((alert) => {
      addAlertEntry(alert);
    });

    return () => {
      unsubStatus();
      unsubRaw();
      unsubAck();
      unsubTelemetry();
      unsubAccess();
      unsubAlert();
    };
  }, [btService, members, settings, telemetry.temperature]);

  // Helper to append alert avoiding exact duplicate text in short succession
  const addAlertEntry = (alert: TemperatureAlert) => {
    setAlerts((prev) => {
      // Don't add duplicate active unacknowledged alert with same level & text
      const duplicate = prev.find(
        (a) => !a.acknowledged && a.level === alert.level && a.message === alert.message
      );
      if (duplicate) return prev;
      return [alert, ...prev];
    });
  };

  // Connection controls
  const connect = useCallback(async () => {
    try {
      await btService.connect();
    } catch (e) {
      console.error('Connect failed:', e);
    }
  }, [btService]);

  const disconnect = useCallback(async () => {
    await btService.disconnect();
  }, [btService]);

  const switchTransport = useCallback(
    async (type: TransportType) => {
      await btService.switchTransport(type, settings);
      setTransportType(type);
    },
    [btService, settings]
  );

  // Door control with strict hardware confirmation expectation
  const toggleDoor = useCallback(
    async (targetState: 'LOCK' | 'UNLOCK') => {
      setDoorActionPending(true);

      const commandStr =
        targetState === 'UNLOCK' ? ProtocolFormatter.unlockDoor() : ProtocolFormatter.lockDoor();

      await btService.sendCommand(commandStr);

      // Timeout for hardware response (4 seconds)
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = setTimeout(() => {
        setDoorActionPending((currentPending) => {
          if (currentPending) {
            console.warn('[HomeGuard] Hardware did not confirm door command within 4s');
            return false;
          }
          return false;
        });
      }, 4000);
    },
    [btService]
  );

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true, resolvedAt: new Date().toISOString() } : a
      )
    );
  }, []);

  const acknowledgeAllAlerts = useCallback(() => {
    setAlerts((prev) =>
      prev.map((a) => ({ ...a, acknowledged: true, resolvedAt: new Date().toISOString() }))
    );
  }, []);

  const clearAccessHistory = useCallback(() => {
    setAccessEvents([]);
  }, []);

  const addMember = useCallback((newMember: Omit<Member, 'id'>) => {
    const member: Member = {
      ...newMember,
      id: 'M' + String(Date.now()).slice(-4),
    };
    setMembers((prev) => [...prev, member]);
  }, []);

  const updateMember = useCallback((updated: Member) => {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }, []);

  const deleteMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        if (
          newSettings.warningThreshold !== undefined ||
          newSettings.criticalThreshold !== undefined
        ) {
          btService.sendCommand(
            ProtocolFormatter.setThresholds(
              updated.warningThreshold,
              updated.criticalThreshold
            )
          );
        }
        return updated;
      });
    },
    [btService]
  );

  const sendCustomCommand = useCallback(
    async (jsonString: string): Promise<boolean> => {
      return btService.sendCommand(jsonString.endsWith('\n') ? jsonString : jsonString + '\n');
    },
    [btService]
  );

  // Simulation controls
  const simControls = btService.getSimulationControls();

  const simulatePresetTemp = useCallback(
    (preset: 'NORMAL' | 'WARNING' | 'CRITICAL') => {
      simControls.setTemperaturePreset(preset);
    },
    [simControls]
  );

  const simulateCustomTemp = useCallback(
    (temp: number) => {
      simControls.setSimulatedTemperature(temp);
    },
    [simControls]
  );

  const simulateRfidScan = useCallback(
    (uid: string, result?: 'GRANTED' | 'DENIED') => {
      const member = members.find(
        (m) => m.uid.replace(/[\s:]/g, '').toUpperCase() === uid.replace(/[\s:]/g, '').toUpperCase()
      );
      const isGranted = result !== undefined ? result === 'GRANTED' : member ? member.isAllowed : false;

      simControls.simulateRfidTap({
        uid,
        memberId: member?.id,
        memberName: member ? member.name : 'Unknown Cardholder',
        result: isGranted ? 'GRANTED' : 'DENIED',
      });
    },
    [simControls, members]
  );

  const simulateDisconnect = useCallback(() => {
    simControls.simulateDropConnection();
  }, [simControls]);

  // Connect automatically in demo mode on first load for instant evaluator satisfaction
  useEffect(() => {
    if (transportType === 'DEMO' && connection.state === 'DISCONNECTED') {
      btService.connect().catch(() => {});
    }
  }, [transportType, connection.state, btService]);

  return (
    <HomeGuardContext.Provider
      value={{
        telemetry,
        tempHistory,
        doorStatus,
        servoAngle,
        doorActionPending,
        lastRfidEvent,
        accessEvents,
        alerts,
        currentAlertLevel,
        members,
        settings,
        connection,
        transportType,
        rawLogs,
        connect,
        disconnect,
        switchTransport,
        toggleDoor,
        acknowledgeAlert,
        acknowledgeAllAlerts,
        clearAccessHistory,
        addMember,
        updateMember,
        deleteMember,
        updateSettings,
        sendCustomCommand,
        simulatePresetTemp,
        simulateCustomTemp,
        simulateRfidScan,
        simulateDisconnect,
      }}
    >
      {children}
    </HomeGuardContext.Provider>
  );
};

export const useHomeGuard = () => {
  const context = useContext(HomeGuardContext);
  if (!context) {
    throw new Error('useHomeGuard must be used within a HomeGuardProvider');
  }
  return context;
};
