"""Pydantic data schemas for LumiSense API and data validation.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class SensorReadingBase(BaseModel):
    light_raw: int = Field(..., ge=0, le=1023, description="Raw relative ADC reading from LDR (0-1023)")
    motion: int = Field(..., ge=0, le=1, description="Binary motion presence (0=No, 1=Yes)")
    temperature: Optional[float] = Field(None, description="Optional temperature in Celsius (future sensor)")
    humidity: Optional[float] = Field(None, ge=0.0, le=100.0, description="Optional relative humidity % (future sensor)")

class SensorReadingCreate(SensorReadingBase):
    timestamp: Optional[datetime] = None
    source: str = Field("real", description="'real' or 'simulated'")

class SensorReadingResponse(SensorReadingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    light_smoothed: float = Field(..., description="Moving-average filtered relative light level")
    predicted_demand: Optional[float] = Field(None, description="Estimated Lighting Demand (0-100%)")
    anomaly_score: Optional[float] = Field(None, description="Isolation Forest anomaly score (-1.0 to 1.0)")
    is_anomaly: bool = Field(False, description="Whether flagged as unusual usage pattern")
    source: str

class SystemStatusResponse(BaseModel):
    arduino_connected: bool
    serial_port: Optional[str]
    baud_rate: int
    last_reading_time: Optional[datetime]
    seconds_since_last_reading: Optional[float]
    database_connected: bool
    database_records_count: int
    simulation_mode: bool
    ml_model_ready: bool
    active_model_name: Optional[str]
    smoothing_window: int
    uptime_seconds: float

class AnomalyRecord(BaseModel):
    id: int
    timestamp: datetime
    reading_id: Optional[int]
    light_raw: int
    motion: int
    anomaly_score: float
    description: str
    severity: str  # INFO, WARNING, CRITICAL

class RecommendationItem(BaseModel):
    id: int
    timestamp: datetime
    rule_code: str
    title: str
    message: str
    severity: str
    suggested_action: str
    acknowledged: bool = False

class EfficiencyScoreResponse(BaseModel):
    score: int = Field(..., ge=0, le=100, description="LumiSense Efficiency Score (0-100)")
    rating: str = Field(..., description="Excellent, Good, Fair, Inefficient")
    factors: Dict[str, Any]
    disclaimer: str = (
        "This is a project-defined analytical score reflecting observed light and occupancy patterns, "
        "and should not be interpreted as a certified energy-efficiency rating."
    )

class MLTrainingRequest(BaseModel):
    include_simulated_data: bool = True
    test_size: float = 0.2
    n_estimators: int = 100

class MLTrainingResponse(BaseModel):
    success: bool
    message: str
    num_samples_used: int
    data_source_mix: str
    mae: Optional[float]
    rmse: Optional[float]
    r2: Optional[float]
    trained_at: Optional[datetime]
    feature_names: List[str] = []

class MLStatusResponse(BaseModel):
    readiness_state: str  # INSUFFICIENT_DATA, EARLY_EXPERIMENTATION, READY
    total_records: int
    real_records_count: int
    simulated_records_count: int
    demand_model_trained: bool
    anomaly_model_trained: bool
    model_metadata: Optional[Dict[str, Any]] = None
    min_required_records: int

class SettingsUpdateRequest(BaseModel):
    serial_port: Optional[str] = None
    baud_rate: Optional[int] = None
    smoothing_window: Optional[int] = None
    simulation_mode: Optional[bool] = None

class PortOption(BaseModel):
    device: str
    description: str
    hwid: str
    is_arduino_candidate: bool
