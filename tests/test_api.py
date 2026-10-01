"""Integration tests for FastAPI endpoints.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

def test_api_health_and_root():
    with TestClient(app) as client:
        res = client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert data["service"] == "LumiSense"

        res_root = client.get("/")
        assert res_root.status_code == 200

def test_api_system_status():
    with TestClient(app) as client:
        res = client.get("/api/status")
        assert res.status_code == 200
        data = res.json()
        assert "arduino_connected" in data
        assert "database_connected" in data
        assert data["database_connected"] is True
        assert "simulation_mode" in data

def test_api_sensors_latest_and_history():
    with TestClient(app) as client:
        res = client.get("/api/sensors/history?limit=10")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        if len(data) > 0:
            item = data[0]
            assert "light_raw" in item
            assert "motion" in item
            assert "light_smoothed" in item

def test_api_efficiency_score():
    with TestClient(app) as client:
        res = client.get("/api/recommendations/score")
        assert res.status_code == 200
        data = res.json()
        assert 0 <= data["score"] <= 100
        assert "disclaimer" in data
        assert "certified" in data["disclaimer"] # Explains project-defined metric disclaimer

def test_api_ml_status():
    with TestClient(app) as client:
        res = client.get("/api/ml/status")
        assert res.status_code == 200
        data = res.json()
        assert "readiness_state" in data
