import { BluetoothTransport } from './BluetoothTransport';
import { ConnectionState, TransportType } from '../../types';

// Standard Nordic UART Service (NUS) UUIDs commonly used by STM32 BLE modules (HM-10, nRF52, ESP32 BLE)
export const DEFAULT_NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const DEFAULT_NUS_RX_CHAR = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // Write
export const DEFAULT_NUS_TX_CHAR = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // Notify

// HM-10 / CC2541 common 16-bit UUIDs
export const HM10_SERVICE = '0000ffe0-0000-1000-8000-00805f9b34fb';
export const HM10_CHAR = '0000ffe1-0000-1000-8000-00805f9b34fb';

// Web Bluetooth API TypeScript ambient declarations
declare global {
  interface Navigator {
    bluetooth?: {
      getAvailability(): Promise<boolean>;
      requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
    };
  }
  interface BluetoothDevice extends EventTarget {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
  }
  interface BluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
  }
  interface BluetoothRemoteGATTService {
    uuid: string;
    getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
  }
  interface BluetoothRemoteGATTCharacteristic extends EventTarget {
    uuid: string;
    value?: DataView;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithResponse?(value: BufferSource): Promise<void>;
    writeValueWithoutResponse?(value: BufferSource): Promise<void>;
  }
  interface RequestDeviceOptions {
    filters?: Array<{
      name?: string;
      namePrefix?: string;
      services?: BluetoothServiceUUID[];
    }>;
    optionalServices?: BluetoothServiceUUID[];
    acceptAllDevices?: boolean;
  }
  type BluetoothServiceUUID = number | string;
  type BluetoothCharacteristicUUID = number | string;
}

export class WebBleTransport implements BluetoothTransport {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private txCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private onDataCallback?: (chunk: string) => void;
  private onStatusChangeCallback?: (state: ConnectionState, detail?: string) => void;
  private decoder = new TextDecoder('utf-8');
  private encoder = new TextEncoder();

  private serviceUuid: string;
  private txUuid: string;
  private rxUuid: string;

  constructor(
    serviceUuid = DEFAULT_NUS_SERVICE,
    txUuid = DEFAULT_NUS_TX_CHAR,
    rxUuid = DEFAULT_NUS_RX_CHAR
  ) {
    this.serviceUuid = serviceUuid.toLowerCase();
    this.txUuid = txUuid.toLowerCase();
    this.rxUuid = rxUuid.toLowerCase();
  }

  public getType(): TransportType {
    return 'BLE';
  }

  public isConnected(): boolean {
    return !!(this.server && this.server.connected);
  }

  public getDeviceName(): string {
    return this.device?.name || 'Unknown BLE Device';
  }

  public onData(callback: (chunk: string) => void): void {
    this.onDataCallback = callback;
  }

  public onStatusChange(callback: (state: ConnectionState, detail?: string) => void): void {
    this.onStatusChangeCallback = callback;
  }

  public static isSupported(): { supported: boolean; reason?: string } {
    if (typeof window === 'undefined') {
      return { supported: false, reason: 'Window object not available' };
    }
    if (!window.isSecureContext) {
      return {
        supported: false,
        reason: 'Web Bluetooth requires a Secure Context (HTTPS or localhost).',
      };
    }
    if (!navigator.bluetooth) {
      return {
        supported: false,
        reason:
          'Web Bluetooth API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Opera on Android, macOS, or Windows.',
      };
    }
    return { supported: true };
  }

  public async connect(): Promise<void> {
    const check = WebBleTransport.isSupported();
    if (!check.supported) {
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback('ERROR', check.reason);
      }
      throw new Error(check.reason);
    }

