# HomeGuard — Smart Home Security & Monitoring

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-teal.svg)](https://tailwindcss.com/)
[![Target MCU](https://img.shields.io/badge/Target_MCU-STM32F103C8T6-navy.svg)](https://www.st.com/en/microcontrollers-microprocessors/stm32f103c8.html)

**HomeGuard** is a minimalist, responsive Progressive Web Application (PWA) built for our college IoT qualifier project. It interfaces with an **STM32F103C8T6 "Blue Pill"** microcontroller system to provide real-time ambient temperature telemetry, RFID-based perimeter door access control with an SG90 servo deadbolt actuator, thermal threshold safety warnings, and Bluetooth connectivity.

---

## 1. Key Features & Highlights

- **Live Temperature Telemetry & Time-Series History**:
  - Precision live readout in Celsius (°C).
  - Smooth interactive time-series area chart powered by **Recharts**.
  - Configurable safety thresholds (Warning default: 40°C, Critical default: 50°C).
  - Clear **NORMAL**, **WARNING**, and **CRITICAL** state badges with ambient glow.
  - Stale-data detection banner if the sensor stops transmitting for >15s.

- **RFID Member Credential Directory & Access Log**:
  - Assign human-readable names and roles (e.g. Member 1, Member 2, Evaluator pass) to raw RFID UID hex strings.
  - Distinguishes **ACCESS GRANTED** from **ACCESS DENIED**.
  - Full chronological access history table with instant search and CSV export.
  - Clear disclaimer: access logs indicate card scan events at the perimeter reader and do not represent verified room occupancy.

- **Perimeter Door & Actuator Control**:
  - Real-time **LOCKED** and **UNLOCKED** state indicator.
  - Reports hardware servo position (e.g., 0° locked vs 90° unlocked) when transmitted by the microcontroller.
  - **Strict Confirmation Architecture**: Remote lock/unlock requests enter a pending state and will **never** display as successful until positive acknowledgment (`ACK`) is received from the STM32.

- **Safety Alert Incident Monitor**:
  - Prominent warning banners when ambient temperature reaches or exceeds configured limits.
  - Edge-triggered alert logic prevents duplicate spam while the same warning level remains active.
  - Single-click acknowledgement with timestamp recording.
  - Optional synthesized Web Audio chimes and mobile haptic vibration.

- **Modular Transport Layer**:
  - **Demo Mode**: Built-in virtual STM32 hardware simulation with temperature drift, RFID card tap simulation, servo auto-relock, and link drop testing.
  - **Web Bluetooth (BLE)**: Connects to HM-10, nRF52, or ESP32 BLE GATT UART service on Chrome/Edge (macOS & Android).
  - **Web Serial**: Connects directly via USB-UART adapter (CH340/CP2102) or paired HC-05 Bluetooth SPP COM ports on desktop browsers.

---

## 2. Technology Stack

- **Frontend**: React 18 with TypeScript
- **Bundler & Dev Server**: Vite 5
- **Styling**: Tailwind CSS (Sophisticated dark charcoal `#0B0F17`, slate surfaces, restrained teal `#14B8A6` accents, amber warnings `#F59E0B`, red critical `#EF4444`)
- **Icons**: Lucide React
- **Data Visualization**: Recharts (smooth responsive SVG time-series charts)
- **Audio & Haptics**: Native Web Audio API synthesis & Navigator Vibration API (zero external MP3 dependencies)
- **PWA**: Web App Manifest (`manifest.json`) and Service Worker (`sw.js`)

---

## 3. Getting Started

### Prerequisites
- Node.js (v18 or higher; v22 recommended)
- npm (v9 or higher)
- Google Chrome, Microsoft Edge, or Opera (for Web Bluetooth and Web Serial API support)

### Installation & Development Run

1. Clone or navigate into the project directory:
   ```bash
   cd "micro controller"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch local Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser to: **`http://localhost:3000`**

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview production build locally:
   ```bash
   npm run preview
   ```

---

## 4. How to Use Demo Mode (Evaluation / Presentation)

HomeGuard automatically launches in **Demo Mode** on first load so you can demonstrate the full application without needing immediate access to physical hardware:

1. **Top Banner**: Notice the **DEMO MODE ACTIVE** indicator.
2. **Temperature Testing**:
   - Click **27°C (Normal)** to simulate standard room temperature.
   - Click **42°C (Warning)** to trigger the warning threshold (&ge;40°C) with audio chime.
   - Click **53°C (Critical)** to trigger the high-priority critical alert banner and rapid alarm beeps.
3. **RFID Access Testing**:
   - Click **Tap Card (Granted)** to simulate Member 1 (Alex Rivera) scanning at the door. Watch the servo unlock to 90° and automatically re-lock after 5 seconds!
   - Click **Unknown Card (Denied)** to simulate an unauthorized card swipe.
4. **Link Failure Simulation**:
   - Click **Drop Link** to simulate Bluetooth packet loss. Notice how the stale data detector flags the missing sensor telemetry after 15 seconds.
   - Click **Reconnect** to restore the telemetry stream.
5. **Interactive Sim Bench**:
   - Click **Sim Controls** or **Sim Bench** in the header to open the full test bench modal with a smooth temperature slider and registered member card picker.

---

## 5. Microcontroller Communication Protocol

HomeGuard communicates with the STM32 Blue Pill over standard UART using **newline-delimited JSON (`\n`)** at 115,200 baud.

### Downlink Telemetry (STM32 &rarr; Web Dashboard):
```json
{"type":"telemetry","temperature":28.4,"door":"LOCKED","servoAngle":0,"rssi":-55}
```

### Access Event (STM32 &rarr; Web Dashboard):
```json
{"type":"access","memberId":"M001","uid":"E2:7B:44:90","memberName":"Alex Rivera","result":"GRANTED","timestamp":"2026-10-28T20:42:00Z"}
```

### Uplink Commands (Web Dashboard &rarr; STM32):
```json
{"command":"UNLOCK"}
{"command":"LOCK"}
{"command":"SET_THRESHOLDS","warning":40,"critical":50}
{"command":"PING"}
```

---

## 6. Physical Hardware Integration & Pinout

For full circuit schematics, HAL C reference code, and peripheral configurations, see:
- [`docs/STM32_FIRMWARE_GUIDE.md`](./docs/STM32_FIRMWARE_GUIDE.md)
- [`docs/stm32_sample_main.c`](./docs/stm32_sample_main.c)

### Hardware Interconnect Summary:
| Peripheral | STM32 Pin | Function |
|---|---|---|
| **HC-05 / HM-10 Bluetooth** | PA9 (TX), PA10 (RX) | USART1 Serial Telemetry (115200 baud) |
| **MFRC522 RFID Reader** | PA4 (NSS), PA5 (SCK), PA6 (MISO), PA7 (MOSI), PB0 (RST) | SPI1 Access Scanner (3.3V) |
| **SG90 Servo Actuator** | PA0 (TIM2_CH1 PWM) | 50Hz PWM Deadbolt (1ms lock / 2ms unlock) |
| **DS18B20 Temperature** | PA1 (GPIO / 1-Wire) | Ambient Temperature Probe (4.7kΩ pull-up) |

---

## 7. Real Hardware vs. Software Simulation Breakdown

To maintain academic transparency during qualifier defense, here is an explicit list of what is handled in software vs. what requires physical hardware:

### Requiring Physical Hardware & Flashed STM32 Firmware:
- Physical RF electromagnetic badge excitation and 13.56MHz UID reading (MFRC522).
- Physical mechanical movement of the door deadbolt (SG90 servo gears and PWM pulse width).
- Physical analog thermal semiconductor measurements (DS18B20 1-Wire scratchpad).
- Over-the-air 2.4 GHz Bluetooth RF transmission (HM-10 BLE or HC-05 radio).

### Handled in HomeGuard Web Application:
- Real-time time-series graphing, statistical tracking (Min/Max/Avg), and UI rendering.
- Newline-delimited JSON packet buffering, streaming fragmentation reassembly, and validation.
- User-configurable safety thresholds (warning and critical) and hysteresis state transitions.
- Human-readable name directory mapping for RFID UIDs.
- Access audit logging, CSV export, and persistent browser storage.
- Synthesized Web Audio warning alarms and mobile haptic feedback.
- Bluetooth transport abstraction supporting Demo, Web BLE, and Web Serial.

---

## 8. Progressive Web App (PWA) Installation

HomeGuard includes a standalone Web App Manifest and Service Worker:
- **On Android**: Open the site in Google Chrome, tap the 3-dot menu, and select **"Add to Home screen"** or **"Install App"**.
- **On macOS (Chrome/Edge)**: Click the install icon in the URL omnibox to install HomeGuard as an independent macOS desktop application window.

---

## 9. Educational Disclaimer

HomeGuard is developed as an educational IoT qualifier project. It is **not** certified as a life-safety industrial fire, smoke, or gas detection system, nor as an accredited bank-grade physical security barrier.
