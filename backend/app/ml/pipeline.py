"""Machine Learning Pipeline for LumiSense.
Includes:
1. Random Forest Regressor for Estimated Lighting Demand
2. Isolation Forest for Unsupervised Anomaly Detection
3. Data readiness validation (<100 records = Insufficient, 100-500 = Early experimentation, 500+ = Ready)
"""
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, List
import logging

from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

from app.config import settings
from app.database import (
    get_connection, get_total_readings_count,
    save_model_record, get_latest_model_record
)
from app.ml.feature_engineering import (
    prepare_features_dataframe,
    generate_lighting_demand_target,
    FEATURE_COLUMNS
)

logger = logging.getLogger(__name__)

class MLPipeline:
    def __init__(self):
        self.demand_model: Optional[RandomForestRegressor] = None
        self.anomaly_model: Optional[IsolationForest] = None
        self.feature_names: List[str] = FEATURE_COLUMNS
        self.last_trained_at: Optional[datetime] = None
        self.model_metrics: Dict[str, Any] = {}
        self.load_saved_models()

    def load_saved_models(self):
        """Attempts to load pre-trained models from disk."""
        try:
            if settings.DEMAND_MODEL_PATH.exists():
                self.demand_model = joblib.load(settings.DEMAND_MODEL_PATH)
                logger.info(f"Loaded demand regressor from {settings.DEMAND_MODEL_PATH}")
            if settings.ANOMALY_MODEL_PATH.exists():
                self.anomaly_model = joblib.load(settings.ANOMALY_MODEL_PATH)
                logger.info(f"Loaded anomaly detector from {settings.ANOMALY_MODEL_PATH}")
        except Exception as e:
            logger.warning(f"Could not load pre-existing ML models: {e}")

    def check_readiness(self) -> Dict[str, Any]:
        """Evaluates whether sufficient data exists for training."""
        total, real, simulated = get_total_readings_count()
        
        if total < settings.MIN_RECORDS_FOR_EXPERIMENTATION:
            state = "INSUFFICIENT_DATA"
            message = (
                f"Insufficient data ({total} records). At least "
                f"{settings.MIN_RECORDS_FOR_EXPERIMENTATION} records are required for early experimentation."
            )
        elif total < settings.MIN_RECORDS_FOR_TRAINING:
            state = "EARLY_EXPERIMENTATION"
            message = (
                f"Early experimentation phase ({total} records). Training is permitted, "
                f"but {settings.MIN_RECORDS_FOR_TRAINING}+ records recommended for reliable generalization."
            )
        else:
            state = "READY"
            message = f"Optimal training data available ({total} total records: {real} real, {simulated} simulated)."

        latest_rec = get_latest_model_record()
        
        return {
            "readiness_state": state,
            "message": message,
            "total_records": total,
            "real_records_count": real,
            "simulated_records_count": simulated,
            "demand_model_trained": self.demand_model is not None,
            "anomaly_model_trained": self.anomaly_model is not None,
            "model_metadata": latest_rec,
            "min_required_records": settings.MIN_RECORDS_FOR_EXPERIMENTATION
        }

    def train_models(self, include_simulated: bool = True) -> Dict[str, Any]:
        """Extracts dataset from SQLite, trains models, evaluates metrics, and saves to disk."""
        conn = get_connection()
        query = "SELECT * FROM sensor_readings"
        if not include_simulated:
            query += " WHERE source = 'real'"
        query += " ORDER BY timestamp ASC"

        df = pd.read_sql_query(query, conn)
        conn.close()

        if len(df) < settings.MIN_RECORDS_FOR_EXPERIMENTATION:
            return {
                "success": False,
                "message": f"Cannot train: only {len(df)} records available (minimum {settings.MIN_RECORDS_FOR_EXPERIMENTATION} required).",
                "num_samples_used": len(df),
                "data_source_mix": "insufficient"
            }

        # 1. Feature Engineering
        featured_df = prepare_features_dataframe(df)
        y = generate_lighting_demand_target(featured_df)
        X = featured_df[FEATURE_COLUMNS]

        # 2. Train/Test Split (80/20) with no shuffle to respect time-series structure
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

        # 3. Fit Random Forest Regressor
        rf = RandomForestRegressor(
            n_estimators=80,
            max_depth=8,
            min_samples_split=4,
            random_state=42,
            n_jobs=-1
        )
        rf.fit(X_train, y_train)

        # Evaluate Regressor
        y_pred = rf.predict(X_test)
        mae = float(round(mean_absolute_error(y_test, y_pred), 2))
        rmse = float(round(root_mean_squared_error(y_test, y_pred), 2))
        r2 = float(round(r2_score(y_test, y_pred), 3))

        # 4. Fit Isolation Forest for Anomaly Detection
        iso = IsolationForest(
            n_estimators=100,
            contamination=0.04,
            random_state=42,
            n_jobs=-1
        )
        iso.fit(X[["light_smoothed", "motion", "hour", "rolling_light_mean"]])

        # Save to disk
        settings.DEMAND_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(rf, settings.DEMAND_MODEL_PATH)
        joblib.dump(iso, settings.ANOMALY_MODEL_PATH)

        self.demand_model = rf
        self.anomaly_model = iso
        self.last_trained_at = datetime.now(timezone.utc)
        self.model_metrics = {"mae": mae, "rmse": rmse, "r2": r2, "samples": len(df)}

        real_count = (df["source"] == "real").sum() if "source" in df.columns else 0
        sim_count = len(df) - real_count
        mix_str = f"{real_count} real / {sim_count} simulated"

        save_model_record(
            model_name="RandomForestRegressor_v1",
            model_type="demand_regressor",
            num_samples=len(df),
            mae=mae,
            rmse=rmse,
            r2=r2,
            metadata={
                "mix": mix_str,
                "feature_names": FEATURE_COLUMNS,
                "trees": 80
            }
        )

        return {
            "success": True,
            "message": "Models successfully trained and saved.",
            "num_samples_used": len(df),
            "data_source_mix": mix_str,
            "mae": mae,
            "rmse": rmse,
            "r2": r2,
            "trained_at": self.last_trained_at.isoformat(),
            "feature_names": FEATURE_COLUMNS
        }

    def predict_demand(self, reading: Dict[str, Any], recent_history: Optional[List[Dict[str, Any]]] = None) -> float:
        """Infers estimated lighting demand percentage (0 - 100%)."""
        if self.demand_model is None:
            # Fallback heuristic if model not trained yet
            motion = reading.get("motion", 0)
            light = reading.get("light_smoothed") or reading.get("light_raw", 250)
            if motion == 1:
                return round(max(10.0, min(95.0, (1.0 - (light / 900.0)) * 90.0)), 1)
            return 2.0

        try:
            # Construct single-row feature vector
            dt = datetime.now()
            hour = dt.hour
            minute = dt.minute
            day_of_week = dt.weekday()
            is_weekend = 1 if day_of_week >= 5 else 0
            light_smoothed = reading.get("light_smoothed") or reading.get("light_raw", 250)
            motion = reading.get("motion", 0)

            # Rolling estimates from recent history or defaults
            if recent_history and len(recent_history) >= 2:
                recent_lights = [r.get("light_smoothed", light_smoothed) for r in recent_history[-5:]]
                recent_motions = [r.get("motion", motion) for r in recent_history[-5:]]
                rolling_light_mean = float(np.mean(recent_lights))
                rolling_motion_sum = float(np.sum(recent_motions))
                light_lag_1 = float(recent_lights[-2])
                motion_lag_1 = float(recent_motions[-2])
            else:
                rolling_light_mean = float(light_smoothed)
                rolling_motion_sum = float(motion)
                light_lag_1 = float(light_smoothed)
                motion_lag_1 = float(motion)

            feat_vector = pd.DataFrame([{
                "hour": hour,
                "minute": minute,
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                "light_smoothed": light_smoothed,
                "motion": motion,
                "rolling_light_mean": rolling_light_mean,
                "rolling_motion_sum": rolling_motion_sum,
                "light_lag_1": light_lag_1,
                "motion_lag_1": motion_lag_1
            }])

            pred = float(self.demand_model.predict(feat_vector[FEATURE_COLUMNS])[0])
            return round(max(0.0, min(100.0, pred)), 1)
        except Exception as e:
            logger.error(f"Error predicting demand: {e}")
            return 0.0

    def detect_anomaly(self, reading: Dict[str, Any], recent_history: Optional[List[Dict[str, Any]]] = None) -> Tuple[bool, float, Optional[str]]:
        """Returns (is_anomaly, anomaly_score, description)."""
        light = reading.get("light_smoothed") or reading.get("light_raw", 250)
        motion = reading.get("motion", 0)
        dt = datetime.now()
        hour = dt.hour

        # Rule-informed anomaly cues
        # Case 1: Extreme light (> 550) with zero motion late at night
        if light > 550 and motion == 0 and (hour >= 23 or hour < 6):
            return True, -0.65, "High light intensity detected in unoccupied room during late-night hours."

        # Case 2: If isolation forest is available
        if self.anomaly_model is not None:
            try:
                rolling_light = light
                if recent_history and len(recent_history) >= 2:
                    rolling_light = float(np.mean([r.get("light_smoothed", light) for r in recent_history[-5:]]))

                X_iso = pd.DataFrame([{
                    "light_smoothed": light,
                    "motion": motion,
                    "hour": hour,
                    "rolling_light_mean": rolling_light
                }])
                pred = self.anomaly_model.predict(X_iso)[0] # -1 = anomaly, 1 = normal
                score = float(self.anomaly_model.decision_function(X_iso)[0]) # lower = more anomalous
                
                if pred == -1 or score < -0.08:
                    desc = "Statistical anomaly: Environmental reading deviates significantly from normal occupancy pattern."
                    return True, round(score, 3), desc
                return False, round(score, 3), None
            except Exception as e:
                logger.error(f"Anomaly detection exception: {e}")

        # Default fallback
        return False, 0.25, None

# Global ML Pipeline instance
ml_pipeline = MLPipeline()
