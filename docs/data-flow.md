# LumiSense Data Flow Specification

This document details the lifecycle of sensor telemetry as it travels from physical hardware into the web interface.

---

## 1. End-to-End Data Pipeline

```
[ Arduino Uno ]
      │ analogRead(A0) & digitalRead(D2)
      ▼
Serial String: "Light: 222 | Motion: YES\n"
      │
      ▼ (USB Serial Port at 9600 bps)
[ SerialCollector._run_loop ]
      │ readline()
      ▼
[ SerialDataParser.parse_line ]
      │ Regex & Token Extraction
      ▼
Normalized Dict: {"light_raw": 222, "motion": 1, "temperature": null, "humidity": null}
      │
      ▼
[ SensorDataValidator.validate_reading ]
      │ Checks 0 <= light <= 1023, motion in (0, 1)
      ▼
Validated Telemetry Frame
      │
      ├─────────────────────────────────────────┐
      │                                         │
      ▼                                         ▼
[ SignalFilter.smooth ]             [ MLPipeline Inference ]
      │ Sliding window average N=5              │ Feature Vector creation
      ▼                                         ▼
light_smoothed = 208.4              predicted_demand = 76.5%
                                    is_anomaly = False
      │                                         │
      └────────────────────┬────────────────────┘
                           │
                           ▼
              [ Database.insert_reading ]
                           │
                           ▼
                    SQLite Database
                           │
                           ▼
                [ FastAPI REST APIs ]
              GET /api/sensors/latest
              GET /api/sensors/history
                           │
                           ▼
             [ React / Recharts Dashboard ]
```

---

## 2. Ingestion Stages

### Stage 1: Acquisition
* Physical sensor lines are polled on the Arduino Uno every 1000ms.
* The microcontroller constructs an ASCII message and sends it across the USB COM port.
* The Python `SerialCollector` reads the byte stream and handles carriage returns.

### Stage 2: Normalization & Parsing
* The parser attempts JSON decoding first. If not JSON, it applies regex matching for `Light: <num> | Motion: <val>`.
* If neither applies, it parses comma-separated CSV values.
* Motion tokens (`"YES"`, `"yes"`, `"1"`, `1`) are mapped to integer `1`, and `"NO"` to `0`.

### Stage 3: Range & Sanity Verification
* **Light**: Must be within `[0, 1023]`. Values outside this range are rejected to prevent corrupted bitflips from propagating.
* **Temperature**: If provided by future DHT11, must satisfy `[-40°C, 80°C]`.
* **Humidity**: Must satisfy `[0%, 100%]`.

### Stage 4: Filtering
* Raw analog readings fluctuate due to low-cost LDR noise.
* A rolling FIFO buffer of length $N$ computes:
  $$\text{Smoothed Light} = \frac{1}{N}\sum_{i=1}^N \text{Raw}_i$$
* Both the raw and smoothed values are retained in the database so that raw telemetry integrity is never lost.

### Stage 5: Inference & Persistence
* The newly smoothed frame is matched with recent historical records to generate rolling context.
* Real-time estimated lighting demand and anomaly scores are computed and written synchronously to SQLite.

### Stage 6: Client Delivery
* The React dashboard queries `/api/sensors/latest` every 1.5 seconds, providing dynamic charting without page refreshes.
