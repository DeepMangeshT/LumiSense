"""Feature Engineering for LumiSense Machine Learning Pipeline.
Creates temporal, lag, and rolling statistics without data leakage.
Safely accommodates missing temperature and humidity sensors.
"""
import pandas as pd
import numpy as np
from typing import Tuple, List, Optional
from datetime import datetime

# Mandatory feature column names expected by the model
FEATURE_COLUMNS = [
    "hour",
    "minute",
    "day_of_week",
    "is_weekend",
    "light_smoothed",
    "motion",
    "rolling_light_mean",
    "rolling_motion_sum",
    "light_lag_1",
    "motion_lag_1"
]

def prepare_features_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Extracts features from raw sensor readings DataFrame."""
    if df.empty:
        return pd.DataFrame(columns=FEATURE_COLUMNS)

    df = df.copy()
    
    # Parse timestamps
    df["dt"] = pd.to_datetime(df["timestamp"], format="ISO8601", errors="coerce")
    df = df.sort_values("dt").reset_index(drop=True)

    # 1. Temporal features
    df["hour"] = df["dt"].dt.hour.fillna(12).astype(int)
    df["minute"] = df["dt"].dt.minute.fillna(0).astype(int)
    df["day_of_week"] = df["dt"].dt.dayofweek.fillna(0).astype(int)
    df["is_weekend"] = df["day_of_week"].apply(lambda d: 1 if d >= 5 else 0)

    # 2. Rolling features (window = 5 samples)
    df["rolling_light_mean"] = df["light_smoothed"].rolling(window=5, min_periods=1).mean().fillna(df["light_smoothed"])
    df["rolling_motion_sum"] = df["motion"].rolling(window=5, min_periods=1).sum().fillna(df["motion"])

    # 3. Lag features (t-1)
    df["light_lag_1"] = df["light_smoothed"].shift(1).bfill().fillna(df["light_smoothed"])
    df["motion_lag_1"] = df["motion"].shift(1).bfill().fillna(df["motion"])

    # 4. Optional environmental sensors (temperature, humidity)
    if "temperature" in df.columns and df["temperature"].notna().sum() > 10:
        df["temp_clean"] = df["temperature"].ffill().bfill().fillna(24.0)
    else:
        df["temp_clean"] = 24.0

    return df

def generate_lighting_demand_target(df: pd.DataFrame) -> pd.Series:
    """Computes a grounded target variable for 'Estimated Lighting Demand (%)'.
    Based on environmental logic:
    - High motion + dim ambient light = High lighting demand (70 - 100%)
    - High motion + bright natural light = Low supplementary demand (10 - 30%)
    - Zero motion (unoccupied room) = Zero lighting demand needed (0 - 5%)
    """
    demand = []
    for _, row in df.iterrows():
        motion = row["motion"]
        light = row["light_smoothed"]
        hour = row["hour"]

        if motion == 1:
            # Occupant is active: demand depends inversely on available natural daylight
            # If light is low (< 200), demand is ~85-95%
            # If light is bright (> 700), demand is ~10-20%
            ambient_adequacy = max(0.0, min(1.0, light / 800.0))
            active_demand = (1.0 - ambient_adequacy) * 85.0 + 10.0
            demand.append(round(active_demand, 1))
        else:
            # Unoccupied room: ideal lighting demand is 0%
            # Add minor baseline for night security or standby
            night_standby = 5.0 if (hour >= 22 or hour < 6) else 0.0
            demand.append(round(night_standby, 1))

    return pd.Series(demand, name="lighting_demand")
