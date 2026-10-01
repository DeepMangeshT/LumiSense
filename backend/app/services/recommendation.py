"""Rule-based Recommendation Engine for LumiSense.
Generates actionable energy-saving and comfort suggestions based on environmental and occupancy patterns.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.database import insert_recommendation, get_readings_history

class RecommendationEngine:
    @staticmethod
    def evaluate_readings(current_reading: Dict[str, Any], history: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        """Evaluates current and recent readings against heuristic operational rules."""
        generated: List[Dict[str, Any]] = []
        
        light = current_reading.get("light_smoothed") or current_reading.get("light_raw", 0)
        motion = current_reading.get("motion", 0)
        now = datetime.now()
        hour = now.hour

        # Rule 1: High Light + No Motion (Potential Inefficiency)
        # Check if no motion persisted in the last 5 readings
        if light > 380 and motion == 0:
            if history and len(history) >= 4:
                last_few_motion = [r.get("motion", 0) for r in history[-4:]]
                if sum(last_few_motion) == 0:
                    rec = {
                        "rule_code": "HIGH_LIGHT_UNOCCUPIED",
                        "title": "Potential Lighting Inefficiency Detected",
                        "message": (
                            f"Relative light level is sustained at {int(light)} with no detected motion. "
                            "Unoccupied room illumination pattern observed."
                        ),
                        "suggested_action": "Consider switching off artificial fixtures or configuring PIR-based auto shut-off.",
                        "severity": "WARNING"
                    }
                    insert_recommendation(**rec)
                    generated.append(rec)
            else:
                rec = {
                    "rule_code": "HIGH_LIGHT_UNOCCUPIED",
                    "title": "Potential Lighting Inefficiency Detected",
                    "message": f"High light level ({int(light)}) detected while room is unoccupied.",
                    "suggested_action": "Turn off unused luminaires to conserve lighting demand.",
                    "severity": "WARNING"
                }
                insert_recommendation(**rec)
                generated.append(rec)

        # Rule 2: Low Ambient Light + Motion Detected (Lighting Demand / Comfort)
        if light < 140 and motion == 1:
            rec = {
                "rule_code": "LOW_LIGHT_OCCUPIED",
                "title": "Supplementary Lighting Demand Indicated",
                "message": (
                    f"Room activity detected under low ambient lighting ({int(light)} relative units). "
                    "Insufficient illumination for active task performance."
                ),
                "suggested_action": "Enable task lighting or ambient fixtures for ergonomic visual comfort.",
                "severity": "INFO"
            }
            insert_recommendation(**rec)
            generated.append(rec)

        # Rule 3: Abundant Natural Light during Peak Day (10:00 - 16:00)
        if 10 <= hour <= 16 and light > 720:
            rec = {
                "rule_code": "DAYLIGHT_HARVESTING_OPPORTUNITY",
                "title": "Daylight Harvesting Potential",
                "message": (
                    f"Strong ambient light level ({int(light)} relative units) detected during peak solar hours. "
                    "Natural daylight is ample."
                ),
                "suggested_action": "Dim or switch off artificial luminaires to leverage daylight harvesting.",
                "severity": "INFO"
            }
            insert_recommendation(**rec)
            generated.append(rec)

        # Rule 4: Night-time unusual activity (23:00 - 05:00)
        if (hour >= 23 or hour < 5) and motion == 1:
            rec = {
                "rule_code": "OFF_HOURS_ACTIVITY",
                "title": "Unusual Off-Hours Activity Detected",
                "message": f"Motion detected during late night hours ({now.strftime('%H:%M')}).",
                "suggested_action": "Verify if late-night occupancy is expected.",
                "severity": "INFO"
            }
            insert_recommendation(**rec)
            generated.append(rec)

        return generated
