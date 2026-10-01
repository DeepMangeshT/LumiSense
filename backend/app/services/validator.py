"""Data validation service for LumiSense sensor data.
Ensures corrupted or out-of-range sensor readings are rejected before storage or ML ingestion.
"""
from typing import Dict, Any, Tuple, Optional
from app.config import settings

class SensorDataValidator:
    @staticmethod
    def validate_reading(data: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """Validates a parsed sensor reading dictionary.
        Returns:
            (is_valid: bool, cleaned_data: Optional[dict], error_msg: Optional[str])
        """
        if not isinstance(data, dict):
            return False, None, "Payload must be a dictionary"

        # 1. Validate light_raw
        if "light_raw" not in data or data["light_raw"] is None:
            return False, None, "Missing mandatory 'light_raw' field"
            
        try:
            light_raw = int(data["light_raw"])
        except (ValueError, TypeError):
            return False, None, f"Invalid 'light_raw' data type: {type(data['light_raw'])}"
            
        if not (settings.LDR_MIN_RAW <= light_raw <= settings.LDR_MAX_RAW):
            return False, None, (
                f"Light reading {light_raw} out of ADC range "
                f"[{settings.LDR_MIN_RAW}, {settings.LDR_MAX_RAW}]"
            )

        # 2. Validate motion
        if "motion" not in data or data["motion"] is None:
            return False, None, "Missing mandatory 'motion' field"
            
        try:
            motion = int(data["motion"])
        except (ValueError, TypeError):
            return False, None, f"Invalid 'motion' data type: {type(data['motion'])}"
            
        if motion not in (0, 1):
            return False, None, f"Motion value must be 0 or 1, got {motion}"

        # 3. Validate optional temperature
        temperature: Optional[float] = None
        if data.get("temperature") is not None:
            try:
                temperature = float(data["temperature"])
                if not (-40.0 <= temperature <= 80.0):
                    return False, None, f"Temperature {temperature}°C outside plausible sensor range [-40, 80]"
            except (ValueError, TypeError):
                return False, None, f"Invalid temperature value: {data['temperature']}"

        # 4. Validate optional humidity
        humidity: Optional[float] = None
        if data.get("humidity") is not None:
            try:
                humidity = float(data["humidity"])
                if not (0.0 <= humidity <= 100.0):
                    return False, None, f"Humidity {humidity}% outside valid range [0, 100]"
            except (ValueError, TypeError):
                return False, None, f"Invalid humidity value: {data['humidity']}"

        cleaned = {
            "light_raw": light_raw,
            "motion": motion,
            "temperature": round(temperature, 1) if temperature is not None else None,
            "humidity": round(humidity, 1) if humidity is not None else None
        }
        return True, cleaned, None
