import { BluetoothTransport } from './BluetoothTransport';
import { SimulatedTransport } from './SimulatedTransport';
import { WebBleTransport } from './WebBleTransport';
import { WebSerialTransport } from './WebSerialTransport';
import { ProtocolParser, ParsedMessage } from '../protocol/ProtocolParser';
import {
  ConnectionState,
  TransportType,
  TelemetryData,
  AccessEvent,
  TemperatureAlert,
  AppSettings,
} from '../../types';

export class BluetoothService {
  private static instance: BluetoothService;
  private currentTransport: BluetoothTransport;
  private simulatedTransport: SimulatedTransport;
  private parser: ProtocolParser;

  private connectionState: ConnectionState = 'DISCONNECTED';
  private connectionDetail: string = 'System ready';
  private lastCommunicationTime: Date | null = null;
  private staleTimerId?: ReturnType<typeof setInterval>;
  private isDataStale: boolean = false;
  private staleTimeoutSec: number = 15;

  // Listeners
  private telemetryListeners = new Set<(data: TelemetryData) => void>();
  private accessEventListeners = new Set<(event: AccessEvent) => void>();
  private alertListeners = new Set<(alert: TemperatureAlert) => void>();
  private statusListeners = new Set<(state: ConnectionState, detail: string) => void>();
  private rawLineListeners = new Set<(line: string, direction: 'IN' | 'OUT') => void>();
  private ackListeners = new Set<(command: string, status: string, servoAngle?: number) => void>();

  private constructor() {
    this.simulatedTransport = new SimulatedTransport();
    this.currentTransport = this.simulatedTransport;

    this.parser = new ProtocolParser(
      this.handleParsedMessage.bind(this),
      (line) => this.notifyRawLine(line, 'IN')
    );

    this.bindTransportEvents(this.currentTransport);
    this.startStaleTelemetryWatcher();
  }

  public static getInstance(): BluetoothService {
    if (!BluetoothService.instance) {
      BluetoothService.instance = new BluetoothService();
    }
    return BluetoothService.instance;
  }

  public getSimulationControls(): SimulatedTransport {
    return this.simulatedTransport;
  }

  public getTransportType(): TransportType {
    return this.currentTransport.getType();
  }

  public getConnectionStatus(): {
    state: ConnectionState;
    detail: string;
    deviceName: string;
    isStale: boolean;
    lastSeen: string | null;
  } {
    return {
      state: this.connectionState,
      detail: this.connectionDetail,
      deviceName: this.currentTransport.getDeviceName(),
      isStale: this.isDataStale,
      lastSeen: this.lastCommunicationTime ? this.lastCommunicationTime.toISOString() : null,
    };
  }

  public setStaleTimeout(seconds: number) {
    this.staleTimeoutSec = Math.max(5, seconds);
  }

  /**
   * Switch transport layer based on user preference
   */
  public async switchTransport(type: TransportType, settings?: AppSettings): Promise<void> {
    if (this.currentTransport.isConnected()) {
      await this.disconnect();
    }

    switch (type) {
      case 'DEMO':
        this.currentTransport = this.simulatedTransport;
        break;
      case 'BLE':
        this.currentTransport = new WebBleTransport(
          settings?.bleServiceUuid,
          settings?.bleTxCharUuid,
          settings?.bleRxCharUuid
        );
        break;
      case 'SERIAL':
        this.currentTransport = new WebSerialTransport(settings?.baudRate || 115200);
        break;
    }

    this.bindTransportEvents(this.currentTransport);
    this.notifyStatus(
      'DISCONNECTED',
      `Switched to ${type === 'DEMO' ? 'Demo Mode' : type === 'BLE' ? 'Web Bluetooth' : 'Serial UART'}`
    );
  }

  public async connect(): Promise<void> {
    try {
      this.parser.resetBuffer();
      await this.currentTransport.connect();
    } catch (err) {
      console.error('[BluetoothService] Connect error:', err);
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.currentTransport.disconnect();
      this.isDataStale = false;
    } catch (err) {
      console.error('[BluetoothService] Disconnect error:', err);
    }
  }

