import { BluetoothTransport } from './BluetoothTransport';
import { ConnectionState, TransportType, DoorStatus } from '../../types';

export class SimulatedTransport implements BluetoothTransport {
  private connected: boolean = false;
  private deviceName: string = 'STM32-BluePill-SIM';
  private onDataCallback?: (chunk: string) => void;
  private onStatusChangeCallback?: (state: ConnectionState, detail?: string) => void;
  private telemetryIntervalId?: ReturnType<typeof setInterval>;
  private autoLockTimeoutId?: ReturnType<typeof setTimeout>;

  // Simulation State
  private currentTemp: number = 27.8;
  private targetTemp: number = 27.8;
  private doorState: DoorStatus = 'LOCKED';
  private servoAngle: number = 0; // 0 = locked, 90 = unlocked
  private rssi: number = -58;
  private warningThreshold: number = 40.0;
  private criticalThreshold: number = 50.0;

  public getType(): TransportType {
    return 'DEMO';
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public getDeviceName(): string {
    return this.connected ? this.deviceName : 'Disconnected (Demo)';
  }

  public onData(callback: (chunk: string) => void): void {
    this.onDataCallback = callback;
  }

  public onStatusChange(callback: (state: ConnectionState, detail?: string) => void): void {
    this.onStatusChangeCallback = callback;
  }

  public async connect(): Promise<void> {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback('CONNECTING', 'Initiating simulated STM32 Blue Pill bridge...');
    }

    // Realistic small delay to simulate handshake
    await new Promise((resolve) => setTimeout(resolve, 600));

    this.connected = true;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback('CONNECTED', 'Connected to Virtual STM32F103C8T6');
    }

