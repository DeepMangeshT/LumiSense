"""Unit tests for SensorDataValidator and SignalFilter.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.validator import SensorDataValidator
from app.services.filter import SignalFilter

def test_validator_valid_inputs():
    payload = {"light_raw": 222, "motion": 1, "temperature": 25.5, "humidity": 60.0}
    is_valid, cleaned, err = SensorDataValidator.validate_reading(payload)
    assert is_valid is True
    assert err is None
    assert cleaned["light_raw"] == 222
    assert cleaned["motion"] == 1
    assert cleaned["temperature"] == 25.5
    assert cleaned["humidity"] == 60.0

def test_validator_out_of_bounds_light():
    # Negative light
    is_valid, _, err = SensorDataValidator.validate_reading({"light_raw": -5, "motion": 1})
    assert is_valid is False
    assert "out of ADC range" in err

    # Above 1023
    is_valid, _, err = SensorDataValidator.validate_reading({"light_raw": 1050, "motion": 1})
    assert is_valid is False
    assert "out of ADC range" in err

def test_validator_motion_variants():
    is_valid, cleaned, _ = SensorDataValidator.validate_reading({"light_raw": 300, "motion": 0})
    assert is_valid is True
    assert cleaned["motion"] == 0

    is_valid, _, err = SensorDataValidator.validate_reading({"light_raw": 300, "motion": 5})
    assert is_valid is False

def test_validator_humidity_temp_bounds():
    # Invalid humidity > 100
    is_valid, _, err = SensorDataValidator.validate_reading({"light_raw": 300, "motion": 1, "humidity": 120.0})
    assert is_valid is False
    assert "Humidity" in err

def test_signal_filter_moving_average():
    f = SignalFilter(window_size=3)
    assert f.smooth(100) == 100.0
    assert f.smooth(200) == 150.0  # (100 + 200) / 2
    assert f.smooth(300) == 200.0  # (100 + 200 + 300) / 3
    # Next push evicts 100
    assert f.smooth(400) == 300.0  # (200 + 300 + 400) / 3
