import { TelemetryData, AccessEvent, TemperatureAlert } from '../../types';

export type ParsedMessage = 
  | { kind: 'telemetry'; data: TelemetryData }
  | { kind: 'access'; data: AccessEvent }
  | { kind: 'alert'; data: TemperatureAlert }
  | { kind: 'ack'; command: string; status: string; servoAngle?: number }
  | { kind: 'unknown'; raw: string };

export class ProtocolParser {
  private buffer: string = '';
  private onMessageCallback?: (msg: ParsedMessage) => void;
  private onRawLineCallback?: (line: string) => void;

  constructor(
    onMessage?: (msg: ParsedMessage) => void,
    onRawLine?: (line: string) => void
  ) {
    this.onMessageCallback = onMessage;
    this.onRawLineCallback = onRawLine;
  }

  public setCallbacks(
    onMessage: (msg: ParsedMessage) => void,
    onRawLine?: (line: string) => void
  ) {
    this.onMessageCallback = onMessage;
    this.onRawLineCallback = onRawLine;
  }

  /**
   * Feed raw incoming stream chunks (from BLE notification or Serial data)
   */
  public pushChunk(chunk: string): ParsedMessage[] {
    this.buffer += chunk;
    const messages: ParsedMessage[] = [];

    // Split on newline (\r\n or \n)
    let newlineIndex: number;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (line.length === 0) continue;

      if (this.onRawLineCallback) {
        this.onRawLineCallback(line);
      }

      const parsed = this.parseLine(line);
      if (parsed) {
        messages.push(parsed);
        if (this.onMessageCallback) {
          this.onMessageCallback(parsed);
        }
      }
    }

    // Safety: prevent buffer from growing indefinitely if no newline is received
    if (this.buffer.length > 4096) {
      console.warn('[ProtocolParser] Buffer overflow without newline delimiter. Clearing buffer.');
      this.buffer = '';
    }

    return messages;
  }

  /**
   * Parse a single JSON line
   */
  public parseLine(line: string): ParsedMessage | null {
    try {
      const obj = JSON.parse(line);
      if (typeof obj !== 'object' || obj === null) {
        return { kind: 'unknown', raw: line };
      }

      // Check message type
      const type = obj.type || obj.event;

      if (type === 'telemetry') {
        const temperature = typeof obj.temperature === 'number' ? Number(obj.temperature.toFixed(1)) : 0;
        const door = obj.door === 'UNLOCKED' ? 'UNLOCKED' : 'LOCKED';
        const servoAngle = typeof obj.servoAngle === 'number' ? obj.servoAngle : undefined;
        const rssi = typeof obj.rssi === 'number' ? obj.rssi : undefined;
        const timestamp = obj.timestamp || new Date().toISOString();

        return {
          kind: 'telemetry',
          data: {
            temperature,
            door,
            servoAngle,
            rssi,
            timestamp,
            isStale: false,
          },
        };
      }

      if (type === 'access') {
        const uid = String(obj.uid || obj.cardUid || 'UNKNOWN').toUpperCase();
        const memberId = obj.memberId ? String(obj.memberId) : undefined;
        const memberName = String(obj.memberName || obj.name || 'Unknown Member');
        const result = obj.result === 'GRANTED' ? 'GRANTED' : 'DENIED';
        const timestamp = obj.timestamp || new Date().toISOString();

        return {
          kind: 'access',
          data: {
            id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            type: 'access',
            uid,
            memberId,
            memberName,
            result,
            timestamp,
          },
        };
      }

      if (type === 'alert') {
        const level = obj.level === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
        const temperature = typeof obj.temperature === 'number' ? Number(obj.temperature.toFixed(1)) : 0;
        const threshold = typeof obj.threshold === 'number' ? obj.threshold : 40;
        const timestamp = obj.timestamp || new Date().toISOString();

        return {
          kind: 'alert',
          data: {
            id: 'alt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            level,
            temperature,
            threshold,
            timestamp,
            acknowledged: false,
            message: `Temperature threshold reached: ${temperature}°C (Limit: ${threshold}°C)`,
          },
        };
      }

      if (type === 'ack') {
        return {
          kind: 'ack',
          command: String(obj.command || ''),
          status: String(obj.status || 'OK'),
          servoAngle: typeof obj.servoAngle === 'number' ? obj.servoAngle : undefined,
        };
      }

      return { kind: 'unknown', raw: line };
    } catch {
      // Malformed JSON is caught gracefully
      console.debug('[ProtocolParser] Malformed JSON received:', line);
      return { kind: 'unknown', raw: line };
    }
  }

  public resetBuffer() {
    this.buffer = '';
  }
}