    this.startTelemetryLoop();
  }

  public async disconnect(): Promise<void> {
    this.stopTelemetryLoop();
    this.connected = false;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback('DISCONNECTED', 'Demo transport disconnected');
    }
  }

  public async send(data: string): Promise<boolean> {
    if (!this.connected) return false;

    try {
      const parsed = JSON.parse(data.trim());
      if (parsed.command === 'UNLOCK') {
        this.doorState = 'UNLOCKED';
        this.servoAngle = 90;
        this.emitLine(JSON.stringify({
          type: 'ack',
          command: 'UNLOCK',
          status: 'CONFIRMED',
          servoAngle: 90,
          timestamp: new Date().toISOString(),
        }));
        this.emitImmediateTelemetry();

        // Optional auto-relock in simulation after 6 seconds
        if (this.autoLockTimeoutId) clearTimeout(this.autoLockTimeoutId);
        this.autoLockTimeoutId = setTimeout(() => {
          if (this.connected && this.doorState === 'UNLOCKED') {
            this.doorState = 'LOCKED';
            this.servoAngle = 0;
            this.emitLine(JSON.stringify({
              type: 'ack',
              command: 'AUTO_LOCK',
              status: 'CONFIRMED',
              servoAngle: 0,
              timestamp: new Date().toISOString(),
            }));
            this.emitImmediateTelemetry();
          }
        }, 6000);
      } else if (parsed.command === 'LOCK') {
        if (this.autoLockTimeoutId) clearTimeout(this.autoLockTimeoutId);
        this.doorState = 'LOCKED';
        this.servoAngle = 0;
        this.emitLine(JSON.stringify({
          type: 'ack',
          command: 'LOCK',
          status: 'CONFIRMED',
          servoAngle: 0,
          timestamp: new Date().toISOString(),
        }));
        this.emitImmediateTelemetry();
      } else if (parsed.command === 'SET_THRESHOLDS') {
        if (typeof parsed.warning === 'number') this.warningThreshold = parsed.warning;
        if (typeof parsed.critical === 'number') this.criticalThreshold = parsed.critical;
        this.emitLine(JSON.stringify({
          type: 'ack',
          command: 'SET_THRESHOLDS',
          status: 'UPDATED',
          warning: this.warningThreshold,
          critical: this.criticalThreshold,
        }));
      } else if (parsed.command === 'PING') {
        this.emitLine(JSON.stringify({
          type: 'ack',
          command: 'PONG',
          uptime: Math.floor(performance.now() / 1000),
        }));
      }
      return true;
    } catch {
      return false;
    }
  }

  // --- External controls to manipulate simulation during demos ---

  public setSimulatedTemperature(temp: number) {
    this.targetTemp = Math.round(temp * 10) / 10;
    this.currentTemp = this.targetTemp;
    if (this.connected) {
      this.emitImmediateTelemetry();
      this.checkAlerts();
    }
  }

  public setTemperaturePreset(preset: 'NORMAL' | 'WARNING' | 'CRITICAL') {
    switch (preset) {
      case 'NORMAL':
        this.setSimulatedTemperature(27.4);
        break;
      case 'WARNING':
        this.setSimulatedTemperature(42.5);
        break;
      case 'CRITICAL':
        this.setSimulatedTemperature(53.2);
        break;
    }
  }

  public simulateRfidTap(options: {
    uid: string;
    memberId?: string;
    memberName: string;
    result: 'GRANTED' | 'DENIED';
  }) {
    if (!this.connected) return;

    // Send access event
    const accessMsg = JSON.stringify({
      type: 'access',
      uid: options.uid,
      memberId: options.memberId || 'M_UNKNOWN',
      memberName: options.memberName,
      result: options.result,
      timestamp: new Date().toISOString(),
    });
    this.emitLine(accessMsg);

    // If access was granted, servo unlocks door
    if (options.result === 'GRANTED') {
      this.doorState = 'UNLOCKED';
      this.servoAngle = 90;
      this.emitLine(JSON.stringify({
        type: 'ack',
        command: 'RFID_AUTHENTICATED',
        status: 'DOOR_UNLOCKED',
        servoAngle: 90,
      }));
      this.emitImmediateTelemetry();

      // Auto-lock servo after 5 seconds
      if (this.autoLockTimeoutId) clearTimeout(this.autoLockTimeoutId);
      this.autoLockTimeoutId = setTimeout(() => {
        if (this.connected) {
          this.doorState = 'LOCKED';
          this.servoAngle = 0;
          this.emitImmediateTelemetry();
        }
      }, 5000);
    }
  }

  public simulateDropConnection() {
    if (!this.connected) return;
    this.stopTelemetryLoop();
    this.connected = false;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback('ERROR', 'Simulated Bluetooth signal loss (BLE GATT link dropped)');
    }
  }

  // --- Internal Telemetry Generation ---

  private startTelemetryLoop() {
    this.stopTelemetryLoop();

    // Send initial packet immediately
    this.emitImmediateTelemetry();

    this.telemetryIntervalId = setInterval(() => {
      this.stepSimulation();
    }, 2000);
  }

  private stopTelemetryLoop() {
    if (this.telemetryIntervalId) {
      clearInterval(this.telemetryIntervalId);
      this.telemetryIntervalId = undefined;
    }
    if (this.autoLockTimeoutId) {
      clearTimeout(this.autoLockTimeoutId);
      this.autoLockTimeoutId = undefined;
    }
  }

  private stepSimulation() {
    if (!this.connected) return;

    // Smooth drift towards target temperature with minor physical noise
    const noise = (Math.random() - 0.5) * 0.2;
    const diff = this.targetTemp - this.currentTemp;
    this.currentTemp += diff * 0.4 + noise;
    this.currentTemp = Math.round(this.currentTemp * 10) / 10;

    // Slight realistic jitter in RSSI
    this.rssi = Math.min(-45, Math.max(-85, this.rssi + Math.floor((Math.random() - 0.5) * 4)));

    this.emitImmediateTelemetry();
    this.checkAlerts();
  }

  private emitImmediateTelemetry() {
    const payload = JSON.stringify({
      type: 'telemetry',
      temperature: this.currentTemp,
      door: this.doorState,
      servoAngle: this.servoAngle,
      rssi: this.rssi,
      timestamp: new Date().toISOString(),
    });

    this.emitLine(payload);
  }

  private checkAlerts() {
    if (this.currentTemp >= this.criticalThreshold) {
      this.emitLine(JSON.stringify({
        type: 'alert',
        level: 'CRITICAL',
        temperature: this.currentTemp,
        threshold: this.criticalThreshold,
        timestamp: new Date().toISOString(),
      }));
    } else if (this.currentTemp >= this.warningThreshold) {
      this.emitLine(JSON.stringify({
        type: 'alert',
        level: 'WARNING',
        temperature: this.currentTemp,
        threshold: this.warningThreshold,
        timestamp: new Date().toISOString(),
      }));
    }
  }

  private emitLine(line: string) {
    if (this.onDataCallback) {
      this.onDataCallback(line + '\n');
    }
  }
}
