import { ConnectionState, TransportType } from '../../types';

export interface BluetoothTransport {
  getType(): TransportType;
  isConnected(): boolean;
  getDeviceName(): string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(data: string): Promise<boolean>;
  onData(callback: (chunk: string) => void): void;
  onStatusChange(callback: (state: ConnectionState, detail?: string) => void): void;
}
