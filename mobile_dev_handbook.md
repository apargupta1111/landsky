# Landsky Smart Streetlight — Mobile Developer Handbook

This integration handbook outlines the endpoints, payload schemas, command encodings, and interface logic used by the Landsky Smart Streetlighting Web Dashboard. This document is designed to help a mobile developer build a fully compatible companion iOS/Android application.

---

## 1. System Overview

The Landsky platform controls and monitors LoRaWAN-enabled streetlighting nodes via a **Node-RED middleware layer**. The app never talks directly to TTS — all traffic (both telemetry reads and control downlinks) passes through Node-RED.

### Architecture

```
┌─────────────┐     GET /smartlight/data      ┌───────────────┐     MQTT uplink     ┌──────────┐
│ Mobile App  │ ◄────────────────────────────  │               │ ◄──────────────────  │  Device  │
│  (Client)   │                               │   Node-RED    │                      │(LoRaWAN) │
│             │  POST /smartlight/control  ──► │ 13.205.43.53  │  MQTT downlink  ───► │          │
└─────────────┘                               │    :1880      │                      └──────────┘
                                              │               │  ◄──── TTS (The ────►
                                              └───────────────┘       Things Stack)
```

| Component | Role |
| :--- | :--- |
| **Node-RED** | Middleware — caches uplink telemetry, receives control commands, forwards downlinks to TTS via MQTT |
| **TTS (The Things Stack)** | LoRaWAN network server — handles device registration, uplink decoding, and downlink queuing |
| **Device (streetlight-01)** | End-node LoRaWAN device running the MS51FB9AE LED driver |

- **Server IP:** `13.205.43.53`
- **Node-RED port:** `1880`

---

## 2. Authentication (Mock Client-Side Gate)

The web dashboard uses a hardcoded, local authentication gate. You may implement the same credentials for standard login views.

- **Username:** `admin123`
- **Password:** `admin123`

---

## 3. Telemetry API (Fetching Status)

The mobile client should poll this endpoint every **5 seconds** for active telemetry data.

### Request
* **Method:** `GET`
* **URL:** `http://13.205.43.53:1880/smartlight/{deviceId}/data`  
  *(Fallback URL: `http://13.205.43.53:1880/smartlight/data`)*
* **Headers:** `Accept: application/json`

### Response Payload (JSON)
Node-RED returns the latest cached uplink values from the LoRaWAN device:

```json
{
  "device_id": "streetlight-01",
  "ts": 1717431298000,
  "brightness_percent": 100,
  "led_power_W": 45.2,
  "output_current_mA": 350.5,
  "output_voltage_V": 128.3,
  "input_power_W": 48.7,
  "input_voltage_V": 230.1,
  "input_current_mA": 215.3,
  "input_frequency_Hz": 50.0,
  "internal_temp_C": 42.5,
  "power_factor": 0.98,
  "lamp_on_time_hours": 120.4,
  "operating_time_hours": 240.8,
  "rssi": -85,
  "snr": 8.5,
  "fault_status": "0"
}
```

### Telemetry Fields Description

| Key | Description | Unit | Expected Range / Values |
| :--- | :--- | :--- | :--- |
| `device_id` | Unique ID of the physical node | — | E.g. `"streetlight-01"` |
| `ts` | Unix timestamp of last update | ms | Epoch |
| `brightness_percent` | Current dimming level | % | `0` to `100` |
| `led_power_W` | Output power of the LED array | Watts | `0` to `150` |
| `output_current_mA` | DC output current to LEDs | mA | `0` to `700` |
| `output_voltage_V` | DC output voltage | V | `0` to `200` |
| `input_voltage_V` | Mains AC line voltage | V AC | `180` to `265` |
| `input_power_W` | Mains input active power | Watts | `0` to `165` |
| `internal_temp_C` | Temperature inside driver casing | °C | `-20` to `85` (Alert if `> 60`) |
| `rssi` / `snr` | LoRa RF link metrics | dBm / dB | Weak signal if RSSI `< -110` |
| `fault_status` | Status code of the driver microcontroller | — | `"0"` (Healthy), otherwise warning/fault |

---

## 4. Control Downlink API (Sending Commands)

To send a command to a streetlight, the mobile app posts to **Node-RED's control endpoint**. Node-RED receives the command, encodes it into the correct LoRaWAN hex payload (MS51FB9AE driver format, FPort 10), and pushes it as a downlink via TTS MQTT.

> **Important:** Commands do **not** go directly to TTS. The full path is:
> `Mobile App → Node-RED :1880/smartlight/control → TTS MQTT → LoRaWAN Device`

### Request
* **Method:** `POST`
* **URL:** `http://13.205.43.53:1880/smartlight/control`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "method": "command_identifier",
    "value": numeric_parameter
  }
  ```

### Control Command Set

| Function | `"method"` | `"value"` | Downlink Hex Generated (FPort 10) |
| :--- | :--- | :--- | :--- |
| **Power On** | `"powerOn"` | `0` | `0100C8` (Sets dimming to 200 = 100%) |
| **Power Off** | `"powerOff"` | `0` | `010000` (Sets dimming to 0 = off) |
| **Set Brightness** | `"setDimming"` | `0` - `200` | `01[XX]` where `XX` is Hex representation of 0-200 |
| **Set Max Current Limit** | `"setMaxCurrent"` | `10` - `100` | `02[XX]` where `XX` is Hex representation of percentage |
| **Reset Driver** | `"resetDriver"` | `0` | `FF` (Driver software restart) |

> [!NOTE]
> The dimming resolution ranges from **`0` to `200`** in firmware (representing 0% to 100%). For the mobile slider, map a standard 0-100% UI seekbar to values between `0` and `200` when posting to the API.

---

## 5. Map Integration & Geolocation

To match the web dashboard, display the registered devices on an interactive map.

* **Primary Device ID:** `streetlight-01`
* **Physical Location:** Surajpur V Industrial Area, Greater Noida, Uttar Pradesh, India
* **GPS Coordinates:**
  * **Latitude:** `28.4859`
  * **Longitude:** `77.5342`
* **Address string:** `Plot B-6/5, Surajpur Site V — Greater Noida, UP 201306`

### UI Marker Styling Guidelines
- The marker representing the physical device should **always blink red**, showing a strong red glow (`#ef4444`) with a pulsing outer ring effect, to make it distinct as a real-time IoT node.
- Clicking the map pin should open a details card with live telemetry (Status, Brightness, and Power Draw).

---

## 6. Theme and Layout Recommendations

For a seamless look, use these design specifications on mobile:

### Dark Mode Palette (Default)
- **Background (`--bg-color`):** `#020617` (Deep space slate)
- **Panel / Cards (`--panel-bg`):** `#0f172a` at 60% opacity with `16px` backdrop-filter blur
- **Borders (`--panel-border`):** `#00E5FF` at 20% opacity (gives a subtle cybernetic glass glow)
- **Primary Accent (`--accent-primary`):** `#00E5FF` (Neon cyan glow)
- **Text:** `#f8fafc` (Primary), `#94a3b8` (Secondary)

### Light Mode Palette
- **Background (`--bg-color`):** `#ffffff`
- **Panel / Cards (`--panel-bg`):** `#ffffff` with light shadow
- **Borders (`--panel-border`):** `#e2e8f0`
- **Primary Accent (`--accent-primary`):** `#0284c7` (Clean ocean blue)
- **Text:** `#0f172a` (Primary), `#475569` (Secondary)
