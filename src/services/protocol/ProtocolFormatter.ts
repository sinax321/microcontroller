import { Stm32Command } from '../../types';

export class ProtocolFormatter {
  /**
   * Formats a high-level command to newline-delimited JSON
   */
  public static format(cmd: Stm32Command): string {
    const payload: Record<string, unknown> = {
      command: cmd.command,
      timestamp: new Date().toISOString(),
    };

    if (cmd.warningThreshold !== undefined) {
      payload.warning = cmd.warningThreshold;
    }
    if (cmd.criticalThreshold !== undefined) {
      payload.critical = cmd.criticalThreshold;
    }

    return JSON.stringify(payload) + '\n';
  }

  public static unlockDoor(): string {
    return JSON.stringify({ command: 'UNLOCK' }) + '\n';
  }

  public static lockDoor(): string {
    return JSON.stringify({ command: 'LOCK' }) + '\n';
  }

  public static ping(): string {
    return JSON.stringify({ command: 'PING' }) + '\n';
  }

  public static setThresholds(warning: number, critical: number): string {
    return JSON.stringify({
      command: 'SET_THRESHOLDS',
      warning,
      critical,
    }) + '\n';
  }
}
