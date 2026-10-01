# LumiSense Arduino Hardware Setup

This directory contains the firmware for the **Arduino Uno R3** microcontroller in the LumiSense project.

---

## 1. Hardware Bill of Materials (BOM)

| Component | Quantity | Purpose | Approximate Cost |
| :--- | :--- | :--- | :--- |
| **Arduino Uno R3** | 1 | Microcontroller with 10-bit ADC & USB serial | ~$5 - $8 |
| **LDR Sensor Module** | 1 | LM393 comparator module with analog output (AO) | ~$1 |
| **HC-SR501 PIR Sensor** | 1 | Pyroelectric infrared motion detector | ~$1.50 |
| **USB A-to-B Cable** | 1 | PC serial communication & 5V power supply | Included with Uno |
| **Jumper Wires (M-to-F)** | 6-8 | Breadboard / pin connections | < $1 |
| *(Future) DHT11 Sensor* | 1 | Temperature & Relative Humidity | ~$1.50 |

---

## 2. Wiring Connections

```
┌────────────────────────────────────────────────────────┐
│                      ARDUINO UNO                       │
│                                                        │
│  [5V]  ──────┬──────────┬───────────────────────────── │
│  [GND] ──────┼──────────┼───────────────────────────── │
│  [A0]  ──────┼──────────┼─────────────── (LDR AO)      │
│  [D2]  ──────┼──────────┴─────────────── (PIR OUT)     │
│  [D4]  ──────┴────────────────────────── (DHT11 DATA)* │
└────────────────────────────────────────────────────────┘
```

### Detailed Pin Table

| Sensor | Sensor Pin | Arduino Pin | Description |
| :--- | :--- | :--- | :--- |
| **LDR Module** | VCC | **5V** | 5V DC Power |
| | GND | **GND** | Ground reference |
| | AO | **A0** | **Analog Output** (Continuous 0–1023 relative level) |
| | DO | *Not Connected* | Digital threshold pin (unused) |
| **HC-SR501 PIR** | VCC | **5V** | 5V DC Power |
| | GND | **GND** | Ground reference |
| | OUT | **D2** | **Digital Input** (HIGH = motion, LOW = idle) |
| *(Future) DHT11* | VCC | **5V** | 5V DC Power |
| | GND | **GND** | Ground reference |
| | DATA | **D4** | Single-bus digital reading |

> **Important HC-SR501 Tuning Tip:**
> 1. Set the trigger jumper on the HC-SR501 to **H (Repeatable trigger)**.
> 2. Turn the time delay potentiometer fully counterclockwise (~3 seconds hold time).
> 3. Turn sensitivity potentiometer midway (~4-5 meters range).
> 4. Give the PIR sensor ~15-30 seconds after powering on to calibrate its thermal baseline.

---

## 3. Uploading to Arduino Uno

1. Open **Arduino IDE** (version 1.8.x or 2.x).
2. Open `arduino/lumisense.ino`.
3. Go to **Tools > Board** and select **Arduino Uno**.
4. Go to **Tools > Port** and select your Arduino COM port (e.g. `COM3`, `COM4`, etc.).
5. Click **Upload** (`Ctrl + U`).
6. Open **Tools > Serial Monitor** and verify the baud rate is set to **9600 baud**.
7. You should see output similar to:
   ```text
   Light: 222 | Motion: YES
   Light: 201 | Motion: YES
   Light: 185 | Motion: NO
   ```
8. **Close the Serial Monitor before launching the LumiSense Python backend**, because only one program can hold an open serial connection to a COM port at a time on Windows.
