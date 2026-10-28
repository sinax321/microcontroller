import { BluetoothTransport } from './BluetoothTransport';
import { ConnectionState, TransportType } from '../../types';

// Web Serial API ambient declarations
declare global {
  interface Navigator {
    serial?: {
      requestPort(options?: { filters?: Array<{ usbVendorId?: number; usbProductId?: number }> }): Promise<SerialPort>;
      getPorts(): Promise<SerialPort[]>;
    };
  }
  interface SerialPort {
    open(options: { baudRate: number; dataBits?: number; stopBits?: number; parity?: string }): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
    getInfo(): { usbVendorId?: number; usbProductId?: number };
  }
}

export class WebSerialTransport implements BluetoothTransport {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private onDataCallback?: (chunk: string) => void;
  private onStatusChangeCallback?: (state: ConnectionState, detail?: string) => void;
  private decoder = new TextDecoder('utf-8');
  private encoder = new TextEncoder();
  private keepReading = false;
  private baudRate: number;

  constructor(baudRate = 115200) {
    this.baudRate = baudRate;
  }

  public getType(): TransportType {
    return 'SERIAL';
  }

  public isConnected(): boolean {
    return !!this.port && !!this.writer;
  }

  public getDeviceName(): string {
    return this.port ? `Serial UART (${this.baudRate} baud)` : 'Serial Disconnected';
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
    if (!navigator.serial) {
      return {
        supported: false,
        reason: 'Web Serial API is not supported in this browser (available in desktop Chrome and Edge).',
      };
    }
    return { supported: true };
  }

  public async connect(): Promise<void> {
    const check = WebSerialTransport.isSupported();
    if (!check.supported) {
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback('ERROR', check.reason);
      }
      throw new Error(check.reason);
    }

    try {
      this.notifyStatus('CONNECTING', 'Selecting Serial/HC-05 COM port...');
      const port = await navigator.serial!.requestPort();
      await port.open({ baudRate: this.baudRate });

      this.port = port;
      this.writer = port.writable ? port.writable.getWriter() : null;
      this.keepReading = true;

      this.notifyStatus('CONNECTED', `Connected to Serial Port at ${this.baudRate} baud`);
      this.startReadingLoop();
    } catch (err: unknown) {
      const error = err as Error;
      let msg = error.message || 'Serial connection failed';
      if (msg.includes('No port selected') || msg.includes('cancelled')) {
        msg = 'Serial port selection cancelled.';
      }
      this.notifyStatus('ERROR', msg);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    this.keepReading = false;
    try {
      if (this.reader) {
        try {
          await this.reader.cancel();
        } catch {
          // ignore
        }
        try {
          this.reader.releaseLock();
        } catch {
          // ignore
        }
        this.reader = null;
      }
      if (this.writer) {
        try {
          await this.writer.close();
        } catch {
          try {
            this.writer.releaseLock();
          } catch {
            // ignore
          }
        }
        this.writer = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (e) {
      console.warn('[WebSerialTransport] Error closing port:', e);
    }
    this.notifyStatus('DISCONNECTED', 'Serial link closed');
  }

  public async send(data: string): Promise<boolean> {
    if (!this.writer) return false;
    try {
      const encoded = this.encoder.encode(data);
      await this.writer.write(encoded);
      return true;
    } catch (err) {
      console.error('[WebSerialTransport] Write error:', err);
      return false;
    }
  }

  private async startReadingLoop() {
    if (!this.port || !this.port.readable) return;

    try {
      while (this.port.readable && this.keepReading) {
        this.reader = this.port.readable.getReader();
        try {
          while (true) {
            const { value, done } = await this.reader.read();
            if (done) break;
            if (value && this.onDataCallback) {
              const text = this.decoder.decode(value);
              this.onDataCallback(text);
            }
          }
        } catch (readErr) {
          console.warn('[WebSerialTransport] Read loop error:', readErr);
        } finally {
          this.reader.releaseLock();
          this.reader = null;
        }
      }
    } catch (err) {
      console.error('[WebSerialTransport] Port read stream failed:', err);
      this.notifyStatus('ERROR', 'Serial connection lost');
    }
  }

  private notifyStatus(state: ConnectionState, detail?: string) {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(state, detail);
    }
  }
}
