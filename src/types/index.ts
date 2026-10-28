export type DoorStatus = 'LOCKED' | 'UNLOCKED' | 'PENDING' | 'UNKNOWN';
export type AccessResult = 'GRANTED' | 'DENIED';
export type AlertLevel = 'NORMAL' | 'WARNING' | 'CRITICAL';
export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
export type TransportType = 'DEMO' | 'BLE' | 'SERIAL';

export interface TelemetryData {
  temperature: number;
  door: DoorStatus;
  servoAngle?: number;
  rssi?: number;
  timestamp: string;
  isStale?: boolean;
}

export interface AccessEvent {
  id: string;
  type: 'access';
  uid: string;
  memberId?: string;
  memberName: string;
  result: AccessResult;
  timestamp: string;
  doorStateAfter?: DoorStatus;
  isSimulated?: boolean;
}

export interface TemperatureAlert {
  id: string;
  level: 'WARNING' | 'CRITICAL';
  temperature: number;
  threshold: number;
  timestamp: string;
  acknowledged: boolean;
  message: string;
  resolvedAt?: string;
}

export interface Member {
  id: string;
  name: string;
  uid: string; // RFID UID Hex, e.g. "A3:F2:9C:1B"
  role: string; // e.g. "Resident", "Admin", "Guest", "Qualifier Evaluator"
  isAllowed: boolean;
  notes?: string;
  lastAccess?: string;
}

export interface AppSettings {
  warningThreshold: number; // default 40
  criticalThreshold: number; // default 50
  staleTimeoutSeconds: number; // default 15
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  bleServiceUuid: string;
  bleTxCharUuid: string;
  bleRxCharUuid: string;
  preferredTransport: TransportType;
  baudRate: number; // for Web Serial, default 115200 or 9600
}

export interface Stm32Command {
  command: 'LOCK' | 'UNLOCK' | 'PING' | 'SET_THRESHOLDS' | 'GET_STATUS';
  warningThreshold?: number;
  criticalThreshold?: number;
}
