"""Serial data parser for LumiSense.
Parses multiple incoming formats:
1. Legacy text format: "Light: 222 | Motion: YES"
2. CSV format: "222,1" or "222,1,28.4,63.2" or "timestamp,222,1"
3. JSON format: {"light": 222, "motion": 1, ...}
"""
import re
import json
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class SerialDataParser:
    # Regex for standard text: "Light: 222 | Motion: YES" or "Light: 222, Motion: 1"
    TEXT_PATTERN = re.compile(
        r"light\s*[:=]\s*(?P<light>\d+).*?motion\s*[:=]\s*(?P<motion>[a-zA-Z0-9]+)",
        re.IGNORECASE
    )

    @staticmethod
    def parse_line(raw_line: str) -> Optional[Dict[str, Any]]:
        """Parses a single line of serial data into a normalized dictionary.
        Returns None if the line is empty or cannot be parsed.
        """
        if not raw_line:
            return None
            
        line = raw_line.strip()
        if not line:
            return None
            
        # 1. Try JSON format
        if line.startswith("{") and line.endswith("}"):
            try:
                data = json.loads(line)
                return SerialDataParser._normalize_dict(data)
            except json.JSONDecodeError:
                pass
                
        # 2. Try Standard Text format: "Light: 222 | Motion: YES"
        match = SerialDataParser.TEXT_PATTERN.search(line)
        if match:
            light_val = int(match.group("light"))
            motion_val = match.group("motion")
            return {
                "light_raw": light_val,
                "motion": SerialDataParser._parse_motion_value(motion_val),
                "temperature": None,
                "humidity": None
            }
            
        # 3. Try CSV format: "222,1" or "222,1,26.5,58.0" or "timestamp,222,1"
        if "," in line:
            parts = [p.strip() for p in line.split(",")]
            # Check if first item is timestamp string
            if len(parts) >= 2 and any(c in parts[0] for c in [":", "T", "-"]):
                parts = parts[1:] # Drop timestamp, server applies authoritative timestamp
                
            try:
                if len(parts) >= 2:
                    light_val = int(float(parts[0]))
                    motion_val = SerialDataParser._parse_motion_value(parts[1])
                    temp_val = float(parts[2]) if len(parts) > 2 and parts[2] not in ("", "null", "None") else None
                    hum_val = float(parts[3]) if len(parts) > 3 and parts[3] not in ("", "null", "None") else None
                    return {
                        "light_raw": light_val,
                        "motion": motion_val,
                        "temperature": temp_val,
                        "humidity": hum_val
                    }
            except (ValueError, IndexError):
                pass
                
        logger.warning(f"Could not parse serial data line: '{raw_line}'")
        return None

    @staticmethod
    def _parse_motion_value(val: Any) -> int:
        if isinstance(val, (int, float)):
            return 1 if int(val) > 0 else 0
        s = str(val).strip().lower()
        if s in ("yes", "y", "true", "1", "high", "detected", "motion"):
            return 1
        return 0

    @staticmethod
    def _normalize_dict(d: dict) -> Dict[str, Any]:
        """Normalizes keys from JSON dict."""
        light = d.get("light") or d.get("light_raw") or d.get("ldr") or d.get("light_level")
        motion = d.get("motion") or d.get("pir") or d.get("presence") or d.get("occupancy")
        temp = d.get("temperature") or d.get("temp")
        hum = d.get("humidity") or d.get("hum")
        
        if light is None or motion is None:
            raise ValueError(f"Missing required light or motion in JSON: {d}")
            
        return {
            "light_raw": int(light),
            "motion": SerialDataParser._parse_motion_value(motion),
            "temperature": float(temp) if temp is not None else None,
            "humidity": float(hum) if hum is not None else None
        }
