"""Unit tests for ML feature engineering and pipeline.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

import pandas as pd
from app.ml.feature_engineering import prepare_features_dataframe, generate_lighting_demand_target, FEATURE_COLUMNS
from app.ml.pipeline import MLPipeline

def test_feature_engineering_columns():
    dummy_data = [
        {"timestamp": "2026-10-01T12:00:00Z", "light_raw": 500, "light_smoothed": 500.0, "motion": 1, "temperature": 25.0, "humidity": 50.0},
        {"timestamp": "2026-10-01T12:01:00Z", "light_raw": 510, "light_smoothed": 505.0, "motion": 1, "temperature": 25.2, "humidity": 50.1},
        {"timestamp": "2026-10-01T12:02:00Z", "light_raw": 520, "light_smoothed": 510.0, "motion": 0, "temperature": 25.4, "humidity": 50.2},
    ]
    df = pd.DataFrame(dummy_data)
    feat_df = prepare_features_dataframe(df)

    for col in FEATURE_COLUMNS:
        assert col in feat_df.columns, f"Missing expected feature {col}"
    assert len(feat_df) == 3

def test_target_generation_logic():
    dummy_data = [
        {"hour": 14, "motion": 1, "light_smoothed": 100.0},  # Low light + motion -> high demand
        {"hour": 14, "motion": 1, "light_smoothed": 800.0},  # High light + motion -> lower demand
        {"hour": 14, "motion": 0, "light_smoothed": 500.0},  # Unoccupied daytime -> 0 demand
    ]
    df = pd.DataFrame(dummy_data)
    targets = generate_lighting_demand_target(df)

    assert targets[0] > targets[1], "Dim occupied room should have higher lighting demand than bright room"
    assert targets[2] == 0.0, "Unoccupied daytime room should have 0 lighting demand"
