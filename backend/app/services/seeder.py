"""Database seeder to generate realistic 24-hour historical records for demo purposes.
Ensures students and evaluators immediately see rich graphs, diurnal light curves,
and valid ML training datasets upon first startup.
"""
import random
from datetime import datetime, timedelta, timezone
from app.database import get_total_readings_count, insert_reading, insert_anomaly
from app.services.simulation import sensor_simulator
from app.services.filter import signal_filter
from app.ml.pipeline import ml_pipeline

def seed_demo_history_if_needed(target_count: int = 600):
    total, real, simulated = get_total_readings_count()
    if total >= 150:
        return # Already has ample data

    print(f"[*] Seeding database with {target_count} realistic historical records...")
    now = datetime.now(timezone.utc)
    interval = timedelta(minutes=24 * 60 / target_count) # Spaced across 24h

    # Reset filter
    signal_filter.set_window_size(5)

    for i in range(target_count):
        past_time = now - (target_count - i) * interval
        # Generate reading for that time of day
        raw = sensor_simulator.generate_reading(past_time)
        light_raw = raw["light_raw"]
        motion = raw["motion"]
        temp = raw["temperature"]
        hum = raw["humidity"]

        light_smoothed = signal_filter.smooth(light_raw)
        
        # Periodic anomaly injection around 2 AM to demonstrate anomaly detection
        is_anomaly = False
        anomaly_score = 0.35
        desc = None

        if past_time.hour == 2 and random.random() < 0.35:
            light_raw = random.randint(620, 780)
            light_smoothed = float(light_raw)
            motion = 0
            is_anomaly = True
            anomaly_score = -0.42
            desc = "High light level detected during late-night unoccupied hours."

        pred_demand = round(max(2.0, min(95.0, (1.0 - (light_smoothed / 900.0)) * 88.0)) if motion == 1 else 3.0, 1)

        reading_id = insert_reading(
            light_raw=light_raw,
            light_smoothed=light_smoothed,
            motion=motion,
            temperature=temp,
            humidity=hum,
            predicted_demand=pred_demand,
            anomaly_score=anomaly_score,
            is_anomaly=is_anomaly,
            source="simulated",
            timestamp_override=past_time
        )

        if is_anomaly:
            insert_anomaly(
                reading_id=reading_id,
                light_raw=light_raw,
                motion=motion,
                anomaly_score=anomaly_score,
                description=desc,
                severity="WARNING"
            )

    # Train baseline ML models on this dataset
    print("[*] Training baseline ML models on initial demo dataset...")
    ml_pipeline.train_models(include_simulated=True)
    print("[+] Seeding and baseline training complete.")
