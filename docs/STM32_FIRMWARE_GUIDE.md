# HomeGuard — STM32F103C8T6 Hardware & Firmware Architecture Guide

This guide provides the complete hardware wiring, microcontroller configuration, and communication protocol for the **HomeGuard** IoT qualifier project.

---

## 1. System Hardware Architecture

The HomeGuard embedded node is built around the **STM32F103C8T6 "Blue Pill"** (ARM Cortex-M3 core operating at 72 MHz, 64 KB Flash, 20 KB SRAM).

```
   +--------------------------------------------------------------------+
   |                     HomeGuard Web App (PWA)                        |
   |              (Web Bluetooth BLE / Web Serial UART)                 |
   +---------------------------------+----------------------------------+
                                     | Newline-Delimited JSON (115200bps)
                                     v
   +---------------------------------+----------------------------------+
   |                Bluetooth Wireless Transceiver                      |
   |            (HM-10 BLE 4.0 / HC-05 Classic SPP)                     |
   +---------------------------------+----------------------------------+
                                     | USART1 (PA9 TX / PA10 RX)
                                     v
   +---------------------------------+----------------------------------+
   |             STM32F103C8T6 Blue Pill Microcontroller                |
   |   - MFRC522 SPI Driver       - TIM2_CH1 PWM Servo Controller       |
   |   - Thermal Sensor ADC/1-Wire- JSON Parser & Telemetry Engine      |
   +----------+----------------------+--------------------+-------------+
              |                      |                    |
              v                      v                    v
       +--------------+       +--------------+     +--------------+
       |   MFRC522    |       |  TowerPro    |     |   DS18B20    |
       |  RFID Reader |       |  SG90 Servo  |     |  Temp Sensor |
       | (Perimeter)  |       | (Deadbolt)   |     |  (Ambient)   |
       +--------------+       +--------------+     +--------------+
```

---

## 2. Pinout & Interconnect Table

| Component | Pin Label | STM32F103C8T6 Pin | Peripheral Mode | Voltage Level | Notes |
|---|---|---|---|---|---|
| **Bluetooth (HC-05 / HM-10)** | TXD | PA10 | USART1_RX | 3.3V | Direct connection |
| | RXD | PA9 | USART1_TX | 3.3V | Use 1k/2k divider if 5V module |
| | VCC | 5V / 3.3V | 5V (HC-05) / 3.3V (HM-10) | Power | Ensure stable 50mA supply |
| | GND | GND | Common GND | Power | Common ground |
| **RFID (MFRC522)** | SDA (NSS) | PA4 | SPI1_NSS (GPIO) | 3.3V | Active LOW chip select |
| | SCK | PA5 | SPI1_SCK | 3.3V | Max 10 MHz SPI clock |
| | MISO | PA6 | SPI1_MISO | 3.3V | Master In, Slave Out |
| | MOSI | PA7 | SPI1_MOSI | 3.3V | Master Out, Slave In |
| | RST | PB0 | GPIO Output | 3.3V | Hardware Reset |
| | 3.3V | 3.3V | 3.3V Rail | 3.3V | **Do NOT connect to 5V!** |
| | GND | GND | Common GND | Power | Common ground |
| **Servo Motor (SG90)** | Orange (PWM) | PA0 | TIM2_CH1 (PWM) | 3.3V/5V | 50 Hz PWM (20ms period) |
| | Red (VCC) | 5V | External 5V Rail | 5V | **Do NOT power from Blue Pill 3.3V pin** |
| | Brown (GND) | GND | Common GND | Power | Common ground |
| **Temp Sensor (DS18B20)** | DQ (Data) | PA1 | GPIO Open-Drain | 3.3V | Requires 4.7kΩ pull-up to 3.3V |
| | VCC | 3.3V | 3.3V Rail | 3.3V | Standard power |
| | GND | GND | Common GND | Power | Common ground |

> [!CAUTION]
> **Power Isolation Warning**: The SG90 servo motor pulls instantaneous stall currents of up to 500mA–800mA during rapid rotation. If powered directly from the Blue Pill's internal 3.3V LDO regulator (RT9193 / AMS1117), the microcontroller will brown out and reset. Always supply the servo from an external 5V source with common ground.

---

## 3. Communication Protocol Specification

All communication occurs via standard UART at **115,200 baud, 8 data bits, no parity, 1 stop bit (8-N-1)** using newline-delimited JSON (`\n`).

### 3.1 STM32 &rarr; Dashboard (Downlink Telemetry)

#### Periodic Telemetry Heartbeat (Transmitted every 2.0s):
```json
{"type":"telemetry","temperature":28.4,"door":"LOCKED","servoAngle":0,"rssi":-55,"timestamp":"2026-10-28T20:42:00Z"}
```

#### RFID Card Scan Event (Transmitted immediately upon badge tap):
```json
{"type":"access","memberId":"M001","uid":"E2:7B:44:90","memberName":"Alex Rivera","result":"GRANTED","timestamp":"2026-10-28T20:42:05Z"}
```

#### Hardware Autonomous Alert (Transmitted when sensor crosses threshold):
```json
{"type":"alert","level":"WARNING","temperature":42.1,"threshold":40.0,"timestamp":"2026-10-28T20:42:15Z"}
```

#### Command Acknowledgment (Transmitted upon receipt of a command):
```json
{"type":"ack","command":"UNLOCK","status":"CONFIRMED","servoAngle":90}
```

---

### 3.2 Dashboard &rarr; STM32 (Uplink Commands)

#### Remote Unlock Request:
```json
{"command":"UNLOCK"}
```

#### Remote Lock Request:
```json
{"command":"LOCK"}
```

#### Set Hardware Temperature Safety Thresholds:
```json
{"command":"SET_THRESHOLDS","warning":40.0,"critical":50.0}
```

#### Keep-Alive Ping:
```json
{"command":"PING"}
```

---

## 4. Servo PWM Configuration (TIM2_CH1 on PA0)

The TowerPro SG90 servo requires a 50 Hz PWM signal (period = 20ms):
- **STM32 Timer Clock**: 72 MHz
- **Prescaler (PSC)**: `72 - 1` &rarr; Timer clock = 1 MHz (1 tick = 1 µs)
- **Auto-Reload Register (ARR)**: `20000 - 1` &rarr; Period = 20,000 µs (20 ms = 50 Hz)
- **Pulse Width for 0° (Locked)**: `1000 µs` (CCR1 = 1000)
- **Pulse Width for 90° (Unlocked)**: `1500 µs` to `2000 µs` (CCR1 = 1500–2000)

```c
// Example HAL Configuration:
htim2.Instance = TIM2;
htim2.Init.Prescaler = 71;
htim2.Init.CounterMode = TIM_COUNTERMODE_UP;
htim2.Init.Period = 19999;
htim2.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
HAL_TIM_PWM_Init(&htim2);
```

---

## 5. Qualifier Evaluation Checklist

1. [ ] **Hardware Power Verification**: Verify 3.3V rail measures between 3.25V and 3.35V with multimeter.
2. [ ] **RC522 SPI Check**: Verify SPI clock line toggles at 4–8 MHz when card is presented.
3. [ ] **Servo Duty Cycle**: Verify 1.0ms pulse (locked) and 2.0ms pulse (unlocked) using an oscilloscope or logic analyzer.
4. [ ] **Baud Rate Alignment**: Verify HC-05/HM-10 AT command `AT+BAUD` matches firmware UART baud rate (115200 bps).
5. [ ] **Demo Mode Handover**: Use HomeGuard's Demo Mode to demonstrate full functionality to evaluators before physical hardware pairing.