    try {
      this.notifyStatus('CONNECTING', 'Requesting Bluetooth device pairing...');

      const optionalServices = [
        DEFAULT_NUS_SERVICE,
        HM10_SERVICE,
        this.serviceUuid,
      ].filter((v, i, a) => a.indexOf(v) === i);

      // Open standard Web Bluetooth device picker dialog
      const device = await navigator.bluetooth!.requestDevice({
        acceptAllDevices: true,
        optionalServices,
      });

      this.device = device;
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));

      this.notifyStatus('CONNECTING', `Connecting to GATT server on ${device.name || 'device'}...`);
      const server = await device.gatt!.connect();
      this.server = server;

      // Find communication service
      let primaryService: BluetoothRemoteGATTService | null = null;
      try {
        primaryService = await server.getPrimaryService(this.serviceUuid);
      } catch {
        // Fallback to HM-10 or discover available services
        try {
          primaryService = await server.getPrimaryService(HM10_SERVICE);
        } catch {
          const services = await server.getPrimaryServices();
          if (services.length > 0) {
            primaryService = services[0];
          }
        }
      }

      if (!primaryService) {
        throw new Error('Could not find compatible UART / Serial GATT service on target device.');
      }

      // Find characteristics
      const chars = await primaryService.getCharacteristics();
      for (const char of chars) {
        const uuid = char.uuid.toLowerCase();
        if (uuid === this.txUuid || uuid === HM10_CHAR || uuid.includes('0003') || uuid.includes('ffe1')) {
          this.txCharacteristic = char;
        }
        if (uuid === this.rxUuid || uuid === HM10_CHAR || uuid.includes('0002') || uuid.includes('ffe1')) {
          this.rxCharacteristic = char;
        }
      }

      // If single characteristic handles both RX and TX (like HM-10)
      if (!this.txCharacteristic && chars.length > 0) {
        this.txCharacteristic = chars[0];
      }
      if (!this.rxCharacteristic && chars.length > 0) {
        this.rxCharacteristic = chars[0];
      }

      if (!this.txCharacteristic) {
        throw new Error('UART TX (Notify) characteristic not found on Bluetooth peripheral.');
      }

      // Subscribe to telemetry notifications
      await this.txCharacteristic.startNotifications();
      this.txCharacteristic.addEventListener(
        'characteristicvaluechanged',
        this.handleCharacteristicValueChanged.bind(this)
      );

      this.notifyStatus('CONNECTED', `Connected via BLE to ${device.name || 'STM32 Peripheral'}`);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('[WebBleTransport] Connect error:', error);
      let message = error.message || 'Connection failed';
      if (message.includes('User cancelled') || message.includes('cancelled')) {
        message = 'Device pairing was cancelled.';
      }
      this.notifyStatus('ERROR', message);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.server && this.server.connected) {
      this.server.disconnect();
    }
    this.server = null;
    this.device = null;
    this.rxCharacteristic = null;
    this.txCharacteristic = null;
    this.notifyStatus('DISCONNECTED', 'Bluetooth link closed');
  }

  public async send(data: string): Promise<boolean> {
    if (!this.isConnected() || !this.rxCharacteristic) {
      console.warn('[WebBleTransport] Cannot send: Not connected or missing RX characteristic');
      return false;
    }

    try {
      const encoded = this.encoder.encode(data);
      // Write in MTU-friendly chunks of 20 bytes (standard BLE GATT packet size)
      const chunkSize = 20;
      for (let i = 0; i < encoded.length; i += chunkSize) {
        const chunk = encoded.slice(i, i + chunkSize);
        if (this.rxCharacteristic.writeValueWithoutResponse) {
          await this.rxCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.rxCharacteristic.writeValue(chunk);
        }
        // Small delay between BLE packets to prevent buffer overflow in microcontroller
        if (i + chunkSize < encoded.length) {
          await new Promise((r) => setTimeout(r, 15));
        }
      }
      return true;
    } catch (err) {
      console.error('[WebBleTransport] Send failed:', err);
      return false;
    }
  }

  private handleCharacteristicValueChanged(event: Event) {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (target.value && this.onDataCallback) {
      const text = this.decoder.decode(target.value);
      this.onDataCallback(text);
    }
  }

  private handleDisconnect() {
    this.notifyStatus('DISCONNECTED', 'Bluetooth device disconnected');
  }

  private notifyStatus(state: ConnectionState, detail?: string) {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(state, detail);
    }
  }
}