  public async sendCommand(commandPayload: string): Promise<boolean> {
    this.notifyRawLine(commandPayload.trim(), 'OUT');
    return this.currentTransport.send(commandPayload);
  }

  // Event Subscription methods
  public onTelemetry(callback: (data: TelemetryData) => void): () => void {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  public onAccessEvent(callback: (event: AccessEvent) => void): () => void {
    this.accessEventListeners.add(callback);
    return () => this.accessEventListeners.delete(callback);
  }

  public onAlert(callback: (alert: TemperatureAlert) => void): () => void {
    this.alertListeners.add(callback);
    return () => this.alertListeners.delete(callback);
  }

  public onStatusChange(callback: (state: ConnectionState, detail: string) => void): () => void {
    this.statusListeners.add(callback);
    // Trigger immediately with current status
    callback(this.connectionState, this.connectionDetail);
    return () => this.statusListeners.delete(callback);
  }

  public onRawLine(callback: (line: string, direction: 'IN' | 'OUT') => void): () => void {
    this.rawLineListeners.add(callback);
    return () => this.rawLineListeners.delete(callback);
  }

  public onAck(callback: (command: string, status: string, servoAngle?: number) => void): () => void {
    this.ackListeners.add(callback);
    return () => this.ackListeners.delete(callback);
  }

  // --- Internal Handling ---

  private bindTransportEvents(transport: BluetoothTransport) {
    transport.onData((chunk) => {
      this.lastCommunicationTime = new Date();
      this.isDataStale = false;
      this.parser.pushChunk(chunk);
    });

    transport.onStatusChange((state, detail) => {
      this.notifyStatus(state, detail || '');
      if (state === 'CONNECTED') {
        this.lastCommunicationTime = new Date();
        this.isDataStale = false;
      }
    });
  }

  private handleParsedMessage(msg: ParsedMessage) {
    switch (msg.kind) {
      case 'telemetry':
        this.telemetryListeners.forEach((fn) => fn(msg.data));
        break;
      case 'access':
        this.accessEventListeners.forEach((fn) => fn(msg.data));
        break;
      case 'alert':
        this.alertListeners.forEach((fn) => fn(msg.data));
        break;
      case 'ack':
        this.ackListeners.forEach((fn) => fn(msg.command, msg.status, msg.servoAngle));
        break;
    }
  }

  private notifyStatus(state: ConnectionState, detail: string) {
    this.connectionState = state;
    this.connectionDetail = detail;
    this.statusListeners.forEach((fn) => fn(state, detail));
  }

  private notifyRawLine(line: string, direction: 'IN' | 'OUT') {
    this.rawLineListeners.forEach((fn) => fn(line, direction));
  }

  private startStaleTelemetryWatcher() {
    if (this.staleTimerId) clearInterval(this.staleTimerId);

    this.staleTimerId = setInterval(() => {
      if (this.connectionState === 'CONNECTED' && this.lastCommunicationTime) {
        const elapsedSec = (Date.now() - this.lastCommunicationTime.getTime()) / 1000;
        const nowStale = elapsedSec > this.staleTimeoutSec;

        if (nowStale !== this.isDataStale) {
          this.isDataStale = nowStale;
          if (this.isDataStale) {
            // Notify stale alert
            this.alertListeners.forEach((fn) =>
              fn({
                id: 'stale_' + Date.now(),
                level: 'WARNING',
                temperature: 0,
                threshold: 0,
                timestamp: new Date().toISOString(),
                acknowledged: false,
                message: `Sensor telemetry is stale: No data received for ${Math.round(elapsedSec)}s. Check Bluetooth link or STM32 power.`,
              })
            );
          }
        }
      } else {
        this.isDataStale = false;
      }
    }, 3000);
  }
}
