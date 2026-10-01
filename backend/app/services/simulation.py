"""Realistic sensor simulation generator for LumiSense.
Generates physics-informed environmental readings:
- Diurnal light variation following solar elevation curve
- Correlated occupant movement patterns (office/room hours vs night)
- Ambient sensor noise and occasional deliberate anomalies for testing
- Synthetic temperature and humidity readings
"""
import math
import random
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional

class SensorSimulator:
    def __init__(self):
        self.anomaly_mode: bool = False
        self.anomaly_counter: int = 0
        self.anomaly_type: Optional[str] = None
        self._last_light: int = 250
        self._motion_hold_counter: int = 0
        self._occupied: bool = False

    def trigger_anomaly(self, anomaly_type: str = "high_light_unoccupied", duration_steps: int = 15):
        """Forces an anomaly for demonstration purposes."""
        self.anomaly_mode = True
        self.anomaly_type = anomaly_type
        self.anomaly_counter = duration_steps

    def generate_reading(self, dt: Optional[datetime] = None) -> Dict[str, Any]:
        """Generates a realistic sensor reading for the given timestamp (or now)."""
        now = dt or datetime.now()
        hour = now.hour + (now.minute / 60.0) + (now.second / 3600.0)

        # 1. Base ambient daylight curve (solar elevation simulation)
        # Peak sunlight between 11:30 and 14:30 (~600-850 ADC relative units)
        # Dark nighttime between 20:00 and 05:30 (~20-80 ADC relative units)
        solar_factor = 0.0
        if 6.0 <= hour <= 18.5:
            # Daytime sine curve
            solar_factor = math.sin(math.pi * (hour - 6.0) / 12.5)
            solar_factor = max(0.0, solar_factor)

        base_ambient_light = 40.0 + (solar_factor * 620.0)

        # 2. Occupancy & Motion simulation
        # Daytime office/study hours (08:30 to 18:30) have higher chance of presence
        prob_occupancy = 0.70 if (8.5 <= hour <= 18.5) else (0.35 if (18.5 < hour <= 22.5) else 0.05)
        
        # Room occupancy transitions with a Markov-like persistence
        if random.random() < 0.15:
            self._occupied = random.random() < prob_occupancy

        # Motion detection: if occupied, motion occurs frequently (PIR trigger)
        if self._occupied:
            # If occupied, 65% chance of motion pulse, or continuous motion
            motion = 1 if random.random() < 0.65 else 0
        else:
            # Sporadic false positive or pet movement 2%
            motion = 1 if random.random() < 0.02 else 0

        # Artificial room lighting:
        # If room is occupied and natural light is dim (< 350), artificial light is turned ON (~250-400 extra units)
        artificial_light = 0.0
        if self._occupied and base_ambient_light < 350:
            artificial_light = random.uniform(280, 420)
        elif self._occupied:
            # Sometimes lights remain on even with window light
            artificial_light = random.uniform(50, 150)

        # Total light with sensor noise (+-10 units typical for LDR)
        noise = random.gauss(0, 7.5)
        total_light = int(base_ambient_light + artificial_light + noise)

        # 3. Handle Anomaly Injection (for demo / ML verification)
        if self.anomaly_mode and self.anomaly_counter > 0:
            self.anomaly_counter -= 1
            if self.anomaly_type == "high_light_unoccupied":
                # Blazing artificial lights at 650 with zero motion
                total_light = int(680 + random.gauss(0, 8))
                motion = 0
            elif self.anomaly_type == "light_spike":
                total_light = 990
                motion = 1
            if self.anomaly_counter <= 0:
                self.anomaly_mode = False
                self.anomaly_type = None

        # Clamp to 10-bit ADC [0, 1023]
        total_light = max(0, min(1023, total_light))
        self._last_light = total_light

        # 4. Realistic Temperature & Humidity (DHT11-like simulation)
        # Daily temp cycle: lowest at 5am (22°C), highest at 2pm (30°C)
        temp_factor = math.sin(math.pi * (hour - 8.0) / 12.0)
        sim_temperature = round(25.0 + (temp_factor * 4.5) + random.uniform(-0.3, 0.3), 1)

        # Humidity is inversely correlated to temperature
        sim_humidity = round(58.0 - (temp_factor * 12.0) + random.uniform(-1.0, 1.0), 1)
        sim_humidity = max(20.0, min(95.0, sim_humidity))

        return {
            "light_raw": total_light,
            "motion": motion,
            "temperature": sim_temperature,
            "humidity": sim_humidity
        }

# Global simulator instance
sensor_simulator = SensorSimulator()
